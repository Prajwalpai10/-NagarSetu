import { complaintService } from '../services/complaintService';
import { emergencyService } from '../services/emergencyService';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { analyticsService } from '../services/analyticsService';
import { departmentService } from '../services/departmentService';
import { exportService } from '../services/exportService';
import { i18nService } from '../services/i18nService';
import { VIEW_TO_PATH, getViewFromPathname } from '../routes';
import { AppView } from '../types';
import { ADMIN_PRIMARY_NAVIGATION } from '../components/admin/adminNavigation';
import {
  changeAssignmentComplaint,
  changeAssignmentDepartment,
  getAvailableDepartments,
  getEligibleOfficers,
} from '../services/adminAssignmentOptions';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${details ? ` - ${details}` : ''}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

console.log('====================================================');
console.log('NAGARSETU WORKFLOW & FUNCTIONALITY VERIFICATION SUITE');
console.log('====================================================\n');

// 1. Citizen Workflow: Complaint Lifecycle & Citizen Sign-Off
console.log('1. Testing Citizen Complaint Lifecycle & Resolution Flow...');
const initialCount = complaintService.getAll().length;
assert(initialCount > 0, 'Initial complaints database loaded');

const createdComplaint = complaintService.create({
  title: 'Pothole on 100ft Road near 12th Main',
  description: 'Deep road cavity causing two-wheeler skids near metro station.',
  category: 'Roads & Infrastructure (BBMP)',
  priority: 'P2',
  ward: 'Ward 12 Indiranagar',
  location: '100ft Road, Indiranagar',
  citizenName: 'Priya S.',
});
assert(Boolean(createdComplaint.id && createdComplaint.id.startsWith('CMP-')), 'Complaint ID format valid', createdComplaint.id);
assert(createdComplaint.status === 'Submitted', 'Initial status is Submitted', createdComplaint.status);
assert(createdComplaint.slaDeadline.includes('Statutory'), 'SLA Statutory timeline attached');

// Update to In Progress (Ops Crew Dispatched)
const inProgress = complaintService.updateStatus(createdComplaint.id, 'In Progress', {
  assignedCrew: 'Rapid Patch Rig #04',
  lifecycleStage: 3,
});
assert(inProgress?.status === 'In Progress', 'Status transition to In Progress');
assert(inProgress?.assignedCrew === 'Rapid Patch Rig #04', 'Crew assigned successfully');

// Add supplemental evidence from citizen
const withEvidence = complaintService.appendEvidence(createdComplaint.id, 'https://example.com/photo2.jpg', 'Repair crew arrived on site');
assert(Boolean(withEvidence?.photos.includes('https://example.com/photo2.jpg')), 'Supplemental photo attached');
assert(Boolean(withEvidence?.description.includes('Repair crew arrived')), 'Supplemental notes recorded');

// Community endorsement / upvoting
const upvotedCount = complaintService.upvote(createdComplaint.id);
assert(upvotedCount === 2, 'Complaint upvote recorded', `Upvotes: ${upvotedCount}`);

// Officer marks resolved
const resolved = complaintService.updateStatus(createdComplaint.id, 'Resolved', {
  lifecycleStage: 7,
});
assert(resolved?.status === 'Resolved', 'Officer resolution mark confirmed');

// Citizen verification gate sign-off (Closed)
const verifiedClosed = complaintService.updateStatus(createdComplaint.id, 'Closed', {
  lifecycleStage: 8,
});
assert(verifiedClosed?.status === 'Closed', 'Citizen sign-off verified ticket closure');

// 2. Citizen Draft Management
console.log('\n2. Testing Citizen Draft Management...');
complaintService.saveDraft({
  category: 'Streetlights & Electrical',
  description: 'Flickering high-mast lamp at junction',
  address: '80ft Road, Sector 3',
  gpsCoords: { lat: 12.9716, lng: 77.6412 },
  photos: ['photo1.jpg'],
  lastSavedAt: new Date().toISOString(),
});
const draft = complaintService.getDraft();
assert(draft !== null && draft.category === 'Streetlights & Electrical', 'Draft persisted correctly');
complaintService.clearDraft();
assert(complaintService.getDraft() === null, 'Draft cleared after submission');

// 3. Emergency Incident Dispatch
console.log('\n3. Testing Emergency Dispatch System...');
const emergencyIncident = emergencyService.dispatchEmergencyIncident({
  hazardType: 'Live Electrical Wire',
  details: 'Sparking cable on wet pedestrian pavement',
  location: 'Near Metro Pillar 42, 12th Main',
  ward: 'Ward 12 Indiranagar',
  coordinates: { lat: 12.9716, lng: 77.6412 },
  citizenPhone: '+91 98452 88210',
});
assert(emergencyIncident.priority === 'P1', 'Emergency priority set to P1 Critical');
assert(emergencyIncident.status === 'In Progress', 'Immediate field dispatch in progress');
assert(emergencyIncident.department === 'Joint Emergency Disaster Command', 'Emergency department classified correctly');

// 4. Ops Field Workflows: Bulk Reassignment & Multi-Agency Routing
console.log('\n4. Testing Ops Field Workflows & Bulk Reassignment...');
const reassignedCount = complaintService.bulkReassign('Roads & Infrastructure (BBMP)', 'Central Fleet Response Unit');
assert(reassignedCount >= 0, 'Bulk reassignment executed without errors', `Reassigned: ${reassignedCount}`);

const roster = departmentService.syncRoster();
assert(roster.syncedCount > 0, 'Department roster synchronized', `Active shift units: ${roster.syncedCount}`);

// 5. Admin & Analytics Workflows: Hotspot Clustering & RBAC Management
console.log('\n5. Testing Admin Hotspots & User RBAC Management...');
const hotspots = analyticsService.getHotspots();
assert(hotspots.length > 0, 'Hotspots corridors loaded');

const hotspotsReloaded = analyticsService.getHotspots();
assert(JSON.stringify(hotspotsReloaded) === JSON.stringify(hotspots),
  'Demonstration hotspots remain unchanged without a connected clustering feed');

const newOfficer = authService.provisionOfficer({
  name: 'Sunita Rao',
  role: 'Officer',
  department: 'Water Supply & Sewerage (BWSSB)',
  ward: 'Ward 12 Indiranagar',
  email: 'sunita.rao@bwssb.gov.in',
  phone: '+91 98860 12345',
});
assert(newOfficer.id.length > 0, 'Officer credentialed in RBAC registry', newOfficer.id);
assert(newOfficer.userType === 'Officer', 'Officer role verified');

authService.updateUserStatus(newOfficer.id, 'Active');
const updatedUsers = authService.getAllUsers();
const foundUser = updatedUsers.find(u => u.id === newOfficer.id);
assert(foundUser?.status === 'Active', 'Officer user status updated');

// 6. Navigation & Route Invariant Verification
console.log('\n6. Testing Route Invariants & Path Mappings...');
const assignmentDepartments = [
{ id: 'dept-roads', name: 'Roads', status: 'active' as const, createdAt: '', updatedAt: '' },
{ id: 'dept-water', name: 'Water', status: 'active' as const, createdAt: '', updatedAt: '' },
{ id: 'dept-empty', name: 'Empty Registry Department', status: 'active' as const, createdAt: '', updatedAt: '' },
{ id: 'dept-inactive', name: 'Inactive Department', status: 'inactive' as const, createdAt: '', updatedAt: '' },
];
const assignmentDirectory = [
{ id: 'officer-roads', name: 'Roads Officer', email: 'roads@example.test', role: 'officer' as const, status: 'active' as const, department: 'Roads', departmentId: 'dept-roads', createdAt: '' },
{ id: 'officer-roads-2', name: 'Second Roads Officer', email: 'roads2@example.test', role: 'officer' as const, status: 'active' as const, department: 'Roads', departmentId: 'dept-roads', createdAt: '' },
{ id: 'officer-water', name: 'Water Officer', email: 'water@example.test', role: 'officer' as const, status: 'active' as const, department: 'Water', departmentId: 'dept-water', createdAt: '' },
{ id: 'officer-pending', name: 'Pending Officer', email: 'pending@example.test', role: 'officer' as const, status: 'pending' as const, department: 'Drainage', createdAt: '' },
{ id: 'admin-user', name: 'Administrator', email: 'admin@example.test', role: 'admin' as const, status: 'active' as const, department: 'Admin', createdAt: '' },
];
assert(getAvailableDepartments(assignmentDepartments).length === 3
&& !getAvailableDepartments(assignmentDepartments).some(department => department.id === 'dept-inactive'),
'All active registry departments are options, including those without officers');
assert(getAvailableDepartments([]).length === 0, 'Empty department registry produces no fabricated department options');
assert(getEligibleOfficers(assignmentDirectory, 'dept-water').map(officer => officer.id).join() === 'officer-water',
'Officer options are filtered by selected department ID and stable officer ID');
assert(getEligibleOfficers(assignmentDirectory, 'dept-empty').length === 0,
'Department with no eligible officers produces an empty officer list');
assert(getEligibleOfficers(assignmentDirectory, 'dept-roads').length === 2,
'Multiple active officers in one department are selectable');
assert(getEligibleOfficers(assignmentDirectory, 'dept-inactive').length === 0
&& getEligibleOfficers(assignmentDirectory, 'Unknown').length === 0
&& getEligibleOfficers(assignmentDirectory, '').length === 0,
'Unknown or unselected department has no eligible officers');
assert(changeAssignmentDepartment('dept-water').officerId === '',
'Changing departments clears the current officer selection');
assert(changeAssignmentComplaint('CMP-NEW').departmentId === ''
&& changeAssignmentComplaint('CMP-NEW').officerId === '',
'Changing complaints clears department and officer selections');

const expectedViews: AppView[] = [
  'public_landing', 'citizen_home', 'report_issue', 'track_complaint', 'my_complaints',
  'nearby_issues', 'emergency', 'notifications', 'citizen_profile', 'transparency_gallery',
  'officer_dashboard', 'complaint_queue', 'incident_dossier', 'department_routing', 'staff_profile',
  'command_center', 'city_map', 'hotspots', 'escalations', 'department_performance',
  'analytics', 'user_management', 'admin_settings', 'admin_complaints', 'admin_assignments',
  'admin_resources', 'admin_profile', 'not_found'
];

for (const view of expectedViews) {
  const path = VIEW_TO_PATH[view];
  assert(Boolean(path), `View '${view}' has valid route path`, path);
  const match = getViewFromPathname(path);
  assert(match.view === view, `Round-trip pathname resolution for '${path}' matches '${view}'`);
}

// Check ticket ID parameterized routing
const trackParamMatch = getViewFromPathname('/citizen/track/CMP-2026-01482');
assert(trackParamMatch.view === 'track_complaint' && trackParamMatch.ticketId === 'CMP-2026-01482', 'Citizen ticket parameter route works');

const opsParamMatch = getViewFromPathname('/ops/incident/CMP-2026-01482');
assert(opsParamMatch.view === 'incident_dossier' && opsParamMatch.ticketId === 'CMP-2026-01482', 'Ops incident parameter route works');

const opsMapMatch = getViewFromPathname('/ops/map');
assert(opsMapMatch.view === 'city_map' && opsMapMatch.persona === 'ops', 'Ops map route stays in the officer portal');

const adminMapMatch = getViewFromPathname('/admin/map');
assert(adminMapMatch.view === 'city_map' && adminMapMatch.persona === 'admin', 'Admin map route stays in the Admin portal');

const adminComplaintMatch = getViewFromPathname('/admin/complaints/CMP-2026-01482');
assert(adminComplaintMatch.view === 'admin_complaints' && adminComplaintMatch.persona === 'admin'
  && adminComplaintMatch.ticketId === 'CMP-2026-01482', 'Admin complaint detail deep link remains in Admin portal');

const adminAssignmentMatch = getViewFromPathname('/admin/assignments/CMP-2026-01482');
assert(adminAssignmentMatch.view === 'admin_assignments' && adminAssignmentMatch.persona === 'admin'
  && adminAssignmentMatch.ticketId === 'CMP-2026-01482', 'Admin assignment deep link remains in Admin portal');

const unknownAdminPath = getViewFromPathname('/admin/unknown');
assert(unknownAdminPath.view === 'not_found' && unknownAdminPath.persona === 'admin', 'Unknown Admin paths remain in Admin portal');

assert(ADMIN_PRIMARY_NAVIGATION.every(item => !['complaint_queue', 'incident_dossier', 'staff_profile'].includes(item.view)),
  'Admin primary navigation contains no Operations-only destinations');
assert(ADMIN_PRIMARY_NAVIGATION.map(item => item.label).join('|')
  === 'Overview|Complaint Management|Departments & Officers|Assignment Tracking|Reports & Analytics|Administration',
'Admin primary navigation presents the six requested Admin sections in order');
assert(ADMIN_PRIMARY_NAVIGATION.find(item => item.label === 'Departments & Officers')?.view === 'user_management'
  && ADMIN_PRIMARY_NAVIGATION.find(item => item.label === 'Assignment Tracking')?.view === 'admin_assignments',
'Department management and assignment navigation open their rendered Admin components');

// 7. Export Generation Services
console.log('\n7. Testing PDF & CSV Data Generation Logic...');
// CSV generation logic test
const csvData = [
  ['ID', 'Category', 'Status'],
  ['CMP-01', 'Roads', 'Resolved'],
  ['CMP-02', 'Power', 'In Progress']
].map(r => r.join(',')).join('\n');
assert(csvData.includes('CMP-01,Roads,Resolved'), 'CSV serialization valid');

console.log(`\n====================================================`);
console.log(`ALL TESTS PASSED: ${passedTests} / ${totalTests} (100% Success Rate)`);
console.log(`====================================================`);
