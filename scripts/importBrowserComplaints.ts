import { readFile } from 'node:fs/promises';
import dotenv from 'dotenv';
import { closeAttachmentStore, attachmentStore, loadAttachmentMetadata } from '../server/attachmentStore.js';
import { closeDatabase, connectDatabase, getDatabase } from '../server/database.js';
import { complaintStore, loadComplaints, type StoredComplaint } from '../server/complaintStore.js';
import { initializeUserStore, userStore } from '../server/store.js';
import type { Complaint } from '../src/types/index.js';

const args = process.argv.slice(2);
const valueAfter = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

function usage(): never {
  throw new Error(
    'Usage: npm run migrate:complaints -- --file <browser-export.json> --citizen-email <existing-account-email> [--apply]'
  );
}

function validStatus(value: unknown): value is Complaint['status'] {
  return ['Submitted', 'In Progress', 'Assigned', 'Resolved', 'Closed', 'Escalated'].includes(String(value));
}

function validPriority(value: unknown): value is Complaint['priority'] {
  return ['P1', 'P2', 'P3', 'P4'].includes(String(value));
}

async function linkPhotosToComplaint(photos: string[], complaintId: string, ownerId: string): Promise<void> {
  for (const photo of photos) {
    const match = /^\/api\/uploads\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/i.exec(photo);
    if (!match || !await attachmentStore.linkToComplaint(match[1], complaintId, ownerId)) {
      throw new Error(`Could not link migrated photo ${photo} to complaint ${complaintId}.`);
    }
  }
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
  const file = valueAfter('--file');
  const email = valueAfter('--citizen-email')?.trim().toLowerCase();
  const apply = args.includes('--apply');
  if (!file || !email) usage();

  try {
    await prepareStores();
    const user = await userStore.findByEmail(email);
    if (!user || user.role !== 'citizen' || user.status !== 'active') {
      throw new Error(`No active citizen account exists for ${email}; no records were imported.`);
    }
    const content = await readFile(file, 'utf8');
    if (Buffer.byteLength(content, 'utf8') > 20 * 1024 * 1024) {
      throw new Error('Browser export exceeds 20 MB; split the export before retrying.');
    }
    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed)) throw new Error('Expected the complaint export to be a JSON array.');

    const existingRecords = new Map((await complaintStore.list()).map(complaint => [complaint.id, complaint]));
    const seen = new Set<string>();
    const records: StoredComplaint[] = [];
    let alreadyImported = 0;
    const importMarker = 'Imported from citizen browser export';
    const now = new Date().toISOString();
    for (const [index, value] of parsed.entries()) {
      if (!value || typeof value !== 'object') throw new Error(`Record ${index + 1} is not a complaint object.`);
      const legacy = value as Partial<Complaint>;
      const status = legacy.status;
      const priority = legacy.priority;
      if (typeof legacy.id !== 'string' || !legacy.id.trim()
        || typeof legacy.category !== 'string' || !legacy.category.trim()
        || typeof legacy.title !== 'string' || !legacy.title.trim()
        || typeof legacy.description !== 'string'
        || typeof legacy.location !== 'string' || !legacy.location.trim()
        || !validPriority(priority) || !validStatus(status)
        || !Array.isArray(legacy.photos)
        || (legacy.coordinates !== undefined
          && (!Number.isFinite(legacy.coordinates.lat) || !Number.isFinite(legacy.coordinates.lng)
            || Math.abs(legacy.coordinates.lat) > 90 || Math.abs(legacy.coordinates.lng) > 180))) {
        throw new Error(`Record ${index + 1} is missing required complaint fields or has invalid status/location data.`);
      }
      const id = legacy.id.trim();
      if (seen.has(id)) throw new Error(`Duplicate complaint ID ${id} in source export; no records were imported.`);
      seen.add(id);

      const photos: string[] = [];
      for (const photo of legacy.photos) {
        if (typeof photo !== 'string') throw new Error(`Complaint ${id} contains an invalid photo reference.`);
        const match = /^\/api\/uploads\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/i.exec(photo);
        if (!match) {
          throw new Error(`Complaint ${id} has a non-managed photo URL. Migrate the source image or review the record before importing.`);
        }
        const attachment = await attachmentStore.find(match[1]);
        if (!attachment || attachment.ownerId !== user.id) {
          throw new Error(`Complaint ${id} photo ${match[1]} is not migrated and owned by the selected citizen.`);
        }
        photos.push(photo);
      }
      const coordinates = legacy.coordinates;
      const existingRecord = existingRecords.get(id);
      if (existingRecord) {
        const hasImportMarker = existingRecord.citizenId === user.id
          && existingRecord.statusHistory.some(entry => entry.note === importMarker && entry.status === status);
        const matchesSource = hasImportMarker
          && existingRecord.category === legacy.category.trim()
          && existingRecord.title === legacy.title.trim()
          && existingRecord.description === legacy.description
          && existingRecord.location === legacy.location.trim()
          && existingRecord.priority === priority
          && JSON.stringify(existingRecord.photos) === JSON.stringify(photos)
          && JSON.stringify(existingRecord.coordinates) === JSON.stringify(coordinates);
        if (!matchesSource) {
          throw new Error(`Complaint ID ${id} already exists and does not match this marked import; no records were imported.`);
        }
        if (apply) await linkPhotosToComplaint(photos, id, user.id);
        alreadyImported += 1;
        continue;
      }
      const createdAt = typeof legacy.createdAt === 'string' && Number.isFinite(Date.parse(legacy.createdAt))
        ? legacy.createdAt
        : now;
      records.push({
        ...legacy,
        id,
        status,
        priority,
        category: legacy.category.trim(),
        title: legacy.title.trim(),
        description: legacy.description,
        location: legacy.location.trim(),
        ward: typeof legacy.ward === 'string' && legacy.ward.trim() ? legacy.ward : 'Unassigned',
        zone: typeof legacy.zone === 'string' && legacy.zone.trim() ? legacy.zone : 'Unassigned',
        ...(coordinates ? { coordinates } : {}),
        photos,
        citizenName: typeof legacy.citizenName === 'string' ? legacy.citizenName : user.name,
        citizenPhone: typeof legacy.citizenPhone === 'string' ? legacy.citizenPhone : '',
        department: typeof legacy.department === 'string' && legacy.department ? legacy.department : legacy.category,
        reportedDate: typeof legacy.reportedDate === 'string' ? legacy.reportedDate : createdAt,
        timeAgo: typeof legacy.timeAgo === 'string' ? legacy.timeAgo : 'Imported record',
        slaDeadline: typeof legacy.slaDeadline === 'string' ? legacy.slaDeadline : 'Not recorded',
        slaRemaining: typeof legacy.slaRemaining === 'string' ? legacy.slaRemaining : 'Not recorded',
        upvotes: Number.isSafeInteger(legacy.upvotes) && (legacy.upvotes ?? -1) >= 0 ? legacy.upvotes! : 0,
        verifiedKYC: legacy.verifiedKYC === true,
        aiConfidence: Number.isFinite(legacy.aiConfidence) ? legacy.aiConfidence! : 0,
        lifecycleStage: Number.isInteger(legacy.lifecycleStage) ? legacy.lifecycleStage! : 1,
        citizenId: user.id,
        statusHistory: [{
          status,
          changedAt: now,
          actorId: user.id,
          note: importMarker,
        }],
        createdAt,
        updatedAt: now,
      });
    }

    console.log(`Validated ${records.length} new complaint(s) for active citizen ${user.email}; ${alreadyImported} matching complaint(s) are already imported.`);
    console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}; source file remains unchanged.`);
    if (!apply) {
      console.log('Review the validation, then rerun the same command with --apply to import.');
      return;
    }
    for (const record of records) {
      await complaintStore.create(record);
      await linkPhotosToComplaint(record.photos, record.id, user.id);
    }
    console.log(`Imported ${records.length} complaint(s); skipped ${alreadyImported} verified prior import(s). Keep the source export until destination verification is complete.`);
  } finally {
    closeAttachmentStore();
    await closeDatabase();
  }
}

main().catch(error => {
  console.error('[complaint migration]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
