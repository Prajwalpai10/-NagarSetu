export type AppPersona = 'citizen' | 'ops' | 'admin';

export type AppView =
  // Citizen views
  | 'public_landing'
  | 'citizen_home'
  | 'report_issue'
  | 'track_complaint'
  | 'my_complaints'
  | 'nearby_issues'
  | 'emergency'
  | 'notifications'
  | 'citizen_profile'
  | 'transparency_gallery'
  // Ops Field views
  | 'officer_dashboard'
  | 'complaint_queue'
  | 'incident_dossier'
  | 'department_routing'
  | 'staff_profile'
  // Admin / City Command views
  | 'command_center'
  | 'city_map'
  | 'hotspots'
  | 'escalations'
  | 'department_performance'
  | 'analytics'
  | 'user_management'
  | 'admin_settings'
  | 'admin_complaints'
  | 'admin_assignments'
  | 'admin_resources'
  | 'admin_profile'
  | 'not_found';


export interface Complaint {
  id: string;
  category: string;
  subCategory?: string;
  title: string;
  description: string;
  location: string;
  ward: string;
  zone: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  locationSource?: 'gps' | 'map' | 'manual';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'Submitted' | 'In Progress' | 'Assigned' | 'Resolved' | 'Closed' | 'Escalated';
  reportedDate: string;
  timeAgo: string;
  slaDeadline: string;
  slaRemaining: string;
  slaBreached?: boolean;
  assignedCrew?: string;
  assignedOfficer?: string;
  photos: string[];
  citizenName: string;
  citizenPhone: string;
  verifiedKYC: boolean;
  upvotes: number;
  aiConfidence: number;
  department: string;
  departmentId?: string;
  isDuplicateMerged?: boolean;
  mergedTicketIds?: string[];
  lifecycleStage: number; // 1 to 8
  statusHistory?: Array<{
    status: Complaint['status'];
    changedAt: string;
    actorId?: string;
    note?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  initials: string;
  empId: string;
  role: string;
  roleBadge: string;
  designation: string;
  department: string;
  ward: string;
  zone: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  email: string;
  phone: string;
  joinedDate: string;
  lastActive: string;
  assignedWards: string;
  activeCases: string;
  isOnline: boolean;
  userType: 'Citizen' | 'Officer' | 'Admin';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'complaints' | 'updates' | 'emergency' | 'system';
  priorityBadge?: string;
  ticketId?: string;
  timeAgo: string;
  read: boolean;
  icon: string;
  actionLabel?: string;
  actionView?: AppView;
  actionTicketId?: string;
}

export interface HotspotCorridor {
  rank: string;
  name: string;
  zone: string;
  corridorId: string;
  totalComplaints: number;
  growthPct: string;
  emergencyCount: number;
  dominantIssue: string;
  subIssue: string;
  velocityTrend: 'Rapidly Escalating' | 'Stable High' | 'New Cluster' | 'Decreasing' | 'Escalating';
  leadAgency: string;
  secondaryAgency?: string;
  actionLabel: string;
}
