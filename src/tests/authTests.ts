/**
 * NagarSetu – Authentication & Authorisation Tests
 *
 * Tests the Express API server directly using fetch.
 * Run with: npm run test:auth
 * (Requires the server to NOT be already running – this script starts it inline)
 *
 * Test coverage:
 * 1.  Health check – server responds
 * 2.  Login – valid admin credentials → 200 + user object
 * 3.  Login – valid officer credentials → 200 + user object
 * 4.  Login – valid citizen credentials → 200 + user object
 * 5.  Login – wrong password → 401 generic error
 * 6.  Login – non-existent email → 401 generic error (no email enumeration)
 * 7.  Login – missing fields → 400
 * 8.  Session restore – /api/auth/me with valid cookie → 200
 * 9.  Session restore – no cookie → 401
 * 10. Register – new citizen → 201 + role = citizen (never admin/officer)
 * 11. Register – duplicate email → 400 generic error
 * 12. Register – without consent → 400
 * 13. Register – weak password → 400
 * 14. Register – role injection (trying to set role=admin) → must be citizen
 * 15. Admin: get users – authenticated admin → 200
 * 16. Admin: get users – citizen session → 403
 * 17. Admin: get users – unauthenticated → 401
 * 18. Admin: provision officer → 201, status=pending
 * 19. Admin: approve officer → officer status=active
 * 20. Admin: officer cannot access /api/admin/users → 403
 * 21. Admin: citizen cannot access /api/admin/users → 403
 * 22. Logout → 200, subsequent /api/auth/me → 401
 * 23. Suspended account → login denied
 * 24. Officer: cannot provision users (no admin role) → 403
 * 25. Admin: cannot disable own account → 400
 */

import { spawn, ChildProcess } from 'child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT ?? 4000}`;
const TEMP_PORT = 14721; // Use different port to avoid conflicts with running dev server
const TEST_BASE = `http://localhost:${TEMP_PORT}`;

// ── Test runner ───────────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;
const failures: string[] = [];

function pass(name: string) {
  passCount++;
  console.log(`  ✓ ${name}`);
}

function fail(name: string, reason: string) {
  failCount++;
  failures.push(`  ✗ ${name}: ${reason}`);
  console.log(`  ✗ ${name}: ${reason}`);
}

async function assert(name: string, condition: boolean | Promise<boolean>, errMsg?: string) {
  try {
    const result = await condition;
    if (result) pass(name);
    else fail(name, errMsg ?? 'Assertion failed');
  } catch (e: unknown) {
    fail(name, `Threw: ${(e as Error).message}`);
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

// node-fetch-compatible using native fetch (Node 18+)
async function api(
  method: string,
  path: string,
  body?: unknown,
  cookie?: string
): Promise<{ status: number; data: unknown; setCookie?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;

  const res = await fetch(`${TEST_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  const setCookie = res.headers.get('set-cookie') ?? undefined;
  return { status: res.status, data, setCookie };
}

function extractCookie(setCookie: string | undefined): string {
  if (!setCookie) return '';
  return setCookie.split(';')[0];
}

// ── Server process management ─────────────────────────────────────────────────

let serverProcess: ChildProcess | null = null;
let testStoreDirectory = '';

function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    serverProcess = spawn(
      process.execPath,
      ['--import', 'tsx', 'server/index.ts'],
      {
        env: {
          ...process.env,
          PORT: String(TEMP_PORT),
          SESSION_SECRET: 'test-secret-for-auth-tests-only-not-production',
          NODE_ENV: 'test',
          ALLOWED_ORIGINS: TEST_BASE,
          SEED_ADMIN_EMAIL: 'admin@test.nagarsetu',
          SEED_ADMIN_PASSWORD: 'AdminTest@123!',
          SEED_OFFICER_EMAIL: 'officer@test.nagarsetu',
          SEED_OFFICER_PASSWORD: 'OfficerTest@123!',
          SEED_CITIZEN_EMAIL: 'citizen@test.nagarsetu',
          SEED_CITIZEN_PASSWORD: 'CitizenTest@123!',
          USER_STORE_FILE: join(testStoreDirectory, 'users.json'),
          DEPARTMENT_STORE_FILE: join(testStoreDirectory, 'departments.json'),
          COMPLAINT_STORE_FILE: join(testStoreDirectory, 'complaints.json'),
          ATTACHMENT_METADATA_FILE: join(testStoreDirectory, 'attachments.json'),
          UPLOAD_DIR: join(testStoreDirectory, 'uploads'),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 20000);

    serverProcess.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      if (text.includes('API server running')) {
        clearTimeout(timeout);
        setTimeout(resolve, 300); // Brief settle time
      }
    });

    serverProcess.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      if (text.includes('FATAL') || text.includes('EADDRINUSE')) {
        clearTimeout(timeout);
        reject(new Error(text.trim()));
      }
    });

    serverProcess.on('error', (err) => { clearTimeout(timeout); reject(err); });
  });
}

function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!serverProcess) { resolve(); return; }
    serverProcess.on('close', resolve);
    serverProcess.kill('SIGTERM');
    setTimeout(resolve, 2000); // Force-resolve after 2s
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log('\n NagarSetu – Authentication Test Suite');
  console.log('========================================\n');

  // ── Group 1: Health ───────────────────────────────────────────────────────
  console.log('Group 1: Server health');
  const health = await api('GET', '/api/health');
  await assert('1. Health check responds 200', health.status === 200);
  await assert('1. Health check has users count', typeof (health.data as Record<string, unknown>)?.users === 'number');

  // ── Group 2: Login ────────────────────────────────────────────────────────
  console.log('\nGroup 2: Login');

  const adminLogin = await api('POST', '/api/auth/login', {
    email: 'admin@test.nagarsetu', password: 'AdminTest@123!', portal: 'admin'
  });
  await assert('2. Admin login → 200', adminLogin.status === 200);
  await assert('2. Admin login → role=admin', Boolean(
    (adminLogin.data as Record<string, unknown>)?.user &&
    ((adminLogin.data as Record<string, unknown>).user as Record<string, unknown>)?.role === 'admin'));
  const adminCookie = extractCookie(adminLogin.setCookie);

  const officerLogin = await api('POST', '/api/auth/login', {
    email: 'officer@test.nagarsetu', password: 'OfficerTest@123!', portal: 'officer'
  });
  await assert('3. Officer login → 200', officerLogin.status === 200);
  await assert('3. Officer login → role=officer', ((officerLogin.data as Record<string, unknown>)?.user as Record<string, unknown>)?.role === 'officer');
  const officerCookie = extractCookie(officerLogin.setCookie);

  const citizenLogin = await api('POST', '/api/auth/login', {
    email: 'citizen@test.nagarsetu', password: 'CitizenTest@123!', portal: 'citizen'
  });
  await assert('4. Citizen login → 200', citizenLogin.status === 200);
  await assert('4. Citizen login → role=citizen', ((citizenLogin.data as Record<string, unknown>)?.user as Record<string, unknown>)?.role === 'citizen');
  const citizenCookie = extractCookie(citizenLogin.setCookie);

  const citizenOnAdmin = await api('POST', '/api/auth/login', {
    email: 'citizen@test.nagarsetu', password: 'CitizenTest@123!', portal: 'admin'
  });
  await assert('4b. Citizen credentials on Admin portal → 403', citizenOnAdmin.status === 403);
  await assert('4b. Wrong-portal error mentions portal', String((citizenOnAdmin.data as Record<string, unknown>)?.error ?? '').includes('Admin portal'));
  const wrongPortalCookie = extractCookie(citizenOnAdmin.setCookie);
  const meAfterWrongPortal = await api('GET', '/api/auth/me', undefined, wrongPortalCookie || undefined);
  await assert('4b. Wrong-portal login creates no session', meAfterWrongPortal.status === 401);

  const officerOnCitizen = await api('POST', '/api/auth/login', {
    email: 'officer@test.nagarsetu', password: 'OfficerTest@123!', portal: 'citizen'
  });
  await assert('4c. Officer credentials on Citizen portal → 403', officerOnCitizen.status === 403);

  const adminOnOps = await api('POST', '/api/auth/login', {
    email: 'admin@test.nagarsetu', password: 'AdminTest@123!', portal: 'officer'
  });
  await assert('4d. Admin credentials on Ops portal → 403', adminOnOps.status === 403);

  const missingPortal = await api('POST', '/api/auth/login', {
    email: 'citizen@test.nagarsetu', password: 'CitizenTest@123!'
  });
  await assert('4e. Login without portal → 400', missingPortal.status === 400);

  const badPw = await api('POST', '/api/auth/login', {
    email: 'admin@test.nagarsetu', password: 'WrongPassword1!', portal: 'admin'
  });
  await assert('5. Wrong password → 401', badPw.status === 401);
  await assert('5. Wrong password → generic error (no enumeration)', (badPw.data as Record<string, unknown>)?.error === 'Invalid email or password.');

  const noEmail = await api('POST', '/api/auth/login', {
    email: 'doesnotexist@nagarsetu.gov', password: 'SomePassword1!', portal: 'admin'
  });
  await assert('6. Non-existent email → 401 (same generic error)', noEmail.status === 401);

  const missingFields = await api('POST', '/api/auth/login', {});
  await assert('7. Missing credentials → 400', missingFields.status === 400);

  // ── Group 3: Session ──────────────────────────────────────────────────────
  console.log('\nGroup 3: Session restoration');

  const meWithCookie = await api('GET', '/api/auth/me', undefined, adminCookie);
  await assert('8. /auth/me with valid cookie → 200', meWithCookie.status === 200);
  await assert('8. /auth/me returns user object', !!(meWithCookie.data as Record<string, unknown>)?.user);

  const meNoCookie = await api('GET', '/api/auth/me');
  await assert('9. /auth/me no cookie → 401', meNoCookie.status === 401);

  // ── Group 4: Registration ─────────────────────────────────────────────────
  console.log('\nGroup 4: Citizen registration');

  const newEmail = `test_${Date.now()}@example.com`;
  const regOk = await api('POST', '/api/auth/register', {
    email: newEmail, password: 'NewCitizen@123', name: 'Test Citizen', consent: true
  });
  await assert('10. Citizen register → 201', regOk.status === 201);
  await assert('10. Registered user → role=citizen (never escalated)', ((regOk.data as Record<string, unknown>)?.user as Record<string, unknown>)?.role === 'citizen');

  const dupEmail = await api('POST', '/api/auth/register', {
    email: newEmail, password: 'NewCitizen@123', name: 'Dup', consent: true
  });
  await assert('11. Duplicate email → 400 generic error', dupEmail.status === 400);

  const noConsent = await api('POST', '/api/auth/register', {
    email: 'nc2@example.com', password: 'NewCitizen@123', name: 'NC2', consent: false
  });
  await assert('12. No consent → 400', noConsent.status === 400);

  const weakPw = await api('POST', '/api/auth/register', {
    email: 'nc3@example.com', password: 'weak', name: 'NC3', consent: true
  });
  await assert('13. Weak password → 400', weakPw.status === 400);

  // Role injection attempt – try to send role=admin in body
  const roleInjection = await api('POST', '/api/auth/register', {
    email: `inject_${Date.now()}@example.com`, password: 'InjectionTest@123',
    name: 'Injector', consent: true, role: 'admin'
  });
  await assert('14. Role injection in body → still citizen', roleInjection.status === 201 &&
    ((roleInjection.data as Record<string, unknown>)?.user as Record<string, unknown>)?.role === 'citizen');

  // ── Group 5: RBAC ─────────────────────────────────────────────────────────
  console.log('\nGroup 5: Role-Based Access Control');

  const adminUsers = await api('GET', '/api/admin/users', undefined, adminCookie);
  await assert('15. Admin /admin/users → 200', adminUsers.status === 200);
  const adminDepartments = await api('GET', '/api/admin/departments', undefined, adminCookie);
  const departmentsAtStart = (adminDepartments.data as Record<string, unknown>)?.departments as Array<Record<string, unknown>>;
  const roadsDepartment = departmentsAtStart?.find(department => department.name === 'Roads & Infra (BBMP)');
  const roadsDepartmentId = String(roadsDepartment?.id ?? '');
  await assert('15a. Admin directory returns persisted legacy department with stable ID',
    adminDepartments.status === 200 && roadsDepartment?.status === 'active' && Boolean(roadsDepartmentId));
  const seededDevelopmentNames = [
    'Roads & Infra (BBMP)',
    'Water Supply (BWSSB)',
    'Electricity & Power (BESCOM)',
    'Solid Waste Management (BBMP)',
    'Stormwater & Drainage (BBMP)',
    'Parks & Environment (BBMP)',
  ];
  await assert('15b. Development startup seeds the civic department registry without requiring officer accounts',
    seededDevelopmentNames.every(name => departmentsAtStart?.some(department => department.name === name && department.status === 'active')));

  const citizenAdminUsers = await api('GET', '/api/admin/users', undefined, citizenCookie);
  await assert('16. Citizen /admin/users → 403', citizenAdminUsers.status === 403);
  const citizenAdminDepartments = await api('GET', '/api/admin/departments', undefined, citizenCookie);
  await assert('16a. Citizen cannot read the Admin department registry', citizenAdminDepartments.status === 403);

  const unauthAdminUsers = await api('GET', '/api/admin/users');
  await assert('17. Unauthenticated /admin/users → 401', unauthAdminUsers.status === 401);
  const unauthAdminDepartments = await api('GET', '/api/admin/departments');
  await assert('17a. Unauthenticated users cannot read the Admin department registry', unauthAdminDepartments.status === 401);
  const operationalDepartments = await api('GET', '/api/departments', undefined, officerCookie);
  const operationalDepartmentRecords = (operationalDepartments.data as Record<string, unknown>)?.departments as Array<Record<string, unknown>>;
  await assert('17b. Operations staff can retrieve active registry departments',
    operationalDepartments.status === 200
      && operationalDepartmentRecords?.some(department => department.id === roadsDepartmentId)
      && operationalDepartmentRecords?.every(department => department.status === 'active'));
  const citizenOperationalDepartments = await api('GET', '/api/departments', undefined, citizenCookie);
  await assert('17c. Citizens cannot read the operations department directory', citizenOperationalDepartments.status === 403);

  // Admin provisions an officer
  const provisionOfficer = await api('POST', '/api/admin/users', {
    email: `testoff_${Date.now()}@bbmp.gov.in`,
    name: 'Test Officer Provisioned',
    role: 'officer',
    departmentId: roadsDepartmentId,
    zone: 'South Zone',
    temporaryPassword: 'TempOfficer@123!',
  }, adminCookie);
  await assert('18. Admin provisions officer → 201 status=pending', provisionOfficer.status === 201 &&
    ((provisionOfficer.data as Record<string, unknown>)?.user as Record<string, unknown>)?.status === 'pending');

  const newOfficerId = ((provisionOfficer.data as Record<string, unknown>)?.user as Record<string, unknown>)?.id as string;

  // Approve the officer
  const approveOfficer = await api('PATCH', `/api/admin/users/${newOfficerId}/approve`, {}, adminCookie);
  await assert('19. Admin approves officer → status=active',
    approveOfficer.status === 200 &&
    ((approveOfficer.data as Record<string, unknown>)?.user as Record<string, unknown>)?.status === 'active');

  const secondRoadsOfficerProvision = await api('POST', '/api/admin/users', {
    email: `secondroads_${Date.now()}@bbmp.gov.in`,
    name: 'Second Roads Department Officer',
    role: 'officer',
    departmentId: roadsDepartmentId,
    temporaryPassword: 'SecondRoads@123!',
  }, adminCookie);
  const secondRoadsOfficer = (secondRoadsOfficerProvision.data as Record<string, unknown>)?.user as Record<string, unknown>;
  const secondRoadsOfficerId = String(secondRoadsOfficer?.id ?? '');
  const secondRoadsOfficerApprove = await api('PATCH', `/api/admin/users/${secondRoadsOfficerId}/approve`, {}, adminCookie);
  await assert('19a. Multiple active officers can share one department',
    secondRoadsOfficerProvision.status === 201 && secondRoadsOfficerApprove.status === 200);

  const waterDepartmentCreate = await api('POST', '/api/admin/departments', {
    name: 'Water Supply Test Registry',
  }, adminCookie);
  const waterDepartment = (waterDepartmentCreate.data as Record<string, unknown>)?.department as Record<string, unknown>;
  const waterDepartmentId = String(waterDepartment?.id ?? '');
  const emptyDepartmentCreate = await api('POST', '/api/admin/departments', {
    name: 'Parks Department (Test Registry)',
  }, adminCookie);
  const emptyDepartment = (emptyDepartmentCreate.data as Record<string, unknown>)?.department as Record<string, unknown>;
  const emptyDepartmentId = String(emptyDepartment?.id ?? '');
  const inactiveDepartmentCreate = await api('POST', '/api/admin/departments', {
    name: 'Inactive Test Department',
  }, adminCookie);
  const inactiveDepartment = (inactiveDepartmentCreate.data as Record<string, unknown>)?.department as Record<string, unknown>;
  const inactiveDepartmentId = String(inactiveDepartment?.id ?? '');
  const deactivateTestDepartment = await api('PATCH', `/api/admin/departments/${inactiveDepartmentId}/status`, {
    status: 'inactive',
  }, adminCookie);
  const operationalDepartmentsAfterDeactivation = await api('GET', '/api/departments', undefined, officerCookie);
  const activeOperationalDepartments = (operationalDepartmentsAfterDeactivation.data as Record<string, unknown>)?.departments as Array<Record<string, unknown>>;
  await assert('19aa. Administrator can create departments including one with no officers',
    waterDepartmentCreate.status === 201 && emptyDepartmentCreate.status === 201
      && Boolean(waterDepartmentId) && Boolean(emptyDepartmentId));
  await assert('19aa1. Department registry supports explicit deactivation',
    inactiveDepartmentCreate.status === 201 && deactivateTestDepartment.status === 200
      && !activeOperationalDepartments?.some(department => department.id === inactiveDepartmentId));
  const duplicateDepartmentCreate = await api('POST', '/api/admin/departments', {
    name: 'water supply (bwssb)',
  }, adminCookie);
  await assert('19ab. Duplicate department names are rejected case-insensitively', duplicateDepartmentCreate.status === 409);

  const waterOfficerProvision = await api('POST', '/api/admin/users', {
    email: `wateroff_${Date.now()}@bbmp.gov.in`,
    name: 'Water Department Officer',
    role: 'officer',
    departmentId: waterDepartmentId,
    zone: 'South Zone',
    temporaryPassword: 'WaterOfficer@123!',
  }, adminCookie);
  const waterOfficer = (waterOfficerProvision.data as Record<string, unknown>)?.user as Record<string, unknown>;
  const waterOfficerId = String(waterOfficer?.id ?? '');
  const waterOfficerApprove = await api('PATCH', `/api/admin/users/${waterOfficerId}/approve`, {}, adminCookie);
  await assert('19b. Admin provisions and activates officer in a second configured department',
    waterOfficerProvision.status === 201 && waterOfficerApprove.status === 200 && Boolean(waterOfficerId));
  const adminDirectory = await api('GET', '/api/admin/users', undefined, adminCookie);
  const directoryUsers = (adminDirectory.data as Record<string, unknown>)?.users as Array<Record<string, unknown>>;
  const activeDepartments = new Set(directoryUsers
    ?.filter(account => account.role === 'officer' && account.status === 'active')
    .map(account => account.department)
    .filter((department): department is string => typeof department === 'string' && department.length > 0));
  await assert('19c. Authorized officer directory exposes all configured active officer departments',
    adminDirectory.status === 200 && activeDepartments.has('Roads & Infra (BBMP)')
      && activeDepartments.has('Water Supply Test Registry'));
  const departmentIds = new Set(directoryUsers
    ?.filter(account => account.role === 'officer' && account.status === 'active')
    .map(account => account.departmentId));
  await assert('19d. Multiple active officer records and the empty configured department are represented separately',
    departmentIds.has(roadsDepartmentId) && departmentIds.has(waterDepartmentId)
      && emptyDepartment?.status === 'active' && !departmentIds.has(emptyDepartmentId));

  const membershipUpdate = await api('PATCH', `/api/admin/users/${((officerLogin.data as Record<string, unknown>)?.user as Record<string, unknown>)?.id}/department`, {
    departmentId: roadsDepartmentId,
  }, adminCookie);
  await assert('19e. Administrator can assign an existing officer to a registry department without replacing the account',
    membershipUpdate.status === 200
      && ((membershipUpdate.data as Record<string, unknown>)?.user as Record<string, unknown>)?.departmentId === roadsDepartmentId
      && ((membershipUpdate.data as Record<string, unknown>)?.user as Record<string, unknown>)?.id === ((officerLogin.data as Record<string, unknown>)?.user as Record<string, unknown>)?.id);

  // Officer cannot access admin users
  const officerAdminUsers = await api('GET', '/api/admin/users', undefined, officerCookie);
  await assert('20. Officer /admin/users → 403', officerAdminUsers.status === 403);

  // Citizen cannot access admin users (already tested but double-checking with citizen cookie)
  await assert('21. Citizen /admin/users → 403', citizenAdminUsers.status === 403);

  // ── Group 6: Logout ───────────────────────────────────────────────────────
  console.log('\nGroup 6: Logout & session invalidation');

  const citizenLoginForLogout = await api('POST', '/api/auth/login', {
    email: 'citizen@test.nagarsetu', password: 'CitizenTest@123!', portal: 'citizen'
  });
  const logoutCookie = extractCookie(citizenLoginForLogout.setCookie);

  const logoutRes = await api('POST', '/api/auth/logout', {}, logoutCookie);
  await assert('22. Logout → 200', logoutRes.status === 200);

  const afterLogout = await api('GET', '/api/auth/me', undefined, logoutCookie);
  await assert('22. After logout, /auth/me → 401', afterLogout.status === 401);

  // ── Group 7: Suspended account ────────────────────────────────────────────
  console.log('\nGroup 7: Suspended account');

  // Suspend the newly provisioned officer
  const suspendRes = await api('PATCH', `/api/admin/users/${newOfficerId}/status`,
    { status: 'suspended' }, adminCookie);
  await assert('23. Admin suspends account → 200', suspendRes.status === 200);

  // Try to login as suspended officer
  const suspendedLogin = await api('POST', '/api/auth/login', {
    email: provisionOfficer.status === 201
      ? ((provisionOfficer.data as Record<string, unknown>)?.user as Record<string, unknown>)?.email
      : 'notfound@test',
    password: 'TempOfficer@123!',
    portal: 'officer'
  });
  await assert('23. Suspended account login → 403', suspendedLogin.status === 403);

  // ── Group 8: Admin self-protection ───────────────────────────────────────
  console.log('\nGroup 8: Admin self-protection');

  const adminId = ((adminLogin.data as Record<string, unknown>)?.user as Record<string, unknown>)?.id as string;
  const selfDisable = await api('PATCH', `/api/admin/users/${adminId}/status`,
    { status: 'disabled' }, adminCookie);
  await assert('25. Admin cannot disable own account → 400', selfDisable.status === 400);

  // Officer cannot provision users
  const officerProvision = await api('POST', '/api/admin/users', {
    email: 'hack@test.com', name: 'Hacker', role: 'admin',
    temporaryPassword: 'HackAdmin@123!'
  }, officerCookie);
  await assert('24. Officer cannot provision users → 403', officerProvision.status === 403);

  // ── Group 9: Profile Self-Update & Role Integrity ───────────────────────
  console.log('\nGroup 9: Profile Self-Update & Role Integrity');

  // Unauthenticated profile update fails
  const unauthProfile = await api('PATCH', '/api/auth/profile', { name: 'Anonymous' });
  await assert('26. Unauthenticated PATCH /api/auth/profile → 401', unauthProfile.status === 401);

  // Authenticated user updates their own profile
  const profileUpdateRes = await api('PATCH', '/api/auth/profile', {
    name: 'Priya Sundaram (Updated)',
    department: 'Civil Citizen Body'
  }, citizenCookie);
  await assert('27. Citizen updates own profile → 200', profileUpdateRes.status === 200);

  // Verify that the update persisted and role was NOT changed
  const citizenMe = await api('GET', '/api/auth/me', undefined, citizenCookie);
  const citizenMeUser = (citizenMe.data as Record<string, unknown>)?.user as Record<string, unknown>;
  await assert('28. Profile update persisted in session', citizenMeUser?.name === 'Priya Sundaram (Updated)');
  await assert('29. Profile update kept citizen role intact', citizenMeUser?.role === 'citizen');

  // Attempt to elevate privileges via profile update (should be rejected/ignored)
  const privilegeElevation = await api('PATCH', '/api/auth/profile', {
    role: 'admin',
    name: 'Hacked Admin'
  }, citizenCookie);
  const citizenMeAfterPriv = await api('GET', '/api/auth/me', undefined, citizenCookie);
  const userAfterPriv = (citizenMeAfterPriv.data as Record<string, unknown>)?.user as Record<string, unknown>;
  await assert('30. Profile update cannot change role to admin', userAfterPriv?.role === 'citizen');

  // Officer profile update
  const officerProfileUpdate = await api('PATCH', '/api/auth/profile', {
    name: 'Er. Rajesh V. (Executive)',
    zone: 'East Zone - Sector 4'
  }, officerCookie);
  await assert('31. Officer updates profile fields → 200', officerProfileUpdate.status === 200);
  const officerMe = await api('GET', '/api/auth/me', undefined, officerCookie);
  const officerMeUser = (officerMe.data as Record<string, unknown>)?.user as Record<string, unknown>;
  await assert('32. Officer department membership and zone persist',
    officerMeUser?.department === 'Roads & Infra (BBMP)'
      && officerMeUser?.departmentId === roadsDepartmentId
      && officerMeUser?.zone === 'East Zone - Sector 4');
  await assert('33. Officer role remains officer', officerMeUser?.role === 'officer');
  const officerSelfDepartmentChange = await api('PATCH', '/api/auth/profile', {
    department: 'Water Supply (BWSSB)',
  }, officerCookie);
  await assert('33a. Officers cannot change their own department membership', officerSelfDepartmentChange.status === 403);

  console.log('\nGroup 10: Complaint API, ownership & durable storage');
  const unauthComplaints = await api('GET', '/api/complaints');
  await assert('35. Unauthenticated complaint list → 401', unauthComplaints.status === 401);
  const createdComplaintResponse = await api('POST', '/api/complaints', {
    category: 'Roads & Potholes',
    title: 'API persistence test complaint',
    description: 'Verify complaint creation and durable storage.',
    location: 'Test street, Bengaluru',
    locationSource: 'manual',
    photos: [],
  }, citizenCookie);
  const createdComplaint = (createdComplaintResponse.data as Record<string, unknown>)?.complaint as Record<string, unknown>;
  const complaintId = String(createdComplaint?.id ?? '');
  await assert('36. Citizen creates complaint through API → 201', createdComplaintResponse.status === 201 && Boolean(complaintId));
  const citizenComplaints = await api('GET', '/api/complaints', undefined, citizenCookie);
  await assert('37. Citizen list includes its newly filed complaint',
    citizenComplaints.status === 200 && ((citizenComplaints.data as Record<string, unknown>)?.complaints as Array<Record<string, unknown>>)
      ?.some(complaint => complaint.id === complaintId));
  const adminComplaints = await api('GET', '/api/complaints', undefined, adminCookie);
  await assert('38. Admin can view the complaint', adminComplaints.status === 200 &&
    ((adminComplaints.data as Record<string, unknown>)?.complaints as Array<Record<string, unknown>>)
      ?.some(complaint => complaint.id === complaintId));
  const citizenAssignmentAttempt = await api('PATCH', `/api/admin/complaints/${complaintId}/assignment`, {
    officerId: waterOfficerId,
    departmentId: waterDepartmentId,
  }, citizenCookie);
  const officerAssignmentAttempt = await api('PATCH', `/api/admin/complaints/${complaintId}/assignment`, {
    officerId: waterOfficerId,
    departmentId: waterDepartmentId,
  }, officerCookie);
  const unauthAssignmentAttempt = await api('PATCH', `/api/admin/complaints/${complaintId}/assignment`, {
    officerId: waterOfficerId,
    departmentId: waterDepartmentId,
  });
  await assert('38a. Only an authenticated administrator can assign complaints',
    citizenAssignmentAttempt.status === 403 && officerAssignmentAttempt.status === 403
      && unauthAssignmentAttempt.status === 401);
  const mismatchedAssignment = await api('PATCH', `/api/admin/complaints/${complaintId}/assignment`, {
    officerId: waterOfficerId,
    departmentId: roadsDepartmentId,
  }, adminCookie);
  const inactiveDepartmentAssignment = await api('PATCH', `/api/admin/complaints/${complaintId}/assignment`, {
    officerId: waterOfficerId,
    departmentId: inactiveDepartmentId,
  }, adminCookie);
  const missingDepartmentAssignment = await api('PATCH', `/api/admin/complaints/${complaintId}/assignment`, {
    officerId: waterOfficerId,
  }, adminCookie);
  const unchangedAfterMismatch = await api('GET', `/api/complaints/${complaintId}`, undefined, adminCookie);
  const unchangedComplaint = (unchangedAfterMismatch.data as Record<string, unknown>)?.complaint as Record<string, unknown>;
  await assert('38b. Server rejects an officer from a different selected department without changing the complaint',
    mismatchedAssignment.status === 400 && unchangedAfterMismatch.status === 200
      && unchangedComplaint.status === 'Submitted' && !unchangedComplaint.assignedOfficer);
  await assert('38c. Server rejects inactive or missing department assignments',
    inactiveDepartmentAssignment.status === 400 && missingDepartmentAssignment.status === 400);
  const assignedComplaint = await api('PATCH', `/api/admin/complaints/${complaintId}/assignment`, {
    officerId: ((officerLogin.data as Record<string, unknown>)?.user as Record<string, unknown>)?.id,
    departmentId: roadsDepartmentId,
  }, adminCookie);
  const assignedComplaintData = (assignedComplaint.data as Record<string, unknown>)?.complaint as Record<string, unknown>;
  await assert('44. Admin assigns complaint to an active officer',
    assignedComplaint.status === 200 &&
    assignedComplaintData?.status === 'Assigned'
    && assignedComplaintData?.department === 'Roads & Infra (BBMP)'
    && assignedComplaintData?.departmentId === roadsDepartmentId
    && assignedComplaintData?.assignedOfficer === officerMeUser?.name);
  const officerCanTrackAssigned = await api('GET', `/api/complaints/${complaintId}`, undefined, officerCookie);
  await assert('45. Assigned officer can track the complaint',
    officerCanTrackAssigned.status === 200);
  const officerStatusUpdate = await api('PATCH', `/api/complaints/${complaintId}/status`, {
    status: 'In Progress',
    note: 'Field inspection started.',
  }, officerCookie);
  const updatedComplaint = (officerStatusUpdate.data as Record<string, unknown>)?.complaint as Record<string, unknown>;
  await assert('46. Assigned officer status update and history persist',
    officerStatusUpdate.status === 200 &&
    updatedComplaint.status === 'In Progress' &&
    Array.isArray(updatedComplaint.statusHistory) &&
    (updatedComplaint.statusHistory as Array<Record<string, unknown>>)
      .some(entry => entry.status === 'In Progress' && entry.note === 'Field inspection started.'));
  const citizenTrackingAfterUpdate = await api('GET', `/api/complaints/${complaintId}`, undefined, citizenCookie);
  const citizenTrackedComplaint = (citizenTrackingAfterUpdate.data as Record<string, unknown>)?.complaint as Record<string, unknown>;
  await assert('46b. Citizen-owned complaint tracking reflects saved assignment and officer status update',
    citizenTrackingAfterUpdate.status === 200
      && citizenTrackedComplaint.department === 'Roads & Infra (BBMP)'
      && citizenTrackedComplaint.assignedOfficer === officerMeUser?.name
      && citizenTrackedComplaint.status === 'In Progress'
      && Array.isArray(citizenTrackedComplaint.statusHistory));
  const citizenIllegalStatusChange = await api('PATCH', `/api/complaints/${complaintId}/status`, {
    status: 'In Progress',
  }, citizenCookie);
  await assert('39. Citizen cannot assign work status to self-submitted complaint → 403',
    citizenIllegalStatusChange.status === 403);
  const routedComplaints = await api('PATCH', '/api/complaints/bulk-routing', {
    departmentId: roadsDepartmentId,
  }, adminCookie);
  const invalidBulkRouting = await api('PATCH', '/api/complaints/bulk-routing', {
    departmentId: inactiveDepartmentId,
  }, adminCookie);
  await assert('43. Admin bulk routing persists eligible complaint updates',
    routedComplaints.status === 200 &&
    (routedComplaints.data as Record<string, unknown>)?.count === 1 &&
    ((routedComplaints.data as Record<string, unknown>)?.complaints as Array<Record<string, unknown>>)
      ?.some(complaint => complaint.id === complaintId
        && complaint.departmentId === roadsDepartmentId && complaint.department === 'Roads & Infra (BBMP)'));
  await assert('43a. Bulk routing rejects inactive departments', invalidBulkRouting.status === 400);

  const secondDepartmentComplaintResponse = await api('POST', '/api/complaints', {
    category: 'Water Supply',
    title: 'Second department assignment test',
    description: 'Verify an officer in a separate configured department can be selected and assigned.',
    location: 'Test street, Bengaluru',
    locationSource: 'manual',
    photos: [],
  }, citizenCookie);
  const secondDepartmentComplaint = (secondDepartmentComplaintResponse.data as Record<string, unknown>)?.complaint as Record<string, unknown>;
  const secondDepartmentComplaintId = String(secondDepartmentComplaint?.id ?? '');
  const secondDepartmentAssignment = await api('PATCH', `/api/admin/complaints/${secondDepartmentComplaintId}/assignment`, {
    officerId: waterOfficerId,
    departmentId: waterDepartmentId,
  }, adminCookie);
  const secondDepartmentAssignedRecord = (secondDepartmentAssignment.data as Record<string, unknown>)?.complaint as Record<string, unknown>;
  await assert('43b. Correct department and active officer assignment is saved',
    secondDepartmentComplaintResponse.status === 201 && secondDepartmentAssignment.status === 200
      && secondDepartmentAssignedRecord.department === 'Water Supply Test Registry'
      && secondDepartmentAssignedRecord.assignedOfficer === waterOfficer.name);

  const unassignedComplaintResponse = await api('POST', '/api/complaints', {
    category: 'Roads & Potholes',
    title: 'Unassigned visibility test complaint',
    description: 'Verify officer access excludes unrelated unassigned complaints.',
    location: 'Unassigned test street, Bengaluru',
    locationSource: 'manual',
    photos: [],
  }, citizenCookie);
  const unassignedComplaint = (unassignedComplaintResponse.data as Record<string, unknown>)?.complaint as Record<string, unknown>;
  const unassignedComplaintId = String(unassignedComplaint?.id ?? '');
  const officerComplaintList = await api('GET', '/api/complaints', undefined, officerCookie);
  const officerVisibleComplaints = (officerComplaintList.data as Record<string, unknown>)?.complaints as Array<Record<string, unknown>>;
  await assert('42. Officer can view assigned complaints but not unassigned complaints',
    unassignedComplaintResponse.status === 201 &&
    officerComplaintList.status === 200 &&
    officerVisibleComplaints.some(complaint => complaint.id === complaintId) &&
    !officerVisibleComplaints.some(complaint => complaint.id === unassignedComplaintId));

  // User and complaint records survive API restarts, while sessions remain process-local.
  await stopServer();
  await startServer();
  const persistedCitizenLogin = await api('POST', '/api/auth/login', {
    email: newEmail, password: 'NewCitizen@123', portal: 'citizen'
  });
  await assert('34. Registered citizen can log in after API restart', persistedCitizenLogin.status === 200);
  await assert('34. Persisted citizen keeps the citizen role',
    ((persistedCitizenLogin.data as Record<string, unknown>)?.user as Record<string, unknown>)?.role === 'citizen');
  const persistedCitizenMe = await api(
    'GET',
    '/api/auth/me',
    undefined,
    extractCookie(persistedCitizenLogin.setCookie)
  );
  await assert('34. Login after restart creates a valid session', persistedCitizenMe.status === 200);
  const otherCitizenComplaints = await api(
    'GET',
    '/api/complaints',
    undefined,
    extractCookie(persistedCitizenLogin.setCookie)
  );
  await assert('41. Citizen cannot see another account’s complaint',
    otherCitizenComplaints.status === 200 &&
    ((otherCitizenComplaints.data as Record<string, unknown>)?.complaints as unknown[])?.length === 0);
  const adminLoginAfterRestart = await api('POST', '/api/auth/login', {
    email: 'admin@test.nagarsetu', password: 'AdminTest@123!', portal: 'admin'
  });
  const adminCookieAfterRestart = extractCookie(adminLoginAfterRestart.setCookie);
  const adminDepartmentsAfterRestart = await api('GET', '/api/admin/departments', undefined, adminCookieAfterRestart);
  const departmentsAfterRestart = (adminDepartmentsAfterRestart.data as Record<string, unknown>)?.departments as Array<Record<string, unknown>>;
  const adminUsersAfterRestart = await api('GET', '/api/admin/users', undefined, adminCookieAfterRestart);
  const usersAfterRestart = (adminUsersAfterRestart.data as Record<string, unknown>)?.users as Array<Record<string, unknown>>;
  const officerAfterRestart = usersAfterRestart?.find(account => account.id === ((officerLogin.data as Record<string, unknown>)?.user as Record<string, unknown>)?.id);
  await assert('34a. Development departments and officer membership persist across API restart without duplicate seeds',
    adminDepartmentsAfterRestart.status === 200
      && seededDevelopmentNames.every(name => departmentsAfterRestart?.filter(department => department.name === name).length === 1)
      && officerAfterRestart?.departmentId === roadsDepartmentId);
  const complaintsAfterRestart = await api('GET', '/api/complaints', undefined, adminCookieAfterRestart);
  await assert('40. Complaint record survives API restart',
    complaintsAfterRestart.status === 200 &&
    ((complaintsAfterRestart.data as Record<string, unknown>)?.complaints as Array<Record<string, unknown>>)
      ?.some(complaint => complaint.id === complaintId
        && complaint.status === 'In Progress'
        && complaint.assignedOfficer === officerMeUser?.name
        && Array.isArray(complaint.statusHistory)
        && (complaint.statusHistory as Array<Record<string, unknown>>)
          .some(entry => entry.status === 'In Progress' && entry.note === 'Field inspection started.')));
  const secondDepartmentAfterRestart = (complaintsAfterRestart.data as Record<string, unknown>)?.complaints as Array<Record<string, unknown>>;
  await assert('40b. Department and officer assignment survive API restart',
    secondDepartmentAfterRestart?.some(complaint => complaint.id === secondDepartmentComplaintId
      && complaint.department === 'Water Supply Test Registry'
      && complaint.assignedOfficer === waterOfficer.name
      && complaint.status === 'Assigned'));

  // ── Results ───────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log(`Results: ${passCount} passed, ${failCount} failed`);

  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(f => console.log(f));
  }

  console.log('');
}

// ── Entry Point ───────────────────────────────────────────────────────────────

(async () => {
  console.log('[test] Starting test server on port', TEMP_PORT);
  try {
    testStoreDirectory = await mkdtemp(join(tmpdir(), 'nagarsetu-auth-'));
    await startServer();
    console.log('[test] Server ready');
  } catch (e: unknown) {
    console.error('[test] Failed to start server:', (e as Error).message);
    if (testStoreDirectory) await rm(testStoreDirectory, { recursive: true, force: true });
    process.exit(1);
  }

  try {
    await runTests();
  } finally {
    console.log('[test] Stopping test server...');
    await stopServer();
    await rm(testStoreDirectory, { recursive: true, force: true });
    process.exit(failCount > 0 ? 1 : 0);
  }
})();
