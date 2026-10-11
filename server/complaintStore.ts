import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import type { Complaint } from '../src/types/index.js';
import { getDatabase } from './database.js';

export interface ComplaintHistoryEntry {
  status: Complaint['status'];
  changedAt: string;
  actorId: string;
  note?: string;
}

export interface StoredComplaint extends Complaint {
  citizenId?: string;
  locationSource?: 'gps' | 'map' | 'manual';
  assignedOfficerId?: string;
  departmentId?: string;
  statusHistory: ComplaintHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

const complaints = new Map<string, StoredComplaint>();
let pendingWrite: Promise<void> = Promise.resolve();

function getComplaintFile(): string {
  return resolve(process.env.COMPLAINT_STORE_FILE ?? '.data/complaints.json');
}

function isComplaint(value: unknown): value is Complaint {
  if (!value || typeof value !== 'object') return false;
  const complaint = value as Record<string, unknown>;
  const coordinates = complaint.coordinates as Record<string, unknown> | null;
  return typeof complaint.id === 'string'
    && typeof complaint.title === 'string'
    && typeof complaint.description === 'string'
    && typeof complaint.category === 'string'
    && typeof complaint.location === 'string'
    && (coordinates === undefined
      || Boolean(coordinates
        && typeof coordinates.lat === 'number'
        && typeof coordinates.lng === 'number'))
    && Array.isArray(complaint.photos);
}

async function persistFile(): Promise<void> {
  const complaintFile = getComplaintFile();
  const write = pendingWrite.then(async () => {
    const serialized = `${JSON.stringify(Array.from(complaints.values()), null, 2)}\n`;
    await mkdir(dirname(complaintFile), { recursive: true, mode: 0o700 });
    const tempFile = `${complaintFile}.${process.pid}.${uuidv4()}.tmp`;
    try {
      await writeFile(tempFile, serialized, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
      await rename(tempFile, complaintFile);
    } finally {
      await rm(tempFile, { force: true });
    }
  });
  pendingWrite = write.catch(() => {});
  await write;
}

export async function loadComplaints(): Promise<void> {
  const complaintFile = getComplaintFile();
  let stored: unknown[] = [];
  try {
    const contents = await readFile(complaintFile, 'utf8');
    const parsed: unknown = JSON.parse(contents);
    if (!Array.isArray(parsed) || !parsed.every(isComplaint)) {
      throw new Error(`Invalid complaint store file: ${complaintFile}`);
    }
    stored = parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  const collection = getDatabase()?.collection<StoredComplaint>('complaints');
  if (collection) {
    for (const legacyRecord of stored) {
      const record = legacyRecord as StoredComplaint;
      const existing = await collection.findOne({ id: record.id });
      if (existing) continue;
      const now = new Date().toISOString();
      try {
        await collection.insertOne({
          ...record,
          statusHistory: record.statusHistory ?? [{
            status: record.status,
            changedAt: record.createdAt ?? now,
            actorId: 'legacy-import',
          }],
          createdAt: record.createdAt ?? now,
          updatedAt: record.updatedAt ?? now,
        });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        if (!await collection.findOne({ id: record.id })) throw error;
      }
    }
    return;
  }

  for (const record of stored as StoredComplaint[]) {
    if (complaints.has(record.id)) {
      throw new Error(`Duplicate complaint ID in store file: ${record.id}`);
    }
    const now = new Date().toISOString();
    complaints.set(record.id, {
      ...record,
      statusHistory: record.statusHistory ?? [{
        status: record.status,
        changedAt: record.createdAt ?? now,
        actorId: 'legacy-import',
      }],
      createdAt: record.createdAt ?? now,
      updatedAt: record.updatedAt ?? now,
    });
  }
}

export const complaintStore = {
  async list(): Promise<StoredComplaint[]> {
    const collection = getDatabase()?.collection<StoredComplaint>('complaints');
    if (collection) return collection.find({}).sort({ createdAt: -1 }).toArray();
    return Array.from(complaints.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findById(id: string): Promise<StoredComplaint | null> {
    const collection = getDatabase()?.collection<StoredComplaint>('complaints');
    if (collection) return collection.findOne({ id });
    return complaints.get(id) ?? null;
  },

  async create(complaint: StoredComplaint): Promise<void> {
    const collection = getDatabase()?.collection<StoredComplaint>('complaints');
    if (collection) {
      await collection.insertOne(complaint);
      return;
    }
    if (complaints.has(complaint.id)) throw new Error('COMPLAINT_EXISTS');
    complaints.set(complaint.id, complaint);
    try {
      await persistFile();
    } catch (error) {
      complaints.delete(complaint.id);
      throw error;
    }
  },

  async replace(complaint: StoredComplaint): Promise<void> {
    const collection = getDatabase()?.collection<StoredComplaint>('complaints');
    if (collection) {
      await collection.replaceOne({ id: complaint.id }, complaint);
      return;
    }
    const previous = complaints.get(complaint.id);
    complaints.set(complaint.id, complaint);
    try {
      await persistFile();
    } catch (error) {
      if (previous) complaints.set(complaint.id, previous);
      else complaints.delete(complaint.id);
      throw error;
    }
  },

  async replaceMany(records: StoredComplaint[]): Promise<void> {
    if (records.length === 0) return;
    const collection = getDatabase()?.collection<StoredComplaint>('complaints');
    if (collection) {
      await collection.bulkWrite(records.map(complaint => ({
        replaceOne: { filter: { id: complaint.id }, replacement: complaint },
      })), { ordered: true });
      return;
    }

    const previous = new Map(records.map(record => [record.id, complaints.get(record.id)]));
    for (const record of records) complaints.set(record.id, record);
    try {
      await persistFile();
    } catch (error) {
      for (const [id, oldRecord] of previous) {
        if (oldRecord) complaints.set(id, oldRecord);
        else complaints.delete(id);
      }
      throw error;
    }
  },

  async count(): Promise<number> {
    const collection = getDatabase()?.collection<StoredComplaint>('complaints');
    if (collection) return collection.countDocuments();
    return complaints.size;
  },
};
