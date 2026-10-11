import { lstat, readFile, realpath } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import dotenv from 'dotenv';
import {
  attachmentStore,
  closeAttachmentStore,
  detectImageMime,
  loadAttachmentMetadata,
  type AttachmentRecord,
} from '../server/attachmentStore.js';
import { closeDatabase, connectDatabase, getDatabase } from '../server/database.js';
import { complaintStore, loadComplaints } from '../server/complaintStore.js';
import { initializeUserStore, userStore } from '../server/store.js';

interface LegacyAttachmentManifestEntry {
  key: string;
  ownerEmail: string;
  complaintIds?: string[];
}

const args = process.argv.slice(2);
const valueAfter = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

function usage(): never {
  throw new Error(
    'Usage: npm run migrate:attachments -- --manifest <manifest.json> --source-dir <old-upload-directory> [--apply]'
  );
}

async function prepareStores(): Promise<void> {
  await connectDatabase();
  if (!getDatabase()) {
    await initializeUserStore();
    await Promise.all([loadComplaints(), loadAttachmentMetadata()]);
  }
}

async function main(): Promise<void> {
  dotenv.config();
  const manifestPath = valueAfter('--manifest');
  const sourcePath = valueAfter('--source-dir');
  const apply = args.includes('--apply');
  if (!manifestPath || !sourcePath) usage();

  try {
    await prepareStores();
    const sourceDirectory = await realpath(sourcePath);
    const rawManifest = await readFile(manifestPath, 'utf8');
    if (Buffer.byteLength(rawManifest, 'utf8') > 5 * 1024 * 1024) {
      throw new Error('Attachment manifest exceeds 5 MB.');
    }
    const parsed: unknown = JSON.parse(rawManifest);
    if (!Array.isArray(parsed)) throw new Error('Expected the attachment manifest to be a JSON array.');

    const complaintRecords = await complaintStore.list();
    const byComplaintId = new Map(complaintRecords.map(complaint => [complaint.id, complaint]));
    const seenKeys = new Set<string>();
    const prepared: Array<{ bytes: Buffer; record: AttachmentRecord; pendingComplaintIds: string[] }> = [];
    for (const [index, value] of parsed.entries()) {
      if (!value || typeof value !== 'object') throw new Error(`Manifest entry ${index + 1} is invalid.`);
      const item = value as Partial<LegacyAttachmentManifestEntry>;
      if (typeof item.key !== 'string' || !/^[0-9a-f-]{36}\.(?:jpg|png|webp)$/i.test(item.key)
        || typeof item.ownerEmail !== 'string' || !item.ownerEmail.trim()
        || (item.complaintIds !== undefined
          && (!Array.isArray(item.complaintIds) || !item.complaintIds.every(id => typeof id === 'string')))) {
        throw new Error(`Manifest entry ${index + 1} must include a UUID photo key, owner email, and optional complaint ID list.`);
      }
      const key = item.key;
      if (seenKeys.has(key)) throw new Error(`Duplicate key ${key} in manifest.`);
      seenKeys.add(key);
      const owner = await userStore.findByEmail(item.ownerEmail.trim().toLowerCase());
      if (!owner || owner.role !== 'citizen' || owner.status !== 'active') {
        throw new Error(`No active citizen account exists for ${item.ownerEmail}.`);
      }

      const sourceFile = resolve(sourceDirectory, key);
      if (basename(sourceFile) !== key) {
        throw new Error(`Attachment path escaped its source directory: ${key}`);
      }
      const fileInfo = await lstat(sourceFile);
      if (fileInfo.isSymbolicLink() || !fileInfo.isFile()) {
        throw new Error(`Source is not a regular file: ${sourceFile}`);
      }
      if (fileInfo.size > 20 * 1024 * 1024) {
        throw new Error(`Attachment ${key} exceeds the 20 MB migration safety limit.`);
      }
      const bytes = await readFile(sourceFile);
      const contentType = detectImageMime(bytes);
      if (!contentType || `${key.split('.').pop()}` !== ({
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      } as const)[contentType]) {
        throw new Error(`Attachment ${key} has an invalid image signature or mismatched extension.`);
      }

      const complaintIds = new Set(item.complaintIds ?? []);
      for (const complaint of complaintRecords) {
        if (complaint.photos.includes(`/api/uploads/${key}`)) complaintIds.add(complaint.id);
      }
      const pendingComplaintIds: string[] = [];
      for (const complaintId of complaintIds) {
        const complaint = byComplaintId.get(complaintId);
        if (complaint && complaint.citizenId !== owner.id) {
          throw new Error(`Complaint ${complaintId} does not belong to ${owner.email}; no file was migrated.`);
        }
        if (!complaint) pendingComplaintIds.push(complaintId);
      }
      prepared.push({
        bytes,
        record: {
          key,
          ownerId: owner.id,
          contentType,
          size: bytes.byteLength,
          complaintIds: [...complaintIds],
          createdAt: fileInfo.mtime.toISOString(),
        },
        pendingComplaintIds,
      });
    }

    console.log(`Validated ${prepared.length} attachment(s) from ${sourceDirectory}.`);
    console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}; source files and manifest remain unchanged.`);
    for (const item of prepared) {
      if (item.pendingComplaintIds.length) {
        console.log(`  ${item.record.key}: waiting for complaint import: ${item.pendingComplaintIds.join(', ')}`);
      }
    }
    if (!apply) {
      console.log('Review the plan, then rerun the same command with --apply to migrate.');
      return;
    }
    for (const item of prepared) {
      await attachmentStore.importLegacy(item.bytes, item.record);
      const imported = await attachmentStore.find(item.record.key);
      const verifiedBytes = await attachmentStore.read(item.record.key);
      if (!imported || imported.ownerId !== item.record.ownerId || !verifiedBytes?.equals(item.bytes)) {
        throw new Error(`Post-import verification failed for ${item.record.key}. Source file has been preserved.`);
      }
    }
    console.log(`Migrated and verified ${prepared.length} attachment(s). Keep the source directory until user access has been confirmed.`);
  } finally {
    closeAttachmentStore();
    await closeDatabase();
  }
}

main().catch(error => {
  console.error('[attachment migration]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
