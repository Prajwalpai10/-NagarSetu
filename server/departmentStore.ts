import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.js';

export interface StoredDepartment {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

const DEVELOPMENT_DEPARTMENTS = [
  { id: 'dept-roads-bbmp', name: 'Roads & Infra (BBMP)' },
  { id: 'dept-water-bwssb', name: 'Water Supply (BWSSB)' },
  { id: 'dept-power-bescom', name: 'Electricity & Power (BESCOM)' },
  { id: 'dept-solid-waste-bbmp', name: 'Solid Waste Management (BBMP)' },
  { id: 'dept-stormwater-bbmp', name: 'Stormwater & Drainage (BBMP)' },
  { id: 'dept-parks-bbmp', name: 'Parks & Environment (BBMP)' },
] as const;

let departments = new Map<string, StoredDepartment>();
let pendingWrite: Promise<void> = Promise.resolve();

function getDepartmentFile(): string {
  return resolve(process.env.DEPARTMENT_STORE_FILE ?? '.data/departments.json');
}

function isDepartment(value: unknown): value is StoredDepartment {
  if (!value || typeof value !== 'object') return false;
  const department = value as Record<string, unknown>;
  return typeof department.id === 'string'
    && typeof department.name === 'string'
    && (department.status === 'active' || department.status === 'inactive')
    && typeof department.createdAt === 'string'
    && typeof department.updatedAt === 'string';
}

async function persistDepartments(): Promise<void> {
  const file = getDepartmentFile();
  const write = pendingWrite.then(async () => {
    await mkdir(dirname(file), { recursive: true, mode: 0o700 });
    const tempFile = `${file}.${process.pid}.${uuidv4()}.tmp`;
    try {
      await writeFile(tempFile, `${JSON.stringify([...departments.values()], null, 2)}\n`, {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      });
      await rename(tempFile, file);
    } finally {
      await rm(tempFile, { force: true });
    }
  });
  pendingWrite = write.catch(() => {});
  await write;
}

export async function initializeDepartmentStore(legacyNames: string[]): Promise<void> {
  departments = new Map();
  const file = getDepartmentFile();
  let contents = '[]';
  try {
    contents = await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const parsed: unknown = JSON.parse(contents);
  if (!Array.isArray(parsed) || !parsed.every(isDepartment)) {
    throw new Error(`Invalid department store file: ${file}`);
  }

  const collection = getDatabase()?.collection<StoredDepartment>('departments');
  if (collection) {
    for (const department of parsed) {
      await collection.updateOne({ id: department.id }, { $setOnInsert: department }, { upsert: true });
    }
    departments = new Map((await collection.find({}).toArray()).map(department => [department.id, department]));
  } else {
    departments = new Map(parsed.map(department => [department.id, department]));
  }

  for (const rawName of legacyNames) {
    const name = rawName.trim();
    if (!name || [...departments.values()].some(department => department.name.toLocaleLowerCase() === name.toLocaleLowerCase())) continue;
    const slug = name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'department';
    const suffix = createHash('sha256').update(name.toLocaleLowerCase()).digest('hex').slice(0, 8);
    await departmentStore.create(name, `legacy-${slug}-${suffix}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    for (const department of DEVELOPMENT_DEPARTMENTS) {
      if ([...departments.values()].some(existing => existing.name.toLocaleLowerCase() === department.name.toLocaleLowerCase())) continue;
      await departmentStore.create(department.name, department.id);
    }
  }
}

export const departmentStore = {
  async list(): Promise<StoredDepartment[]> {
    const collection = getDatabase()?.collection<StoredDepartment>('departments');
    if (collection) return collection.find({}).sort({ name: 1 }).toArray();
    return [...departments.values()].sort((a, b) => a.name.localeCompare(b.name));
  },

  async findById(id: string): Promise<StoredDepartment | null> {
    const collection = getDatabase()?.collection<StoredDepartment>('departments');
    if (collection) return collection.findOne({ id });
    return departments.get(id) ?? null;
  },

  async create(name: string, stableId = `dept-${uuidv4()}`): Promise<StoredDepartment> {
    const normalizedName = name.trim();
    if ([...(await this.list())].some(department => department.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
      throw new Error('DEPARTMENT_EXISTS');
    }
    const now = new Date().toISOString();
    const department: StoredDepartment = {
      id: stableId,
      name: normalizedName,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    const collection = getDatabase()?.collection<StoredDepartment>('departments');
    if (collection) {
      try {
        await collection.insertOne(department);
      } catch (error) {
        if ((error as { code?: number }).code === 11000) throw new Error('DEPARTMENT_EXISTS');
        throw error;
      }
    } else {
      departments.set(department.id, department);
      try {
        await persistDepartments();
      } catch (error) {
        departments.delete(department.id);
        throw error;
      }
    }
    return department;
  },

  async setStatus(id: string, status: StoredDepartment['status']): Promise<StoredDepartment | null> {
    const current = await this.findById(id);
    if (!current) return null;
    const updated = { ...current, status, updatedAt: new Date().toISOString() };
    const collection = getDatabase()?.collection<StoredDepartment>('departments');
    if (collection) {
      await collection.replaceOne({ id }, updated);
    } else {
      departments.set(id, updated);
      try {
        await persistDepartments();
      } catch (error) {
        departments.set(id, current);
        throw error;
      }
    }
    return updated;
  },
};
