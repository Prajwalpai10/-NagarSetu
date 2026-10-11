/**
 * NagarSetu – Frontend API Client
 * Wraps all HTTP calls to the Express backend.
 * Uses credentials: 'include' so session cookies are sent automatically.
 */

import type { Complaint } from '../types';

export type UserRole = 'citizen' | 'officer' | 'admin';
export type AccountStatus = 'active' | 'pending' | 'suspended' | 'disabled';

export interface AuthUser {
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

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

const BASE = (import.meta.env?.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      credentials: 'include',  // Always send session cookie
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers ?? {}),
      },
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { error: body.error ?? `Request failed (${res.status})`, status: res.status };
    }
    return { data: body as T };
  } catch {
    return { error: 'Network error. Please check your connection.' };
  }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const apiClient = {
  /** Restore session on app load */
  async getMe(): Promise<ApiResponse<{ user: AuthUser }>> {
    return apiFetch<{ user: AuthUser }>('/auth/me');
  },

  /** Register a new citizen account */
  async register(data: {
    email: string;
    password: string;
    name: string;
    consent: boolean;
  }): Promise<ApiResponse<{ user: AuthUser }>> {
    return apiFetch<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** Log in to a specific portal. The server matches the account role; it does not trust this value as authorization. */
  async login(
    email: string,
    password: string,
    portal: UserRole
  ): Promise<ApiResponse<{ user: AuthUser }>> {
    return apiFetch<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, portal }),
    });
  },

  /** Log out – destroys server session */
  async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>('/auth/logout', { method: 'POST' });
  },

  /** Check if server is reachable */
  async healthCheck(): Promise<boolean> {
    const res = await apiFetch<{ status: string }>('/health');
    return !res.error;
  },

  // ─── Admin ────────────────────────────────────────────────────────────────

  async adminGetUsers(): Promise<ApiResponse<{ users: AuthUser[] }>> {
    return apiFetch<{ users: AuthUser[] }>('/admin/users');
  },

  async adminGetDepartments(): Promise<ApiResponse<{ departments: DepartmentRecord[] }>> {
    return apiFetch<{ departments: DepartmentRecord[] }>('/admin/departments');
  },

  async adminCreateDepartment(name: string): Promise<ApiResponse<{ department: DepartmentRecord }>> {
    return apiFetch<{ department: DepartmentRecord }>('/admin/departments', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async adminUpdateDepartmentStatus(
    id: string,
    status: DepartmentRecord['status']
  ): Promise<ApiResponse<{ department: DepartmentRecord }>> {
    return apiFetch<{ department: DepartmentRecord }>(`/admin/departments/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async adminSetOfficerDepartment(
    id: string,
    departmentId: string
  ): Promise<ApiResponse<{ user: AuthUser }>> {
    return apiFetch<{ user: AuthUser }>(`/admin/users/${encodeURIComponent(id)}/department`, {
      method: 'PATCH',
      body: JSON.stringify({ departmentId }),
    });
  },

  async adminProvisionUser(data: {
    email: string;
    name: string;
    role: 'officer' | 'admin';
    department?: string;
    departmentId?: string;
    zone?: string;
    assignedWards?: string[];
    temporaryPassword: string;
  }): Promise<ApiResponse<{ user: AuthUser }>> {
    return apiFetch<{ user: AuthUser }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async adminUpdateStatus(
    id: string,
    status: AccountStatus
  ): Promise<ApiResponse<{ user: AuthUser }>> {
    return apiFetch<{ user: AuthUser }>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async adminApproveOfficer(id: string): Promise<ApiResponse<{ user: AuthUser }>> {
    return apiFetch<{ user: AuthUser }>(`/admin/users/${id}/approve`, {
      method: 'PATCH',
    });
  },

  async adminUpdateRole(
    id: string,
    role: UserRole,
    extras?: { department?: string; zone?: string; assignedWards?: string[] }
  ): Promise<ApiResponse<{ user: AuthUser }>> {
    return apiFetch<{ user: AuthUser }>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, ...extras }),
    });
  },

  async adminGetAuditLog(): Promise<ApiResponse<{ events: unknown[] }>> {
    return apiFetch<{ events: unknown[] }>('/admin/audit');
  },

  /** Update the authenticated user's own profile fields (name, department, zone). Role cannot be changed. */
  async updateProfile(data: {
    name?: string;
    department?: string;
    zone?: string;
  }): Promise<ApiResponse<{ user: AuthUser }>> {
    return apiFetch<{ user: AuthUser }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async getComplaints(): Promise<ApiResponse<{ complaints: Complaint[] }>> {
    return apiFetch<{ complaints: Complaint[] }>('/complaints');
  },

  async createComplaint(data: Partial<Complaint>): Promise<ApiResponse<{ complaint: Complaint }>> {
    return apiFetch<{ complaint: Complaint }>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateComplaintStatus(
    id: string,
    status: Complaint['status'],
    note?: string
  ): Promise<ApiResponse<{ complaint: Complaint }>> {
    return apiFetch<{ complaint: Complaint }>(`/complaints/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  },

  async upvoteComplaint(id: string): Promise<ApiResponse<{ complaint: Complaint }>> {
    return apiFetch<{ complaint: Complaint }>(`/complaints/${encodeURIComponent(id)}/upvote`, {
      method: 'POST',
    });
  },

  async appendComplaintEvidence(
    id: string,
    data: { photoUrls?: string[]; note?: string }
  ): Promise<ApiResponse<{ complaint: Complaint }>> {
    const photos = data.photoUrls?.map(url => url.split('/').pop() ?? '') ?? [];
    return apiFetch<{ complaint: Complaint }>(`/complaints/${encodeURIComponent(id)}/evidence`, {
      method: 'POST',
      body: JSON.stringify({ photos, note: data.note }),
    });
  },

  async dispatchEmergency(data: {
    category: string;
    title: string;
    description: string;
    location: string;
    coordinates?: Complaint['coordinates'];
    locationSource: NonNullable<Complaint['locationSource']>;
    ward?: string;
    zone?: string;
  }): Promise<ApiResponse<{ complaint: Complaint }>> {
    return apiClient.createComplaint({
      ...data,
      priority: 'P1',
    });
  },

  async adminAssignComplaint(
    id: string,
    officerId: string,
    departmentId: string
  ): Promise<ApiResponse<{ complaint: Complaint }>> {
    return apiFetch<{ complaint: Complaint }>(`/admin/complaints/${encodeURIComponent(id)}/assignment`, {
      method: 'PATCH',
      body: JSON.stringify({ officerId, departmentId }),
    });
  },

  async bulkRouteComplaints(
    department: string
  ): Promise<ApiResponse<{ count: number; complaints: Complaint[] }>> {
    return apiFetch<{ count: number; complaints: Complaint[] }>('/complaints/bulk-routing', {
      method: 'PATCH',
      body: JSON.stringify({ departmentId: department }),
    });
  },

  async getOperationalDepartments(): Promise<ApiResponse<{ departments: DepartmentRecord[] }>> {
    return apiFetch<{ departments: DepartmentRecord[] }>('/departments');
  },

  async searchLocations(query: string): Promise<ApiResponse<{ locations: GeocodedLocation[] }>> {
    return apiFetch<{ locations: GeocodedLocation[] }>(`/geocode/search?q=${encodeURIComponent(query)}`);
  },

  async reverseGeocode(latitude: number, longitude: number): Promise<ApiResponse<{ location: GeocodedLocation }>> {
    const query = new URLSearchParams({ lat: String(latitude), lon: String(longitude) });
    return apiFetch<{ location: GeocodedLocation }>(`/geocode/reverse?${query.toString()}`);
  },

  /** Upload a citizen complaint photo and return its persistent API URL. */
  async uploadComplaintPhoto(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('photo', file);
    return apiFetch<{ url: string }>('/complaints/attachments', {
      method: 'POST',
      body: formData,
    });
  },
};
