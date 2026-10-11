import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.js';

export interface AttachmentRecord {
  key: string;
  ownerId: string;
  contentType: string;
  size: number;
  complaintIds: string[];
  createdAt: string;
}

const attachments = new Map<string, AttachmentRecord>();
let pendingWrite: Promise<void> = Promise.resolve();
let s3Client: S3Client | null = null;

function getUploadDirectory(): string {
  return resolve(process.env.UPLOAD_DIR ?? '.data/uploads');
}

function getAttachmentMetadataFile(): string {
  return resolve(process.env.ATTACHMENT_METADATA_FILE ?? '.data/attachments.json');
}

function getObjectStore(): { bucket: string; client: S3Client } | null {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.S3_REGION ?? 'auto',
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? { credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } }
        : {}),
    });
  }
  return { bucket, client: s3Client };
}

export function validateAttachmentStorageConfiguration(production: boolean): void {
  const bucket = process.env.S3_BUCKET?.trim();
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const accessKey = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  if (production && !bucket) {
    throw new Error('S3_BUCKET is required in production for durable complaint photo storage.');
  }
  if (Boolean(accessKey) !== Boolean(secretKey)) {
    throw new Error('S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be configured together.');
  }
  if (production && endpoint && new URL(endpoint).protocol !== 'https:') {
    throw new Error('S3_ENDPOINT must use HTTPS in production.');
  }
}

export function closeAttachmentStore(): void {
  s3Client?.destroy();
  s3Client = null;
}

export async function verifyAttachmentObjectStore(): Promise<void> {
  const objectStore = getObjectStore();
  if (!objectStore) {
    if (process.env.NODE_ENV === 'production') throw new Error(objectStoreUnavailableMessage());
    return;
  }
  try {
    await objectStore.client.send(new HeadBucketCommand({ Bucket: objectStore.bucket }));
  } catch (error) {
    throw new Error(`S3-compatible bucket verification failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function objectStoreUnavailableMessage(): string {
  return 'S3_BUCKET is not configured; local filesystem storage is only available outside production.';
}

function extensionFor(contentType: string): string {
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/png') return 'png';
  return 'webp';
}

export function detectImageMime(contents: Buffer): string | null {
  if (contents.length >= 3 && contents[0] === 0xff && contents[1] === 0xd8 && contents[2] === 0xff) {
    return 'image/jpeg';
  }
  if (contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (contents.length >= 12
    && contents.toString('ascii', 0, 4) === 'RIFF'
    && contents.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

async function persistMetadata(): Promise<void> {
  const attachmentMetadataFile = getAttachmentMetadataFile();
  const write = pendingWrite.then(async () => {
    const serialized = `${JSON.stringify(Array.from(attachments.values()), null, 2)}\n`;
    await mkdir(dirname(attachmentMetadataFile), { recursive: true, mode: 0o700 });
    const tempFile = `${attachmentMetadataFile}.${process.pid}.${uuidv4()}.tmp`;
    try {
      await writeFile(tempFile, serialized, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
      await rename(tempFile, attachmentMetadataFile);
    } finally {
      await rm(tempFile, { force: true });
    }
  });
  pendingWrite = write.catch(() => {});
  await write;
}

export async function loadAttachmentMetadata(): Promise<void> {
  const attachmentMetadataFile = getAttachmentMetadataFile();
  const collection = getDatabase()?.collection<AttachmentRecord>('attachments');
  if (collection) return;
  let serialized: string;
  try {
    serialized = await readFile(attachmentMetadataFile, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  const records: unknown = JSON.parse(serialized);
  if (!Array.isArray(records) || !records.every(record =>
    record && typeof record.key === 'string' && typeof record.ownerId === 'string'
    && typeof record.contentType === 'string' && typeof record.size === 'number'
    && Array.isArray(record.complaintIds) && typeof record.createdAt === 'string')) {
    throw new Error(`Invalid attachment metadata file: ${attachmentMetadataFile}`);
  }
  for (const record of records as AttachmentRecord[]) {
    if (attachments.has(record.key)) throw new Error(`Duplicate attachment key: ${record.key}`);
    attachments.set(record.key, record);
  }
}

export const attachmentStore = {
  async save(contents: Buffer, ownerId: string, contentType: string): Promise<AttachmentRecord> {
    const key = `${uuidv4()}.${extensionFor(contentType)}`;
    const record: AttachmentRecord = {
      key,
      ownerId,
      contentType,
      size: contents.byteLength,
      complaintIds: [],
      createdAt: new Date().toISOString(),
    };

    try {
      const objectStore = getObjectStore();
      if (objectStore) {
        await objectStore.client.send(new PutObjectCommand({
          Bucket: objectStore.bucket,
          Key: key,
          Body: contents,
          ContentType: contentType,
          CacheControl: 'private, no-store',
        }));
      } else {
        if (process.env.NODE_ENV === 'production') throw new Error(objectStoreUnavailableMessage());
        const uploadDirectory = getUploadDirectory();
        await mkdir(uploadDirectory, { recursive: true, mode: 0o700 });
        await writeFile(resolve(uploadDirectory, key), contents, { flag: 'wx', mode: 0o600 });
      }

      const collection = getDatabase()?.collection<AttachmentRecord>('attachments');
      if (collection) {
        await collection.insertOne(record);
      } else {
        attachments.set(key, record);
        try {
          await persistMetadata();
        } catch (error) {
          attachments.delete(key);
          throw error;
        }
      }
      return record;
    } catch (error) {
      const objectStore = getObjectStore();
      if (objectStore) {
        await objectStore.client.send(new DeleteObjectCommand({ Bucket: objectStore.bucket, Key: key }))
          .catch(cleanupError => console.error('[attachments] Failed to clean up unlinked S3 object:', cleanupError));
      } else {
        const uploadDirectory = getUploadDirectory();
        await import('node:fs/promises').then(fs => fs.unlink(resolve(uploadDirectory, key)).catch(cleanupError => {
          if ((cleanupError as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.error('[attachments] Failed to clean up unlinked local object:', cleanupError);
          }
        }));
      }
      throw error;
    }
  },

  async find(key: string): Promise<AttachmentRecord | null> {
    const collection = getDatabase()?.collection<AttachmentRecord>('attachments');
    if (collection) return collection.findOne({ key });
    return attachments.get(key) ?? null;
  },

  async importLegacy(contents: Buffer, record: AttachmentRecord): Promise<void> {
    if (!/^[0-9a-f-]{36}\.(?:jpg|png|webp)$/i.test(record.key)
      || !['image/jpeg', 'image/png', 'image/webp'].includes(record.contentType)
      || contents.byteLength !== record.size) {
      throw new Error(`Invalid attachment migration record for ${record.key}.`);
    }
    const existing = await this.find(record.key);
    const existingBytes = await this.read(record.key);
    if (existing) {
      if (existing.ownerId !== record.ownerId
        || existing.contentType !== record.contentType
        || !existingBytes?.equals(contents)) {
        throw new Error(`Attachment key conflict: ${record.key}. Existing metadata or bytes differ; no data was changed.`);
      }
      for (const complaintId of record.complaintIds) {
        if (!await this.linkToComplaint(record.key, complaintId, record.ownerId)) {
          throw new Error(`Could not verify migrated attachment ownership for ${record.key}.`);
        }
      }
      return;
    }
    if (existingBytes && !existingBytes.equals(contents)) {
      throw new Error(`Target object key conflict: ${record.key}. Existing bytes differ; no data was changed.`);
    }

    const objectStore = getObjectStore();
    if (!existingBytes) {
      if (objectStore) {
        await objectStore.client.send(new PutObjectCommand({
          Bucket: objectStore.bucket,
          Key: record.key,
          Body: contents,
          ContentType: record.contentType,
          CacheControl: 'private, no-store',
        }));
      } else {
        if (process.env.NODE_ENV === 'production') throw new Error(objectStoreUnavailableMessage());
        const uploadDirectory = getUploadDirectory();
        await mkdir(uploadDirectory, { recursive: true, mode: 0o700 });
        await writeFile(resolve(uploadDirectory, record.key), contents, { flag: 'wx', mode: 0o600 });
      }
    }

    try {
      const collection = getDatabase()?.collection<AttachmentRecord>('attachments');
      if (collection) {
        await collection.insertOne(record);
      } else {
        attachments.set(record.key, record);
        try {
          await persistMetadata();
        } catch (error) {
          attachments.delete(record.key);
          throw error;
        }
      }
    } catch (error) {
      if (!existingBytes) {
        if (objectStore) {
          await objectStore.client.send(new DeleteObjectCommand({ Bucket: objectStore.bucket, Key: record.key }))
            .catch(cleanupError => console.error('[attachments] Failed to clean up migrated S3 object:', cleanupError));
        } else {
          const uploadDirectory = getUploadDirectory();
          const fs = await import('node:fs/promises');
          await fs.unlink(resolve(uploadDirectory, record.key)).catch(cleanupError => {
            if ((cleanupError as NodeJS.ErrnoException).code !== 'ENOENT') {
              console.error('[attachments] Failed to clean up migrated local object:', cleanupError);
            }
          });
        }
      }
      throw error;
    }
  },

  async read(key: string): Promise<Buffer | null> {
    try {
      const objectStore = getObjectStore();
      if (objectStore) {
        const response = await objectStore.client.send(new GetObjectCommand({ Bucket: objectStore.bucket, Key: key }));
        const data = await response.Body?.transformToByteArray();
        return data ? Buffer.from(data) : null;
      }
      if (process.env.NODE_ENV === 'production') throw new Error(objectStoreUnavailableMessage());
      const uploadDirectory = getUploadDirectory();
      return await readFile(resolve(uploadDirectory, key));
    } catch (error) {
      const name = (error as { name?: string; code?: string }).name;
      const code = (error as { code?: string }).code;
      if (name === 'NoSuchKey' || code === 'ENOENT' || code === 'NoSuchKey') return null;
      throw error;
    }
  },

  async linkToComplaint(key: string, complaintId: string, ownerId: string): Promise<boolean> {
    const collection = getDatabase()?.collection<AttachmentRecord>('attachments');
    if (collection) {
      const result = await collection.updateOne(
        { key, ownerId },
        { $addToSet: { complaintIds: complaintId } }
      );
      return result.matchedCount === 1;
    }
    const record = attachments.get(key);
    if (!record || record.ownerId !== ownerId) return false;
    if (!record.complaintIds.includes(complaintId)) {
      record.complaintIds.push(complaintId);
      try {
        await persistMetadata();
      } catch (error) {
        record.complaintIds = record.complaintIds.filter(id => id !== complaintId);
        throw error;
      }
    }
    return true;
  },
};
