/**
 * NagarSetu – Express Authentication & API Server
 *
 * Runs on port 4000 (configurable via PORT env var).
 * The Vite dev server proxies /api/* to this server.
 */

import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { userStore, auditStore, seedDemoAccounts } from './store.js';
import { StoredUser, PublicUser, UserRole, AccountStatus } from './types.js';
import { closeDatabase, connectDatabase, getDatabase } from './database.js';
import { departmentStore, initializeDepartmentStore } from './departmentStore.js';
import { complaintStore, loadComplaints, StoredComplaint } from './complaintStore.js';
import { attachmentStore, closeAttachmentStore, detectImageMime, loadAttachmentMetadata, validateAttachmentStorageConfiguration, verifyAttachmentObjectStore } from './attachmentStore.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT ?? '4000', 10);
const SESSION_SECRET = process.env.SESSION_SECRET ?? '';
const IS_PROD = process.env.NODE_ENV === 'production';
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const MAX_PHOTOS_PER_COMPLAINT = 5;
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

if (!SESSION_SECRET) {
  console.error('[NagarSetu] FATAL: SESSION_SECRET environment variable is not set.');
  console.error('            Set SESSION_SECRET to a long random string before starting the server.');
  process.exit(1);
}

// ── Security Middleware ────────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: false, // Handled by Vite/Nginx in production
}));

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000,http://localhost:5173')
  .split(',').map(o => o.trim());

if (IS_PROD) app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, !IS_PROD);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

// ── Session ───────────────────────────────────────────────────────────────────

app.use(session({
  ...(process.env.MONGODB_URI
    ? {
        store: MongoStore.create({
          mongoUrl: process.env.MONGODB_URI,
          dbName: process.env.MONGODB_DB_NAME,
          collectionName: 'sessions',
          ttl: 8 * 60 * 60,
        }),
      }
    : {}),
  genid: () => uuidv4(),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? (process.env.SESSION_COOKIE_SAME_SITE ?? 'strict') as 'strict' | 'lax' | 'none' : 'lax',
    ...(process.env.SESSION_COOKIE_DOMAIN ? { domain: process.env.SESSION_COOKIE_DOMAIN } : {}),
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
}));

// ── Rate Limiters ─────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many registration attempts from this IP.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'API rate limit exceeded.' },
});

app.use('/api/', apiLimiter);

const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!IMAGE_EXTENSIONS[file.mimetype]) {
      callback(new Error('Only JPEG, PNG, and WebP photos are allowed.'));
      return;
    }
    callback(null, true);
  },
});

// ── Session Type Augmentation ─────────────────────────────────────────────────

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    role?: UserRole;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Safely extract a string from untrusted req.body field (Express v5: body fields are `unknown`) */
function bodyStr(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val === null || val === undefined) return '';
  return String(val);
}

function toPublicUser(u: {
  id: string; email: string; name: string; role: UserRole;
  status: AccountStatus; department?: string; zone?: string;
  departmentId?: string;
  assignedWards?: string[]; createdAt: string;
}): PublicUser {
  return {
    id: u.id, email: u.email, name: u.name, role: u.role,
    status: u.status, department: u.department, departmentId: u.departmentId, zone: u.zone,
    assignedWards: u.assignedWards, createdAt: u.createdAt,
  };
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8)   return 'Password must be at least 8 characters.';
  if (password.length > 128) return 'Password must not exceed 128 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit.';
  return null;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(email);
}

/** Portal the client is signing into – used as a constraint, never as the granted role. */
function parsePortalRole(val: unknown): UserRole | null {
  const s = bodyStr(val).toLowerCase().trim();
  if (s === 'citizen') return 'citizen';
  if (s === 'officer' || s === 'ops') return 'officer';
  if (s === 'admin') return 'admin';
  return null;
}

function portalLabel(role: UserRole): string {
  if (role === 'officer') return 'Ops Field';
  if (role === 'admin') return 'Admin';
  return 'Citizen';
}

// ── Auth Middleware ───────────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!req.session.role || !roles.includes(req.session.role)) {
      auditStore.append({
        action: 'AUTHORISATION_DENIED',
        actorId: req.session.userId,
        details: `Required: [${roles.join(',')}], actual: ${req.session.role}, path: ${req.path}`,
        ipAddress: getClientIp(req),
      });
      res.status(403).json({ error: 'You do not have permission to access this resource.' });
      return;
    }
    next();
  };
}

function validCoordinates(value: unknown): value is { lat: number; lng: number } {
  if (!value || typeof value !== 'object') return false;
  const coordinates = value as Record<string, unknown>;
  return typeof coordinates.lat === 'number' && Number.isFinite(coordinates.lat)
    && coordinates.lat >= -90 && coordinates.lat <= 90
    && typeof coordinates.lng === 'number' && Number.isFinite(coordinates.lng)
    && coordinates.lng >= -180 && coordinates.lng <= 180;
}

function canViewComplaint(
  complaint: StoredComplaint,
  user: StoredUser
): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'citizen') return complaint.citizenId === user.id;
  const assignedWard = user.assignedWards?.includes(complaint.ward) ?? false;
  const assignedZone = user.zone === 'All Zones' || user.zone === complaint.zone;
  return complaint.assignedOfficerId === user.id || (assignedWard && assignedZone);
}

function publicComplaint(complaint: StoredComplaint): Omit<StoredComplaint, 'citizenId' | 'assignedOfficerId'> {
  const { citizenId: _citizenId, assignedOfficerId: _assignedOfficerId, ...data } = complaint;
  return data;
}

function complaintPhotoKeys(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_PHOTOS_PER_COMPLAINT) return null;
  const keys: string[] = [];
  for (const photoUrl of value) {
    if (typeof photoUrl !== 'string') return null;
    const match = /^\/api\/uploads\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/i.exec(photoUrl);
    if (!match) return null;
    keys.push(match[1]);
  }
  return keys;
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/api/uploads/:key', requireAuth, async (req, res, next) => {
  const key = String(req.params['key'] ?? '');
  if (!/^[0-9a-f-]{36}\.(?:jpg|png|webp)$/i.test(key)) {
    res.status(404).json({ error: 'Photo not found.' });
    return;
  }

  try {
    const attachment = await attachmentStore.find(key);
    if (!attachment) {
      res.status(404).json({ error: 'Photo not found.' });
      return;
    }
    const user = await userStore.findById(req.session.userId!);
    if (!user || user.status !== 'active') {
      res.status(403).json({ error: 'Your account is not authorized to view this photo.' });
      return;
    }

    let canView = attachment.ownerId === user.id;
    if (!canView) {
      for (const complaintId of attachment.complaintIds) {
        const complaint = await complaintStore.findById(complaintId);
        if (complaint && canViewComplaint(complaint, user)) {
          canView = true;
          break;
        }
      }
    }
    if (!canView) {
      res.status(403).json({ error: 'You do not have permission to view this photo.' });
      return;
    }

    const contents = await attachmentStore.read(key);
    if (!contents) {
      res.status(404).json({ error: 'Photo not found.' });
      return;
    }
    res.set({
      'Content-Type': attachment.contentType,
      'Content-Length': String(contents.byteLength),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    }).send(contents);
  } catch (error) {
    next(error);
  }
});

// Health check
app.get('/api/health', async (_req, res, next) => {
  try {
    res.json({
      status: 'ok',
      users: await userStore.count(),
      complaints: await complaintStore.count(),
      database: getDatabase() ? 'connected' : 'local-file',
      attachmentStorage: process.env.S3_BUCKET ? 's3-compatible' : 'local-filesystem',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/complaints/attachments – upload one citizen photo.
app.post('/api/complaints/attachments', requireAuth, requireRole('citizen'), (req, res, next) => {
  attachmentUpload.single('photo')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const isTooLarge = error.code === 'LIMIT_FILE_SIZE';
      res.status(isTooLarge ? 413 : 400).json({
        error: isTooLarge
          ? 'Photo must be 5 MB or smaller.'
          : 'Upload one photo at a time.',
      });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
}, async (req, res, next) => {
  const uploadedFile = req.file;
  if (!uploadedFile) {
    res.status(400).json({ error: 'Choose a photo to upload.' });
    return;
  }

  try {
    if (detectImageMime(uploadedFile.buffer) !== uploadedFile.mimetype) {
      res.status(400).json({ error: 'The uploaded file is not a valid JPEG, PNG, or WebP photo.' });
      return;
    }
    const attachment = await attachmentStore.save(
      uploadedFile.buffer,
      req.session.userId!,
      uploadedFile.mimetype
    );
    res.status(201).json({ url: `/api/uploads/${attachment.key}` });
  } catch (error) {
    next(error);
  }
});

app.get('/api/complaints', requireAuth, async (req, res, next) => {
  try {
    const user = await userStore.findById(req.session.userId!);
    if (!user || user.status !== 'active') {
      res.status(403).json({ error: 'Your account is not active.' });
      return;
    }
    const records = await complaintStore.list();
    res.json({ complaints: records.filter(c => canViewComplaint(c, user)).map(publicComplaint) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/complaints/:id', requireAuth, async (req, res, next) => {
  try {
    const id = String(req.params['id'] ?? '');
    const [user, complaint] = await Promise.all([
      userStore.findById(req.session.userId!),
      complaintStore.findById(id),
    ]);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }
    if (!user || user.status !== 'active' || !canViewComplaint(complaint, user)) {
      res.status(403).json({ error: 'You do not have permission to view this complaint.' });
      return;
    }
    res.json({ complaint: publicComplaint(complaint) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/complaints', requireAuth, requireRole('citizen'), async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const user = await userStore.findById(req.session.userId!);
    if (!user || user.status !== 'active') {
      res.status(403).json({ error: 'Your account is not active.' });
      return;
    }

    const category = bodyStr(body.category).trim();
    const title = bodyStr(body.title).trim();
    const description = bodyStr(body.description).trim();
    const location = bodyStr(body.location).trim();
    const locationSource = bodyStr(body.locationSource || 'manual');
    const coordinates = body.coordinates;
    const photos = complaintPhotoKeys(body.photos);

    if (!category || category.length > 100 || !title || title.length > 200
      || !description || description.length > 5000 || !location || location.length > 300) {
      res.status(400).json({ error: 'Provide a category, title, description, and location within the allowed lengths.' });
      return;
    }
    if (!['gps', 'map', 'manual'].includes(locationSource)) {
      res.status(400).json({ error: 'Choose a valid location source.' });
      return;
    }
    if (coordinates !== undefined && !validCoordinates(coordinates)) {
      res.status(400).json({ error: 'Location coordinates are invalid.' });
      return;
    }
    if (locationSource !== 'manual' && !validCoordinates(coordinates)) {
      res.status(400).json({ error: 'GPS or map location must include valid coordinates.' });
      return;
    }
    if (!photos) {
      res.status(400).json({ error: `Attach no more than ${MAX_PHOTOS_PER_COMPLAINT} uploaded photos.` });
      return;
    }
    for (const key of photos) {
      const attachment = await attachmentStore.find(key);
      if (!attachment || attachment.ownerId !== user.id) {
        res.status(403).json({ error: 'One or more attached photos are not owned by your account.' });
        return;
      }
    }

    const priorityValue = bodyStr(body.priority || 'P2');
    const priority = ['P1', 'P2', 'P3', 'P4'].includes(priorityValue)
      ? priorityValue as StoredComplaint['priority']
      : null;
    if (!priority) {
      res.status(400).json({ error: 'Complaint priority is invalid.' });
      return;
    }
    const id = `CMP-${new Date().getFullYear()}-${uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    const now = new Date().toISOString();
    const complaint: StoredComplaint = {
      id,
      category,
      subCategory: bodyStr(body.subCategory).slice(0, 100) || undefined,
      title,
      description,
      location,
      ward: bodyStr(body.ward).trim() || 'Unassigned',
      zone: bodyStr(body.zone).trim() || 'Unassigned',
      ...(validCoordinates(coordinates) ? { coordinates } : {}),
      locationSource: locationSource as StoredComplaint['locationSource'],
      priority,
      status: 'Submitted',
      reportedDate: now,
      timeAgo: 'Just now',
      slaDeadline: priority === 'P1' ? '4 Hours Statutory' : priority === 'P2' ? '12 Hours Statutory' : '48 Hours Statutory',
      slaRemaining: priority === 'P1' ? '4 Hours' : priority === 'P2' ? '12 Hours' : '48 Hours',
      photos: photos.map(key => `/api/uploads/${key}`),
      citizenName: user.name,
      citizenPhone: '',
      verifiedKYC: false,
      upvotes: 0,
      aiConfidence: 0,
      department: bodyStr(body.department).trim() || category,
      isDuplicateMerged: false,
      mergedTicketIds: [],
      lifecycleStage: 1,
      citizenId: user.id,
      statusHistory: [{ status: 'Submitted', changedAt: now, actorId: user.id }],
      createdAt: now,
      updatedAt: now,
    };

    await complaintStore.create(complaint);
    for (const key of photos) {
      if (!await attachmentStore.linkToComplaint(key, id, user.id)) {
        throw new Error('Could not link an uploaded photo to its complaint.');
      }
    }
    res.status(201).json({ complaint: publicComplaint(complaint) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/complaints/:id/status', requireAuth, async (req, res, next) => {
  try {
    const id = String(req.params['id'] ?? '');
    const body = (req.body ?? {}) as Record<string, unknown>;
    const targetStatus = bodyStr(body.status) as StoredComplaint['status'];
    const validStatuses: StoredComplaint['status'][] = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Escalated'];
    if (!validStatuses.includes(targetStatus)) {
      res.status(400).json({ error: 'Invalid complaint status.' });
      return;
    }
    const user = await userStore.findById(req.session.userId!);
    const complaint = await complaintStore.findById(id);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }
    if (!user || user.status !== 'active' || !canViewComplaint(complaint, user)) {
      res.status(403).json({ error: 'You do not have permission to update this complaint.' });
      return;
    }

    if (user.role === 'citizen') {
      const mayClose = targetStatus === 'Closed' && complaint.status === 'Resolved';
      const mayReopen = targetStatus === 'In Progress'
        && (complaint.status === 'Resolved' || complaint.status === 'Closed');
      if (!mayClose && !mayReopen) {
        res.status(403).json({ error: 'Citizens may only confirm a resolved complaint or request a re-inspection.' });
        return;
      }
    } else if (user.role === 'officer' && !['Assigned', 'In Progress', 'Resolved', 'Escalated'].includes(targetStatus)) {
      res.status(403).json({ error: 'This status change is not allowed for officers.' });
      return;
    }

    const now = new Date().toISOString();
    const note = bodyStr(body.note).trim().slice(0, 1000);
    const updated: StoredComplaint = {
      ...complaint,
      status: targetStatus,
      updatedAt: now,
      statusHistory: [...complaint.statusHistory, {
        status: targetStatus,
        changedAt: now,
        actorId: user.id,
        ...(note ? { note } : {}),
      }],
      ...(user.role === 'officer' && !complaint.assignedOfficerId
        ? { assignedOfficerId: user.id, assignedOfficer: user.name }
        : {}),
    };
    await complaintStore.replace(updated);
    res.json({ complaint: publicComplaint(updated) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/complaints/:id/upvote', requireAuth, requireRole('citizen'), async (req, res, next) => {
  try {
    const id = String(req.params['id'] ?? '');
    const complaint = await complaintStore.findById(id);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }
    const updated = { ...complaint, upvotes: complaint.upvotes + 1, updatedAt: new Date().toISOString() };
    await complaintStore.replace(updated);
    res.json({ complaint: publicComplaint(updated) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/complaints/:id/evidence', requireAuth, async (req, res, next) => {
  try {
    const id = String(req.params['id'] ?? '');
    const body = (req.body ?? {}) as Record<string, unknown>;
    const user = await userStore.findById(req.session.userId!);
    const complaint = await complaintStore.findById(id);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }
    if (!user || user.status !== 'active' || !canViewComplaint(complaint, user)) {
      res.status(403).json({ error: 'You do not have permission to append evidence to this complaint.' });
      return;
    }

    const note = bodyStr(body.note).trim();
    const photos = complaintPhotoKeys(body.photos);
    if ((!note && (!photos || photos.length === 0)) || note.length > 1000) {
      res.status(400).json({ error: 'Provide a note up to 1000 characters or an uploaded photo.' });
      return;
    }
    if (!photos || complaint.photos.length + photos.length > MAX_PHOTOS_PER_COMPLAINT) {
      res.status(400).json({ error: `A complaint may have up to ${MAX_PHOTOS_PER_COMPLAINT} photos.` });
      return;
    }
    for (const key of photos) {
      const attachment = await attachmentStore.find(key);
      if (!attachment || attachment.ownerId !== user.id) {
        res.status(403).json({ error: 'One or more attached photos are not owned by your account.' });
        return;
      }
    }

    const now = new Date().toISOString();
    const updated: StoredComplaint = {
      ...complaint,
      photos: [...complaint.photos, ...photos.map(key => `/api/uploads/${key}`)],
      description: note
        ? `${complaint.description}\n\n[Supplemental note]: ${note}`
        : complaint.description,
      updatedAt: now,
    };
    await complaintStore.replace(updated);
    for (const key of photos) {
      if (!await attachmentStore.linkToComplaint(key, id, user.id)) {
        throw new Error('Could not link uploaded evidence to its complaint.');
      }
    }
    res.json({ complaint: publicComplaint(updated) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/complaints/:id/assignment', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const id = String(req.params['id'] ?? '');
    const body = (req.body ?? {}) as Record<string, unknown>;
    const officerId = bodyStr(body.officerId).trim();
    const departmentId = bodyStr(body.departmentId).trim();
    const [complaint, officer, department] = await Promise.all([
      complaintStore.findById(id),
      userStore.findById(officerId),
      departmentStore.findById(departmentId),
    ]);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }
    if (!officer || officer.role !== 'officer' || officer.status !== 'active') {
      res.status(400).json({ error: 'Choose an active Ops Field officer.' });
      return;
    }
    if (!department || department.status !== 'active'
      || officer.departmentId !== department.id
      || officer.department !== department.name) {
      res.status(400).json({ error: 'The selected active officer does not belong to the selected department.' });
      return;
    }
    const now = new Date().toISOString();
    const updated: StoredComplaint = {
      ...complaint,
      assignedOfficerId: officer.id,
      assignedOfficer: officer.name,
      departmentId: department.id,
      department: department.name,
      zone: officer.zone ?? complaint.zone,
      ward: officer.assignedWards?.[0] ?? complaint.ward,
      status: complaint.status === 'Submitted' ? 'Assigned' : complaint.status,
      updatedAt: now,
      statusHistory: complaint.status === 'Submitted'
        ? [...complaint.statusHistory, { status: 'Assigned', changedAt: now, actorId: req.session.userId!, note: `Assigned to ${officer.name}` }]
        : complaint.statusHistory,
    };
    await complaintStore.replace(updated);
    res.json({ complaint: publicComplaint(updated) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/complaints/bulk-routing', requireAuth, requireRole('officer', 'admin'), async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const departmentId = bodyStr(body.departmentId).trim();
    const department = await departmentStore.findById(departmentId);
    if (!department || department.status !== 'active') {
      res.status(400).json({ error: 'Choose an active department.' });
      return;
    }
    const user = await userStore.findById(req.session.userId!);
    if (!user || user.status !== 'active') {
      res.status(403).json({ error: 'Your account is not active.' });
      return;
    }

    const now = new Date().toISOString();
    const eligibleStatuses: StoredComplaint['status'][] = ['Submitted', 'Assigned', 'In Progress'];
    const updates = (await complaintStore.list())
      .filter(complaint => eligibleStatuses.includes(complaint.status) && canViewComplaint(complaint, user))
      .map(complaint => ({
        ...complaint,
        departmentId: department.id,
        department: department.name,
        updatedAt: now,
        ...(user.role === 'officer'
          ? { assignedOfficerId: user.id, assignedOfficer: user.name }
          : {}),
      }));

    await complaintStore.replaceMany(updates);
    auditStore.append({
      action: 'COMPLAINTS_BULK_ROUTED',
      actorId: user.id,
      details: `Count: ${updates.length}, department: ${department.id}`,
      ipAddress: getClientIp(req),
    });
    res.json({ count: updates.length, complaints: updates.map(publicComplaint) });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me – restore session
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await userStore.findById(req.session.userId!);
    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ error: 'Session user not found.' });
      return;
    }
    if (user.status !== 'active') {
      req.session.destroy(() => {});
      res.status(403).json({ error: 'Account is not active.' });
      return;
    }
    res.json({ user: toPublicUser(user) });
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/register – citizen self-registration only
app.post('/api/auth/register', registerLimiter, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const email   = bodyStr(body.email);
    const password = bodyStr(body.password);
    const name    = bodyStr(body.name);
    const consent = Boolean(body.consent);

    if (!consent) {
      res.status(400).json({ error: 'You must accept the data processing consent to register.' });
      return;
    }
    if (!name || name.trim().length < 2 || name.trim().length > 100) {
      res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
      return;
    }
    if (!email || !validateEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Password is required.' });
      return;
    }
    const pwError = validatePasswordStrength(password);
    if (pwError) {
      res.status(400).json({ error: pwError });
      return;
    }

    const user = await userStore.create({
      email,
      plainPassword: password,
      name: name.trim(),
      role: 'citizen',   // ALWAYS assigned server-side – never from request body
      status: 'active',
    });

    req.session.regenerate((err) => {
      if (err) { res.status(500).json({ error: 'Session error.' }); return; }
      req.session.userId = user.id;
      req.session.role   = user.role;

      auditStore.append({
        action: 'CITIZEN_REGISTERED',
        actorId: user.id,
        actorEmail: user.email,
        ipAddress: getClientIp(req),
      });

      res.status(201).json({ user: toPublicUser(user) });
    });
  } catch (e: unknown) {
    if ((e as Error).message === 'EMAIL_EXISTS') {
      // Generic – do not reveal whether email exists
      res.status(400).json({ error: 'Registration failed. Please check your details and try again.' });
      return;
    }
    console.error('[register]', e);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const body    = (req.body ?? {}) as Record<string, unknown>;
    const email   = bodyStr(body.email);
    const password = bodyStr(body.password);
    const expectedRole = parsePortalRole(body.portal ?? body.expectedRole);

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    if (!expectedRole) {
      res.status(400).json({ error: 'Select a valid portal to sign in (Citizen, Ops, or Admin).' });
      return;
    }

    const user = await userStore.findByEmail(email);

    // Always run bcrypt to prevent timing-based enumeration
    const dummyHash = '$2b$12$invalidhashpaddingtomatch32charsXXXXXXXXXXX';
    const passwordValid = user
      ? await userStore.verifyPassword(user, password)
      : await import('bcrypt').then(b => b.compare(password, dummyHash));

    if (!user || !passwordValid) {
      auditStore.append({
        action: 'LOGIN_FAILED',
        details: `Email attempted: ${email}`,
        ipAddress: getClientIp(req),
      });
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status !== 'active') {
      auditStore.append({
        action: 'LOGIN_DENIED_INACTIVE',
        actorId: user.id,
        actorEmail: user.email,
        details: `Account status: ${user.status}`,
        ipAddress: getClientIp(req),
      });
      res.status(403).json({ error: 'Your account is not active. Please contact support.' });
      return;
    }

    // Enforce portal/role match from the stored account – never grant the client-requested role.
    if (user.role !== expectedRole) {
      auditStore.append({
        action: 'LOGIN_DENIED_WRONG_PORTAL',
        actorId: user.id,
        actorEmail: user.email,
        details: `Attempted portal: ${expectedRole}, account role: ${user.role}`,
        ipAddress: getClientIp(req),
      });
      res.status(403).json({
        error: `This account is not authorized for the ${portalLabel(expectedRole)} portal. Sign in using the portal assigned to your role.`,
      });
      return;
    }

    // Session regeneration prevents session fixation attacks
    req.session.regenerate((err) => {
      if (err) { res.status(500).json({ error: 'Session error.' }); return; }
      req.session.userId = user.id;
      req.session.role   = user.role;

      auditStore.append({
        action: 'LOGIN_SUCCESS',
        actorId: user.id,
        actorEmail: user.email,
        ipAddress: getClientIp(req),
      });

      res.json({ user: toPublicUser(user) });
    });
  } catch (e) {
    console.error('[login]', e);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const actorId = req.session.userId;
  const ip = getClientIp(req);

  req.session.destroy((err) => {
    if (err) { res.status(500).json({ error: 'Logout failed.' }); return; }
    auditStore.append({ action: 'LOGOUT', actorId, ipAddress: ip });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

// GET /api/auth/session – lightweight check (no DB hit)
app.get('/api/auth/session', (req, res) => {
  if (req.session.userId && req.session.role) {
    res.json({ authenticated: true, role: req.session.role });
  } else {
    res.json({ authenticated: false });
  }
});

// ── User Management (Admin only) ──────────────────────────────────────────────

// GET /api/admin/users
app.get('/api/admin/users', requireAuth, requireRole('admin'), async (_req, res) => {
  const all = await userStore.listAll();
  res.json({ users: all.map(toPublicUser) });
});

app.get('/api/admin/departments', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    res.json({ departments: await departmentStore.list() });
  } catch (error) {
    next(error);
  }
});

app.get('/api/departments', requireAuth, requireRole('officer', 'admin'), async (_req, res, next) => {
  try {
    res.json({ departments: (await departmentStore.list()).filter(department => department.status === 'active') });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/departments', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const name = bodyStr((req.body as Record<string, unknown> | undefined)?.name).trim();
    if (name.length < 2 || name.length > 120) {
      res.status(400).json({ error: 'Department name must be between 2 and 120 characters.' });
      return;
    }
    const department = await departmentStore.create(name);
    auditStore.append({
      action: 'DEPARTMENT_CREATED',
      actorId: String(req.session.userId ?? ''),
      targetId: department.id,
      details: `Department: ${department.name}`,
      ipAddress: getClientIp(req),
    });
    res.status(201).json({ department });
  } catch (error) {
    if (error instanceof Error && error.message === 'DEPARTMENT_EXISTS') {
      res.status(409).json({ error: 'A department with this name already exists.' });
      return;
    }
    next(error);
  }
});

app.patch('/api/admin/departments/:id/status', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const status = bodyStr((req.body as Record<string, unknown> | undefined)?.status);
    if (status !== 'active' && status !== 'inactive') {
      res.status(400).json({ error: 'Department status must be active or inactive.' });
      return;
    }
    const department = await departmentStore.setStatus(String(req.params['id'] ?? ''), status);
    if (!department) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }
    auditStore.append({
      action: 'DEPARTMENT_STATUS_CHANGED',
      actorId: String(req.session.userId ?? ''),
      targetId: department.id,
      details: `Status: ${status}`,
      ipAddress: getClientIp(req),
    });
    res.json({ department });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/users/:id/department', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const id = String(req.params['id'] ?? '');
    const departmentId = bodyStr((req.body as Record<string, unknown> | undefined)?.departmentId).trim();
    const [user, department] = await Promise.all([
      userStore.findById(id),
      departmentStore.findById(departmentId),
    ]);
    if (!user || user.role !== 'officer') {
      res.status(404).json({ error: 'Officer account not found.' });
      return;
    }
    if (!department || department.status !== 'active') {
      res.status(400).json({ error: 'Choose an active department.' });
      return;
    }
    const updated = await userStore.updateFields(id, {
      departmentId: department.id,
      department: department.name,
    });
    if (!updated) {
      res.status(404).json({ error: 'Officer account not found.' });
      return;
    }
    auditStore.append({
      action: 'OFFICER_DEPARTMENT_CHANGED',
      actorId: String(req.session.userId ?? ''),
      targetId: updated.id,
      details: `Department ID: ${department.id}`,
      ipAddress: getClientIp(req),
    });
    res.json({ user: toPublicUser(updated) });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/users – provision officer or admin account
app.post('/api/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const email             = bodyStr(body.email);
    const name              = bodyStr(body.name);
    const role              = bodyStr(body.role) as UserRole;
    const department        = body.department ? bodyStr(body.department) : undefined;
    const departmentId      = body.departmentId ? bodyStr(body.departmentId) : undefined;
    const zone              = body.zone       ? bodyStr(body.zone)       : undefined;
    const temporaryPassword = bodyStr(body.temporaryPassword);
    const assignedWards     = Array.isArray(body.assignedWards)
      ? (body.assignedWards as unknown[]).map(w => bodyStr(w))
      : [];

    if (!['officer', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Provisioned accounts must be officer or admin role.' });
      return;
    }
    if (!email || !validateEmail(email)) {
      res.status(400).json({ error: 'Valid email required.' });
      return;
    }
    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: 'Name required (min 2 characters).' });
      return;
    }
    if (!temporaryPassword) {
      res.status(400).json({ error: 'Temporary password required.' });
      return;
    }
    const pwError = validatePasswordStrength(temporaryPassword);
    if (pwError) { res.status(400).json({ error: pwError }); return; }

    let selectedDepartment: Awaited<ReturnType<typeof departmentStore.findById>> = null;
    if (role === 'officer') {
      selectedDepartment = departmentId ? await departmentStore.findById(departmentId) : null;
      if (!selectedDepartment || selectedDepartment.status !== 'active') {
        res.status(400).json({ error: 'Choose an active department for the officer.' });
        return;
      }
    }

    const newUser = await userStore.create({
      email,
      plainPassword: temporaryPassword,
      name: name.trim(),
      role,
      status: role === 'admin' ? 'active' : 'pending',
      department: selectedDepartment?.name ?? department,
      departmentId: selectedDepartment?.id,
      zone,
      assignedWards,
    });

    auditStore.append({
      action: 'OFFICER_PROVISIONED',
      actorId: String(req.session.userId ?? ''),
      targetId: newUser.id,
      targetEmail: newUser.email,
      details: `Role: ${role}, Dept: ${department}`,
      ipAddress: getClientIp(req),
    });

    res.status(201).json({ user: toPublicUser(newUser) });
  } catch (e: unknown) {
    if ((e as Error).message === 'EMAIL_EXISTS') {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    console.error('[provision user]', e);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/admin/users/:id/status
app.patch('/api/admin/users/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const id     = String(req.params['id'] ?? '');
    const body   = (req.body ?? {}) as Record<string, unknown>;
    const status = bodyStr(body.status) as AccountStatus;

    const validStatuses: AccountStatus[] = ['active', 'pending', 'suspended', 'disabled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status value.' });
      return;
    }
    if (id === req.session.userId && (status === 'suspended' || status === 'disabled')) {
      res.status(400).json({ error: 'You cannot suspend or disable your own account.' });
      return;
    }

    const updated = await userStore.updateStatus(id, status);
    if (!updated) { res.status(404).json({ error: 'User not found.' }); return; }

    auditStore.append({
      action: 'ACCOUNT_STATUS_CHANGED',
      actorId: String(req.session.userId ?? ''),
      targetId: id,
      details: `New status: ${status}`,
      ipAddress: getClientIp(req),
    });

    res.json({ user: toPublicUser(updated) });
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/admin/users/:id/approve – approve pending officer
app.patch('/api/admin/users/:id/approve', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const id   = String(req.params['id'] ?? '');
    const user = await userStore.findById(id);
    if (!user) { res.status(404).json({ error: 'User not found.' }); return; }
    if (user.status !== 'pending') {
      res.status(400).json({ error: 'User is not in pending state.' });
      return;
    }

    const updated = await userStore.updateStatus(id, 'active');
    auditStore.append({
      action: 'OFFICER_APPROVED',
      actorId: String(req.session.userId ?? ''),
      targetId: id,
      targetEmail: user.email,
      ipAddress: getClientIp(req),
    });

    res.json({ user: toPublicUser(updated!) });
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/admin/users/:id/role
app.patch('/api/admin/users/:id/role', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const id   = String(req.params['id'] ?? '');
    const body = (req.body ?? {}) as Record<string, unknown>;
    const role        = bodyStr(body.role) as UserRole;
    const department  = body.department ? bodyStr(body.department) : undefined;
    const zone        = body.zone       ? bodyStr(body.zone)       : undefined;
    const assignedWards = Array.isArray(body.assignedWards)
      ? (body.assignedWards as unknown[]).map(w => bodyStr(w))
      : undefined;

    const validRoles: UserRole[] = ['citizen', 'officer', 'admin'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role.' });
      return;
    }

    if (role !== 'admin') {
      const admins = await userStore.listByRole('admin');
      const isTargetAdmin = admins.find(a => a.id === id);
      if (isTargetAdmin && admins.length === 1) {
        res.status(400).json({ error: 'Cannot remove the last administrator account.' });
        return;
      }
    }

    const updated = await userStore.updateFields(id, { role, department, zone, assignedWards });
    if (!updated) { res.status(404).json({ error: 'User not found.' }); return; }

    auditStore.append({
      action: 'ROLE_CHANGED',
      actorId: String(req.session.userId ?? ''),
      targetId: id,
      details: `New role: ${role}`,
      ipAddress: getClientIp(req),
    });

    res.json({ user: toPublicUser(updated) });
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/audit
app.get('/api/admin/audit', requireAuth, requireRole('admin'), (_req, res) => {
  res.json({ events: auditStore.getRecent(200) });
});

// ── Officer Profile API ───────────────────────────────────────────────────────

app.get('/api/officer/profile', requireAuth, requireRole('officer', 'admin'), async (req, res) => {
  const user = await userStore.findById(req.session.userId!);
  if (!user) { res.status(404).json({ error: 'Not found.' }); return; }
  res.json({ user: toPublicUser(user) });
});

// ── Citizen Profile API ───────────────────────────────────────────────────────

app.get('/api/citizen/profile', requireAuth, requireRole('citizen'), async (req, res) => {
  const user = await userStore.findById(req.session.userId!);
  if (!user) { res.status(404).json({ error: 'Not found.' }); return; }
  res.json({ user: toPublicUser(user) });
});

// PATCH /api/auth/profile – authenticated user updates their own safe fields
app.patch('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name       = body.name       !== undefined ? bodyStr(body.name).trim()       : undefined;
    const department = body.department !== undefined ? bodyStr(body.department).trim() : undefined;
    const zone       = body.zone       !== undefined ? bodyStr(body.zone).trim()       : undefined;

    if (name !== undefined && (name.length < 2 || name.length > 100)) {
      res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
      return;
    }

    const currentUser = await userStore.findById(req.session.userId!);
    if (!currentUser || currentUser.status !== 'active') {
      res.status(403).json({ error: 'Your account is not active.' });
      return;
    }
    if (currentUser.role === 'officer' && department !== undefined) {
      res.status(403).json({ error: 'Officer department membership can only be changed by an administrator.' });
      return;
    }

    const fields: Partial<Pick<StoredUser, 'name' | 'department' | 'zone'>> = {};
    if (name       !== undefined) fields.name       = name;
    if (department !== undefined) fields.department = department || undefined;
    if (zone       !== undefined) fields.zone       = zone || undefined;

    if (Object.keys(fields).length === 0) {
      res.status(400).json({ error: 'No valid fields to update.' });
      return;
    }

    const updated = await userStore.updateFields(req.session.userId!, fields);
    if (!updated) { res.status(404).json({ error: 'User not found.' }); return; }

    auditStore.append({
      action: 'PROFILE_UPDATED',
      actorId: String(req.session.userId ?? ''),
      targetId: updated.id,
      targetEmail: updated.email,
      details: `Fields: ${Object.keys(fields).join(', ')}`,
      ipAddress: getClientIp(req),
    });

    res.json({ user: toPublicUser(updated) });
  } catch {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

const frontendDirectory = resolve('dist');
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});
if (IS_PROD) {
  app.use(express.static(frontendDirectory, { index: false, fallthrough: true }));
  app.get('/{*path}', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found.' });
      return;
    }
    res.sendFile(resolve(frontendDirectory, 'index.html'));
  });
}

// ── 404 & Error Handlers ──────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[NagarSetu Server Error]', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

async function startServer(): Promise<void> {
  if (IS_PROD) {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required in production; local JSON stores are not multi-instance safe.');
    if (!process.env.MONGODB_DB_NAME) throw new Error('MONGODB_DB_NAME is required in production.');
    if (SESSION_SECRET.length < 32 || SESSION_SECRET.startsWith('CHANGE_ME')) {
      throw new Error('SESSION_SECRET must be at least 32 characters and must not use the placeholder value.');
    }
    if (!process.env.ALLOWED_ORIGINS?.trim()) {
      throw new Error('ALLOWED_ORIGINS must explicitly list the HTTPS frontend origin(s) in production.');
    }
    const origins = ALLOWED_ORIGINS.filter(Boolean);
    if (origins.length === 0 || origins.some(origin => {
      try {
        return new URL(origin).protocol !== 'https:';
      } catch {
        return true;
      }
    })) {
      throw new Error('Every ALLOWED_ORIGINS entry must be a valid HTTPS origin in production.');
    }
    const sameSite = process.env.SESSION_COOKIE_SAME_SITE ?? 'strict';
    if (!['strict', 'lax', 'none'].includes(sameSite)) {
      throw new Error('SESSION_COOKIE_SAME_SITE must be strict, lax, or none.');
    }
  }
  validateAttachmentStorageConfiguration(IS_PROD);
  await connectDatabase();
  await verifyAttachmentObjectStore();
  await Promise.all([loadComplaints(), loadAttachmentMetadata()]);
  await seedDemoAccounts();
  await initializeDepartmentStore((await userStore.listByRole('officer'))
    .map(officer => officer.department ?? '')
    .filter(Boolean));
  app.listen(PORT, () => {
    console.log(`[NagarSetu] API server running on http://localhost:${PORT}`);
    console.log(`[NagarSetu] Environment: ${IS_PROD ? 'production' : 'development'}`);
  });
}

startServer().catch(async err => {
  console.error('[NagarSetu] Startup failed:', err);
  closeAttachmentStore();
  await closeDatabase();
  process.exit(1);
});

export default app;
