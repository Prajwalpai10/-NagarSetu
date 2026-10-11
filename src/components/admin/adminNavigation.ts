import { AppView } from '../../types';

export interface AdminNavigationItem {
  label: string;
  view: AppView;
  icon: string;
}

export const ADMIN_PRIMARY_NAVIGATION: AdminNavigationItem[] = [
  { label: 'Overview', view: 'command_center', icon: 'dashboard' },
  { label: 'Complaint Management', view: 'admin_complaints', icon: 'inbox' },
  { label: 'Departments & Officers', view: 'user_management', icon: 'groups' },
  { label: 'Assignment Tracking', view: 'admin_assignments', icon: 'alt_route' },
  { label: 'Reports & Analytics', view: 'analytics', icon: 'analytics' },
  { label: 'Administration', view: 'admin_settings', icon: 'tune' },
];

export const ADMIN_SECONDARY_NAVIGATION: AdminNavigationItem[] = [
  { label: 'Operations Map', view: 'city_map', icon: 'map' },
  { label: 'Department Performance', view: 'department_performance', icon: 'analytics' },
  { label: 'Hotspots', view: 'hotspots', icon: 'scatter_plot' },
  { label: 'My Profile', view: 'admin_profile', icon: 'person' },
];
