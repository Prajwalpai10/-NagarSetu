import type { AuthUser, DepartmentRecord } from './apiClient';

export function getAvailableDepartments(departments: DepartmentRecord[]): DepartmentRecord[] {
  return departments
    .filter(department => department.status === 'active')
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getEligibleOfficers(users: AuthUser[], departmentId: string): AuthUser[] {
  if (!departmentId) return [];
  return users.filter(user =>
    user.role === 'officer'
    && user.status === 'active'
    && user.departmentId === departmentId
  );
}

export function changeAssignmentDepartment(
  departmentId: string
): { departmentId: string; officerId: '' } {
  return { departmentId, officerId: '' };
}

export function changeAssignmentComplaint(
  complaintId: string
): { complaintId: string; departmentId: ''; officerId: '' } {
  return { complaintId, departmentId: '', officerId: '' };
}
