/**
 * NagarSetu – Local Store
 *
 * Persists user records locally for development; audit events remain in memory.
 * In production, replace calls in userStore / auditStore with MongoDB equivalents.
 * The interface is intentionally identical to what a MongoDB adapter would expose.
 */

import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { StoredUser, AuditEvent, UserRole, AccountStatus } from './types.js';
import { getDatabase } from './database.js';

const BCRYPT_ROUNDS = 12;

// ─── Stores ────────────────────────────────────────────────────────────────────

const users = new Map<string, StoredUser>();  // keyed by lowercase email
const usersById = new Map<string, StoredUser>(); // keyed by id
const auditLog: AuditEvent[] = [];
let pendingWrite: Promise<void> = Promise.resolve();

function getUserStoreFile(): string {
  return resolve(process.env.USER_STORE_FILE ?? '.data/users.json');
}

function isStoredUser(value: unknown): value is StoredUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  return typeof user.id === 'string'
    && typeof user.email === 'string'
    && typeof user.passwordHash === 'string'
    && typeof user.name === 'string'
    && (user.role === 'citizen' || user.role === 'officer' || user.role === 'admin')
    && (user.status === 'active' || user.status === 'pending' || user.status === 'suspended' || user.status === 'disabled')
    && (user.department === undefined || typeof user.department === 'string')
    && (user.departmentId === undefined || typeof user.departmentId === 'string')
    && (user.zone === undefined || typeof user.zone === 'string')
    && (user.assignedWards === undefined || (Array.isArray(user.assignedWards) && user.assignedWards.every(ward => typeof ward === 'string')))
    && typeof user.createdAt === 'string'
    && typeof user.updatedAt === 'string';
}

async function persistUsers(): Promise<void> {
  const userStoreFile = getUserStoreFile();
  const write = pendingWrite.then(async () => {
    const serializedUsers = `${JSON.stringify(Array.from(usersById.values()), null, 2)}\n`;
    await mkdir(dirname(userStoreFile), { recursive: true, mode: 0o700 });
    const tempFile = `${userStoreFile}.${process.pid}.${uuidv4()}.tmp`;
    try {
      await writeFile(tempFile, serializedUsers, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
      await rename(tempFile, userStoreFile);
    } finally {
      await rm(tempFile, { force: true });
    }
  });
  pendingWrite = write.catch(() => {});
  await write;
}

async function loadUsers(): Promise<void> {
  const userStoreFile = getUserStoreFile();
  let serializedUsers = '[]';
  try {
    serializedUsers = await readFile(userStoreFile, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  const loadedUsers: unknown = JSON.parse(serializedUsers);
  if (!Array.isArray(loadedUsers) || !loadedUsers.every(isStoredUser)) {
    throw new Error(`Invalid user store file: ${userStoreFile}`);
  }

  const collection = getDatabase()?.collection<StoredUser>('users');
  if (collection) {
    for (const user of loadedUsers) {
      const existingId = await collection.findOne({ id: user.id });
      if (existingId) continue;
      const existingEmail = await collection.findOne({ email: user.email.toLowerCase().trim() });
      if (existingEmail) {
        throw new Error(`Cannot migrate user store: email conflict for ${user.email}. Resolve it before startup.`);
      }
      try {
        await collection.insertOne(user);
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        const conflictingUser = await collection.findOne({
          $or: [{ id: user.id }, { email: user.email.toLowerCase().trim() }],
        });
        if (!conflictingUser || conflictingUser.id !== user.id) throw error;
      }
    }
    return;
  }

  for (const user of loadedUsers) {
    const emailKey = user.email.toLowerCase().trim();
    if (users.has(emailKey) || usersById.has(user.id)) {
      throw new Error(`Duplicate user record in store file: ${userStoreFile}`);
    }
    users.set(emailKey, user);
    usersById.set(user.id, user);
  }
}

export async function initializeUserStore(): Promise<void> {
  await loadUsers();
}

// ─── User Store ────────────────────────────────────────────────────────────────

export const userStore = {
  async findByEmail(email: string): Promise<StoredUser | null> {
    const collection = getDatabase()?.collection<StoredUser>('users');
    if (collection) return collection.findOne({ email: email.toLowerCase().trim() });
    return users.get(email.toLowerCase()) ?? null;
  },

  async findById(id: string): Promise<StoredUser | null> {
    const collection = getDatabase()?.collection<StoredUser>('users');
    if (collection) return collection.findOne({ id });
    return usersById.get(id) ?? null;
  },

  async create(data: {
    email: string;
    plainPassword: string;
    name: string;
    role: UserRole;
    status?: AccountStatus;
    department?: string;
    departmentId?: string;
    zone?: string;
    assignedWards?: string[];
  }): Promise<StoredUser> {
    const normEmail = data.email.toLowerCase().trim();
    const collection = getDatabase()?.collection<StoredUser>('users');
    if (collection ? await collection.findOne({ email: normEmail }) : users.has(normEmail)) {
      throw new Error('EMAIL_EXISTS');
    }
    const passwordHash = await bcrypt.hash(data.plainPassword, BCRYPT_ROUNDS);
    const now = new Date().toISOString();
    const user: StoredUser = {
      id: uuidv4(),
      email: normEmail,
      passwordHash,
      name: data.name.trim(),
      role: data.role,
      status: data.status ?? 'active',
      department: data.department,
      departmentId: data.departmentId,
      zone: data.zone,
      assignedWards: data.assignedWards,
      createdAt: now,
      updatedAt: now,
    };
    if (collection) {
      try {
        await collection.insertOne(user);
      } catch (error) {
        if ((error as { code?: number }).code === 11000) throw new Error('EMAIL_EXISTS');
        throw error;
      }
    } else {
      users.set(normEmail, user);
      usersById.set(user.id, user);
      try {
        await persistUsers();
      } catch (error) {
        users.delete(normEmail);
        usersById.delete(user.id);
        throw error;
      }
    }
    return user;
  },

  async verifyPassword(user: StoredUser, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, user.passwordHash);
  },

  async updateStatus(id: string, status: AccountStatus): Promise<StoredUser | null> {
    const collection = getDatabase()?.collection<StoredUser>('users');
    if (collection) {
      const user = await collection.findOne({ id });
      if (!user) return null;
      const updated = { ...user, status, updatedAt: new Date().toISOString() };
      await collection.replaceOne({ id }, updated);
      return updated;
    }
    const user = usersById.get(id);
    if (!user) return null;
    const updated = { ...user, status, updatedAt: new Date().toISOString() };
    users.set(user.email, updated);
    usersById.set(id, updated);
    try {
      await persistUsers();
    } catch (error) {
      users.set(user.email, user);
      usersById.set(id, user);
      throw error;
    }
    return updated;
  },

  async updateFields(id: string, fields: Partial<Pick<StoredUser, 'name' | 'department' | 'departmentId' | 'zone' | 'assignedWards' | 'role'>>): Promise<StoredUser | null> {
    const collection = getDatabase()?.collection<StoredUser>('users');
    if (collection) {
      const user = await collection.findOne({ id });
      if (!user) return null;
      const updated = { ...user, ...fields, updatedAt: new Date().toISOString() };
      await collection.replaceOne({ id }, updated);
      return updated;
    }
    const user = usersById.get(id);
    if (!user) return null;
    const updated = { ...user, ...fields, updatedAt: new Date().toISOString() };
    users.set(user.email, updated);
    usersById.set(id, updated);
    try {
      await persistUsers();
    } catch (error) {
      users.set(user.email, user);
      usersById.set(id, user);
      throw error;
    }
    return updated;
  },

  async listAll(): Promise<StoredUser[]> {
    const collection = getDatabase()?.collection<StoredUser>('users');
    if (collection) return collection.find({}).toArray();
    return Array.from(usersById.values());
  },

  async listByRole(role: UserRole): Promise<StoredUser[]> {
    const collection = getDatabase()?.collection<StoredUser>('users');
    if (collection) return collection.find({ role }).toArray();
    return Array.from(usersById.values()).filter(u => u.role === role);
  },

  async count(): Promise<number> {
    const collection = getDatabase()?.collection<StoredUser>('users');
    if (collection) return collection.countDocuments();
    return usersById.size;
  },
};

// ─── Audit Store ───────────────────────────────────────────────────────────────

export const auditStore = {
  append(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    auditLog.push({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...event,
    });
    // Keep last 10 000 events in memory
    if (auditLog.length > 10000) auditLog.splice(0, 1000);
  },

  getAll(): AuditEvent[] {
    return [...auditLog];
  },

  getRecent(limit = 100): AuditEvent[] {
    return auditLog.slice(-limit).reverse();
  },
};

// ─── Seed admin + demo accounts on startup ────────────────────────────────────

export async function seedDemoAccounts(): Promise<void> {
  await initializeUserStore();
  if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO_ACCOUNTS !== 'true') {
    return;
  }

  // Development demo accounts are inserted only when their emails are absent.
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@nagarsetu.gov.in';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'NagarAdmin@2026!';
  const officerEmail = process.env.SEED_OFFICER_EMAIL || 'officer@bbmp.gov.in';
  const officerPassword = process.env.SEED_OFFICER_PASSWORD || 'OfficerField@2026!';
  const citizenEmail = process.env.SEED_CITIZEN_EMAIL || 'priya@example.com';
  const citizenPassword = process.env.SEED_CITIZEN_PASSWORD || 'Citizen@2026!';

  try {
    await userStore.create({
      email: adminEmail,
      plainPassword: adminPassword,
      name: 'Dr. S. Ranganathan, IAS',
      role: 'admin',
      status: 'active',
      department: 'Municipal Commissionerate',
      zone: 'All Zones',
    });
  } catch (e: unknown) {
    if ((e as Error).message !== 'EMAIL_EXISTS') throw e;
  }

  try {
    await userStore.create({
      email: officerEmail,
      plainPassword: officerPassword,
      name: 'Er. Rajesh V.',
      role: 'officer',
      status: 'active',
      department: 'Roads & Infra (BBMP)',
      zone: 'East Zone',
      assignedWards: ['Ward 12 Indiranagar', 'Ward 13 Domlur'],
    });
  } catch (e: unknown) {
    if ((e as Error).message !== 'EMAIL_EXISTS') throw e;
  }

  try {
    await userStore.create({
      email: citizenEmail,
      plainPassword: citizenPassword,
      name: 'Priya Sundaram',
      role: 'citizen',
      status: 'active',
    });
  } catch (e: unknown) {
    if ((e as Error).message !== 'EMAIL_EXISTS') throw e;
  }

  console.log('[NagarSetu] Demo accounts seeded.');
  console.log(`  Admin:   ${adminEmail} / (see SEED_ADMIN_PASSWORD)`);
  console.log(`  Officer: ${officerEmail} / (see SEED_OFFICER_PASSWORD)`);
  console.log(`  Citizen: ${citizenEmail} / (see SEED_CITIZEN_PASSWORD)`);
}
