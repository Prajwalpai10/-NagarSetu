import { AppPersona, AppView } from './types';

export const VIEW_TO_PATH: Record<AppView, string> = {
  public_landing: '/',
  citizen_home: '/citizen',
  report_issue: '/citizen/report',
  track_complaint: '/citizen/track',
  my_complaints: '/citizen/complaints',
  nearby_issues: '/citizen/nearby',
  emergency: '/citizen/emergency',
  notifications: '/citizen/notifications',
  citizen_profile: '/citizen/profile',
  transparency_gallery: '/citizen/transparency',

  officer_dashboard: '/ops',
  complaint_queue: '/ops/queue',
  incident_dossier: '/ops/incident',
  department_routing: '/ops/routing',
  staff_profile: '/staff/profile',

  command_center: '/admin',
  city_map: '/admin/map',
  hotspots: '/admin/hotspots',
  escalations: '/admin/escalations',
  department_performance: '/admin/performance',
  analytics: '/admin/analytics',
  user_management: '/admin/users',
  admin_settings: '/admin/settings',
  admin_complaints: '/admin/complaints',
  admin_assignments: '/admin/assignments',
  admin_resources: '/admin/resources',
  admin_profile: '/admin/profile',
  not_found: '/not-found',
};

export const getViewFromPathname = (pathname: string): { view: AppView; persona: AppPersona; ticketId?: string } => {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  if (clean === '/ops/map') {
    return { view: 'city_map', persona: 'ops' };
  }

  const adminComplaintMatch = clean.match(/^\/admin\/complaints\/([a-z0-9-]+)$/);
  if (adminComplaintMatch) {
    return { view: 'admin_complaints', persona: 'admin', ticketId: adminComplaintMatch[1].toUpperCase() };
  }
  const adminAssignmentMatch = clean.match(/^\/admin\/assignments\/([a-z0-9-]+)$/);
  if (adminAssignmentMatch) {
    return { view: 'admin_assignments', persona: 'admin', ticketId: adminAssignmentMatch[1].toUpperCase() };
  }

  // Check ticket IDs in path: e.g. /citizen/track/CMP-2026-01482 or /ops/incident/CMP-2026-01482
  const citizenTrackMatch = clean.match(/^\/citizen\/(?:track|complaints)\/([a-z0-9-]+)$/);
  if (citizenTrackMatch) {
    return { view: 'track_complaint', persona: 'citizen', ticketId: citizenTrackMatch[1].toUpperCase() };
  }

  const opsIncidentMatch = clean.match(/^\/ops\/incident\/([a-z0-9-]+)$/);
  if (opsIncidentMatch) {
    return { view: 'incident_dossier', persona: 'ops', ticketId: opsIncidentMatch[1].toUpperCase() };
  }

  // Exact matching
  for (const [view, path] of Object.entries(VIEW_TO_PATH)) {
    if (clean === path.toLowerCase()) {
      let persona: AppPersona = 'citizen';
      if (path.startsWith('/ops') || path.startsWith('/staff')) persona = 'ops';
      else if (path.startsWith('/admin')) persona = 'admin';
      return { view: view as AppView, persona };
    }
  }

  // Prefix matching
  if (clean.startsWith('/admin')) {
    return { view: 'not_found', persona: 'admin' };
  }
  if (clean.startsWith('/ops')) {
    return { view: 'not_found', persona: 'ops' };
  }
  if (clean.startsWith('/citizen')) {
    return { view: 'not_found', persona: 'citizen' };
  }

  return { view: 'not_found', persona: 'citizen' };
};
