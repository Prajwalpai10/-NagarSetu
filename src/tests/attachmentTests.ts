import { spawn, ChildProcess } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apiClient } from '../services/apiClient';

const PORT = 14722;
const S3_PORT = 14723;
const BASE_URL = `http://localhost:${PORT}`;
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/XioAAAAASUVORK5CYII=',
  'base64'
);

let serverProcess: ChildProcess | null = null;
let objectServer: Server | null = null;
let dataDirectory = '';
let passCount = 0;
let failCount = 0;
const mockS3Objects = new Map<string, { bytes: Buffer; contentType: string }>();

function assert(name: string, condition: boolean): void {
  if (condition) {
    passCount++;
    console.log(`  ✓ ${name}`);
  } else {
    failCount++;
    console.error(`  ✗ ${name}`);
  }
}

function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    serverProcess = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
      env: {
        ...process.env,
        PORT: String(PORT),
        SESSION_SECRET: 'attachment-test-secret-only',
        NODE_ENV: 'test',
        ALLOWED_ORIGINS: BASE_URL,
        SEED_ADMIN_EMAIL: 'admin@attachments.test',
        SEED_ADMIN_PASSWORD: 'AdminAttach@123!',
        SEED_OFFICER_EMAIL: 'officer@attachments.test',
        SEED_OFFICER_PASSWORD: 'OfficerAttach@123!',
        SEED_CITIZEN_EMAIL: 'citizen@attachments.test',
        SEED_CITIZEN_PASSWORD: 'CitizenAttach@123!',
        USER_STORE_FILE: join(dataDirectory, 'users.json'),
        COMPLAINT_STORE_FILE: join(dataDirectory, 'complaints.json'),
        ATTACHMENT_METADATA_FILE: join(dataDirectory, 'attachments.json'),
        UPLOAD_DIR: join(dataDirectory, 'uploads'),
        S3_BUCKET: 'nagarsetu-test-bucket',
        S3_REGION: 'us-east-1',
        S3_ENDPOINT: `http://127.0.0.1:${S3_PORT}`,
        S3_FORCE_PATH_STYLE: 'true',
        S3_ACCESS_KEY_ID: 'test-access-key',
        S3_SECRET_ACCESS_KEY: 'test-secret-key',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    const timeout = setTimeout(() => reject(new Error(`API startup timed out. ${output}`)), 20000);
    const onOutput = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.includes('API server running')) {
        clearTimeout(timeout);
        resolve();
      }
    };

    serverProcess.stdout?.on('data', onOutput);
    serverProcess.stderr?.on('data', onOutput);
    serverProcess.on('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
    serverProcess.on('exit', code => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`API exited with code ${code}. ${output}`));
      }
    });
  });
}

async function startMockObjectStorage(): Promise<void> {
  objectServer = createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);
    const key = parts.slice(1).join('/');
    const mapKey = `${parts[0]}/${key}`;
    if (request.method === 'HEAD' && parts.length === 1) {
      response.writeHead(200).end();
      return;
    }
    if (request.method === 'PUT' && key) {
      const chunks: Buffer[] = [];
      request.on('data', chunk => chunks.push(Buffer.from(chunk)));
      request.on('end', () => {
        mockS3Objects.set(mapKey, {
          bytes: Buffer.concat(chunks),
          contentType: request.headers['content-type'] ?? 'application/octet-stream',
        });
        response.writeHead(200, { ETag: '"test-object"' }).end();
      });
      return;
    }
    if (request.method === 'GET' && key) {
      const object = mockS3Objects.get(mapKey);
      if (!object) {
        response.writeHead(404, { 'x-amz-error-code': 'NoSuchKey' }).end();
        return;
      }
      response.writeHead(200, {
        'Content-Type': object.contentType,
        'Content-Length': object.bytes.byteLength,
      }).end(object.bytes);
      return;
    }
    if (request.method === 'DELETE' && key) {
      mockS3Objects.delete(mapKey);
      response.writeHead(204).end();
      return;
    }
    response.writeHead(404).end();
  });
  await new Promise<void>((resolve, reject) => {
    objectServer?.once('error', reject);
    objectServer?.listen(S3_PORT, '127.0.0.1', resolve);
  });
}

async function stopMockObjectStorage(): Promise<void> {
  if (!objectServer) return;
  await new Promise<void>((resolve, reject) => {
    objectServer?.close(error => error ? reject(error) : resolve());
  });
  objectServer = null;
  mockS3Objects.clear();
}

async function stopServer(): Promise<void> {
  if (!serverProcess || serverProcess.exitCode !== null) return;
  const processToStop = serverProcess;
  await new Promise<void>(resolve => {
    processToStop.once('exit', () => resolve());
    processToStop.kill();
  });
  serverProcess = null;
}

async function main(): Promise<void> {
  dataDirectory = await mkdtemp(join(tmpdir(), 'nagarsetu-attachments-'));

  try {
    await startMockObjectStorage();
    await startServer();
    console.log('\nNagarSetu attachment workflow tests');
    console.log('===================================\n');

    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'citizen@attachments.test',
        password: 'CitizenAttach@123!',
        portal: 'citizen',
      }),
    });
    const loginBody = await loginResponse.json() as { user?: { role?: string } };
    const cookie = loginResponse.headers.get('set-cookie')?.split(';')[0] ?? '';
    assert('Citizen session established', loginResponse.status === 200 && loginBody.user?.role === 'citizen' && !!cookie);

    const unauthorizedUpload = await fetch(`${BASE_URL}/api/complaints/attachments`, {
      method: 'POST',
      body: new FormData(),
    });
    assert('Unauthenticated upload is rejected', unauthorizedUpload.status === 401);

    const officerLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'officer@attachments.test',
        password: 'OfficerAttach@123!',
        portal: 'officer',
      }),
    });
    const officerCookie = officerLogin.headers.get('set-cookie')?.split(';')[0] ?? '';
    const forbiddenUpload = await fetch(`${BASE_URL}/api/complaints/attachments`, {
      method: 'POST',
      headers: { Cookie: officerCookie },
      body: new FormData(),
    });
    assert('Non-citizen session cannot upload complaint photos', forbiddenUpload.status === 403);

    const invalidTypeForm = new FormData();
    invalidTypeForm.append('photo', new Blob(['not an image'], { type: 'text/plain' }), 'note.txt');
    const invalidTypeResponse = await fetch(`${BASE_URL}/api/complaints/attachments`, {
      method: 'POST',
      headers: { Cookie: cookie },
      body: invalidTypeForm,
    });
    const invalidTypeBody = await invalidTypeResponse.json() as { error?: string };
    assert('Unsupported file type returns a clear 400 error',
      invalidTypeResponse.status === 400 && Boolean(invalidTypeBody.error));

    const invalidContentForm = new FormData();
    invalidContentForm.append('photo', new Blob(['not actually a png'], { type: 'image/png' }), 'fake.png');
    const invalidContentResponse = await fetch(`${BASE_URL}/api/complaints/attachments`, {
      method: 'POST',
      headers: { Cookie: cookie },
      body: invalidContentForm,
    });
    const invalidContentBody = await invalidContentResponse.json() as { error?: string };
    assert('Image content is checked, not just the declared MIME type',
      invalidContentResponse.status === 400 && Boolean(invalidContentBody.error));

    const oversizedForm = new FormData();
    oversizedForm.append(
      'photo',
      new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: 'image/png' }),
      'large.png'
    );
    const oversizedResponse = await fetch(`${BASE_URL}/api/complaints/attachments`, {
      method: 'POST',
      headers: { Cookie: cookie },
      body: oversizedForm,
    });
    const oversizedBody = await oversizedResponse.json() as { error?: string };
    assert('Oversized file returns a clear 413 error',
      oversizedResponse.status === 413 && Boolean(oversizedBody.error));

    const originalFetch = globalThis.fetch;
    let clientSetContentType: string | null = null;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = input instanceof Request ? input.url : String(input);
      const headers = new Headers(init?.headers);
      clientSetContentType = headers.get('content-type');
      headers.set('Cookie', cookie);
      return originalFetch(new URL(requestUrl, BASE_URL), { ...init, headers });
    }) as typeof fetch;
    let uploadResult;
    try {
      uploadResult = await apiClient.uploadComplaintPhoto(new File([PNG_BYTES], 'evidence.png', { type: 'image/png' }));
    } finally {
      globalThis.fetch = originalFetch;
    }
    assert('Frontend upload request leaves multipart boundary to fetch', clientSetContentType === null);
    assert('Valid photo upload returns a persistent URL', typeof uploadResult.data?.url === 'string');
    if (!uploadResult.data?.url) throw new Error(uploadResult.error ?? 'Upload response did not include a photo URL.');
    const uploadedUrl = uploadResult.data.url;

    const originalFetchForComplaint = globalThis.fetch;
    let complaintResult;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = input instanceof Request ? input.url : String(input);
      const headers = new Headers(init?.headers);
      headers.set('Cookie', cookie);
      return originalFetchForComplaint(new URL(requestUrl, BASE_URL), { ...init, headers });
    }) as typeof fetch;
    try {
      complaintResult = await apiClient.createComplaint({
        category: 'Roads & Potholes',
        title: 'Persistent photo test',
        description: 'Complaint and attachment are linked through the API.',
        location: 'Test street, Bengaluru',
        locationSource: 'manual',
        photos: [uploadedUrl],
      });
    } finally {
      globalThis.fetch = originalFetchForComplaint;
    }
    const storedComplaint = complaintResult.data?.complaint;
    assert('Complaint API persists the uploaded photo URL with its record',
      Boolean(storedComplaint?.id && storedComplaint.photos.includes(uploadedUrl)));
    if (!storedComplaint) throw new Error(complaintResult.error ?? 'Complaint was not persisted.');

    const initialRetrieval = await fetch(`${BASE_URL}${uploadedUrl}`, {
      headers: { Cookie: cookie },
    });
    const initialBytes = Buffer.from(await initialRetrieval.arrayBuffer());
    assert('Uploaded photo is retrievable as PNG',
      initialRetrieval.status === 200
      && Boolean(initialRetrieval.headers.get('content-type')?.includes('image/png'))
      && initialBytes.equals(PNG_BYTES));

    await stopServer();
    await startServer();
    const reloginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'citizen@attachments.test',
        password: 'CitizenAttach@123!',
        portal: 'citizen',
      }),
    });
    const refreshedCookie = reloginResponse.headers.get('set-cookie')?.split(';')[0] ?? '';
    const restoredComplaintsResponse = await fetch(`${BASE_URL}/api/complaints`, {
      headers: { Cookie: refreshedCookie },
    });
    const restoredComplaints = await restoredComplaintsResponse.json() as { complaints?: Array<{ id: string; photos: string[] }> };
    assert('Complaint and attachment reference reload after API restart',
      restoredComplaintsResponse.status === 200 &&
      Boolean(restoredComplaints.complaints?.some(complaint =>
        complaint.id === storedComplaint.id && complaint.photos.includes(uploadedUrl))));
    const refreshedRetrieval = await fetch(`${BASE_URL}${uploadedUrl}`, {
      headers: { Cookie: refreshedCookie },
    });
    const refreshedBytes = Buffer.from(await refreshedRetrieval.arrayBuffer());
    assert('Uploaded photo remains available after API restart/page refresh',
      reloginResponse.status === 200
      && refreshedRetrieval.status === 200
      && refreshedBytes.equals(PNG_BYTES));

    console.log(`\nResults: ${passCount} passed, ${failCount} failed`);
    if (failCount > 0) process.exitCode = 1;
  } finally {
    await stopServer();
    await stopMockObjectStorage();
    await rm(dataDirectory, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error('[attachment tests] Failed:', error);
  process.exitCode = 1;
});
