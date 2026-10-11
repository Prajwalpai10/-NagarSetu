import { UserAccount } from '../types';
import { INITIAL_USERS } from '../data/initialData';
import { storageService } from './storageService';

const USERS_KEY = 'user_accounts';

export const authService = {
  getAllUsers: (): UserAccount[] => {
    return storageService.get<UserAccount[]>(USERS_KEY, INITIAL_USERS);
  },

  saveAllUsers: (users: UserAccount[]): void => {
    storageService.set(USERS_KEY, users);
  },

  provisionOfficer: (data: {
    name: string;
    role: string;
    department: string;
    ward: string;
    email: string;
    phone: string;
  }): UserAccount => {
    const users = authService.getAllUsers();
    const initials = data.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'OF';
    const id = data.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(100 + Math.random() * 900);
    const empId = `#EMP-BBMP-${Math.floor(100 + Math.random() * 900)}`;

    const newAccount: UserAccount = {
      id,
      name: data.name,
      initials,
      empId,
      role: data.role || 'Officer (Field Inspector)',
      roleBadge: 'FIELD INSPECTOR',
      designation: 'Ward Executive Inspector',
      department: data.department || 'Roads & Infra (BBMP)',
      ward: data.ward || 'Ward 12 Indiranagar',
      zone: 'East Zone',
      status: 'Active',
      email: data.email || `${id}@bbmp.gov.in`,
      phone: data.phone || '+91 98000 00000',
      joinedDate: 'Today',
      lastActive: 'Just now',
      assignedWards: data.ward || 'Ward 12 Indiranagar',
      activeCases: '0 Open Cases',
      isOnline: true,
      userType: 'Officer',
    };

    const updated = [newAccount, ...users];
    authService.saveAllUsers(updated);
    return newAccount;
  },

  updateUserStatus: (id: string, status: UserAccount['status']): UserAccount[] => {
    const users = authService.getAllUsers();
    const updated = users.map(u => u.id === id ? { ...u, status } : u);
    authService.saveAllUsers(updated);
    return updated;
  }
};
