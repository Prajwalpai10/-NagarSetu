// NagarSetu Backend – Shared Types

export type UserRole = 'citizen' | 'officer' | 'admin';
export type AccountStatus = 'active' | 'pending' | 'suspended' | 'disabled';

export interface StoredUser {
  id: string;
  email: string;            // lowercase-normalised
  passwordHash: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
  department?: string;
  departmentId?: string;
  zone?: string;
  assignedWards?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actorId?: string;
  actorEmail?: string;
  targetId?: string;
  targetEmail?: string;
  details?: string;
  ipAddress?: string;
}

// What is returned to the client – never includes passwordHash
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
  department?: string;
  departmentId?: string;
  zone?: string;
  assignedWards?: string[];
  createdAt: string;
}
