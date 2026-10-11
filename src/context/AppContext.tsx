import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppPersona, AppView, Complaint, UserAccount, NotificationItem, HotspotCorridor } from '../types';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { analyticsService } from '../services/analyticsService';
import { departmentService } from '../services/departmentService';
import { EmergencyDispatchPayload } from '../services/emergencyService';
import { storageService } from '../services/storageService';
import { i18nService, SupportedLocale } from '../services/i18nService';
import { VIEW_TO_PATH, getViewFromPathname } from '../routes';
import { apiClient } from '../services/apiClient';
import { useAuth } from './AuthContext';

interface ToastState {
  id: string;
  title: string;
  description: string;
  icon?: string;
  type?: 'success' | 'warning' | 'error' | 'info';
}

interface AppContextType {
  persona: AppPersona;
  setPersona: (persona: AppPersona) => void;
  currentView: AppView;
  setCurrentView: (view: AppView, params?: { id?: string; category?: string; search?: string }) => void;
  complaints: Complaint[];
  isComplaintsLoading: boolean;
  complaintLoadError: string | null;
  refreshComplaints: () => Promise<boolean>;
  selectedTicketId: string;
  setSelectedTicketId: (id: string) => void;
  addComplaint: (newComplaint: Partial<Complaint>) => Promise<Complaint>;
  updateComplaintStatus: (id: string, status: Complaint['status'], extra?: Partial<Complaint>) => Promise<boolean>;
  assignComplaintToOfficer: (id: string, officerId: string, departmentId: string) => Promise<boolean>;
  upvoteComplaint: (id: string) => Promise<void>;
  appendEvidence: (id: string, photoUrl?: string, note?: string) => Promise<void>;
  bulkReassignComplaints: (targetDept: string) => Promise<number>;
  users: UserAccount[];
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  provisionOfficer: (data: {
    name: string;
    role: string;
    department: string;
    ward: string;
    email: string;
    phone: string;
  }) => UserAccount;
  updateUserStatus: (id: string, status: UserAccount['status']) => void;
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  dismissNotification: (id: string) => void;
  hotspots: HotspotCorridor[];
  dispatchEmergencyIncident: (payload: EmergencyDispatchPayload) => Promise<Complaint>;
  syncRoster: () => void;
  selectedCategoryDraft: string;
  setSelectedCategoryDraft: (cat: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  translations: ReturnType<typeof i18nService.getTranslations>;
  toast: ToastState | null;
  showToast: (title: string, description: string, icon?: string, type?: ToastState['type']) => void;
  hideToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { status: authStatus, refreshUser } = useAuth();

  // Load persisted initial values
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isComplaintsLoading, setIsComplaintsLoading] = useState(true);
  const [complaintLoadError, setComplaintLoadError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserAccount[]>(() => authService.getAllUsers());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => notificationService.getAll());
  const [hotspots, setHotspots] = useState<HotspotCorridor[]>(() => analyticsService.getHotspots());

  const [selectedTicketId, setSelectedTicketIdState] = useState<string>(() =>
    storageService.get('selected_ticket_id', 'CMP-2026-01482')
  );
  const [selectedUserId, setSelectedUserIdState] = useState<string>(() =>
    storageService.get('selected_user_id', 'rajesh')
  );
  const [selectedCategoryDraft, setSelectedCategoryDraft] = useState<string>(() =>
    storageService.get('selected_category_draft', 'Roads & Potholes')
  );
  const [locale, setLocaleState] = useState<SupportedLocale>(() => i18nService.getLocale());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    document.documentElement.lang = locale === 'kn' ? 'kn' : 'en';
  }, [locale]);

  // Derive initial view & persona from current URL pathname
  const initialRouteMatch = getViewFromPathname(location.pathname);
  const [persona, setPersonaState] = useState<AppPersona>(initialRouteMatch.persona);
  const [currentView, setCurrentViewState] = useState<AppView>(initialRouteMatch.view);

  // Sync route changes (e.g. browser Back/Forward, direct URL navigation)
  useEffect(() => {
    const match = getViewFromPathname(location.pathname);
    setCurrentViewState(match.view);
    setPersonaState(match.persona);
    if (match.ticketId) {
      setSelectedTicketIdState(match.ticketId);
      storageService.set('selected_ticket_id', match.ticketId);
    }
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const showToast = useCallback((title: string, description: string, icon = 'check_circle', type: ToastState['type'] = 'success') => {
    setToast({
      id: String(Date.now()),
      title,
      description,
      icon,
      type
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const refreshComplaints = useCallback(async (): Promise<boolean> => {
    setIsComplaintsLoading(true);
    setComplaintLoadError(null);
    const result = await apiClient.getComplaints();
    if (result.error || !result.data) {
      const error = result.error ?? 'The complaint service returned an invalid response.';
      setComplaintLoadError(error);
      setIsComplaintsLoading(false);
      showToast('Complaints Unavailable', error, 'error', 'error');
      if (result.status === 401) {
        await refreshUser();
      }
      return false;
    }
    setComplaints(result.data.complaints);
    setComplaintLoadError(null);
    setIsComplaintsLoading(false);
    return true;
  }, [refreshUser, showToast]);

  useEffect(() => {
    if (authStatus === 'loading') return;
    if (authStatus === 'unauthenticated') {
      setComplaints([]);
      setComplaintLoadError(null);
      setIsComplaintsLoading(false);
      return;
    }
    void refreshComplaints();
  }, [authStatus, refreshComplaints]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const setSelectedTicketId = useCallback((id: string) => {
    setSelectedTicketIdState(id);
    storageService.set('selected_ticket_id', id);
  }, []);

  const setSelectedUserId = useCallback((id: string) => {
    setSelectedUserIdState(id);
    storageService.set('selected_user_id', id);
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    i18nService.setLocale(newLocale);
    showToast(
      'Language Changed',
      `Interface switched to ${newLocale === 'kn' ? 'ಕನ್ನಡ (Kannada)' : newLocale === 'hi' ? 'हिंदी (Hindi)' : newLocale === 'mr' ? 'मराठी (Marathi)' : 'English'}`
    );
  }, [showToast]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Navigate to view and update URL history
  const setCurrentView = useCallback((view: AppView, params?: { id?: string; category?: string; search?: string }) => {
    if (params?.category) {
      setSelectedCategoryDraft(params.category);
      storageService.set('selected_category_draft', params.category);
    }
    if (params?.id) {
      setSelectedTicketId(params.id);
    }

    let targetPath = VIEW_TO_PATH[view] || '/';
    if (view === 'track_complaint' && params?.id) {
      targetPath = `/citizen/track/${params.id}`;
    } else if (view === 'incident_dossier' && params?.id) {
      targetPath = `/ops/incident/${params.id}`;
    } else if (view === 'admin_complaints' && params?.id) {
      targetPath = `/admin/complaints/${encodeURIComponent(params.id)}`;
    } else if (view === 'admin_assignments' && params?.id) {
      targetPath = `/admin/assignments/${encodeURIComponent(params.id)}`;
    } else if (view === 'admin_complaints' && params?.search) {
      targetPath = `/admin/complaints?q=${encodeURIComponent(params.search)}`;
    } else if (view === 'city_map' && persona === 'ops') {
      targetPath = '/ops/map';
    }

    navigate(targetPath);
  }, [navigate, persona, setSelectedTicketId]);

  const setPersona = useCallback((newPersona: AppPersona) => {
    setPersonaState(newPersona);
    if (newPersona === 'citizen') {
      setCurrentView('citizen_home');
    } else if (newPersona === 'ops') {
      setCurrentView('officer_dashboard');
    } else if (newPersona === 'admin') {
      setCurrentView('command_center');
    }
  }, [setCurrentView]);

  const addComplaint = useCallback(async (data: Partial<Complaint>): Promise<Complaint> => {
    const result = await apiClient.createComplaint(data);
    if (result.error || !result.data) {
      showToast('Complaint Not Submitted', result.error ?? 'The server returned an invalid response.', 'error', 'error');
      throw new Error(result.error ?? 'The server returned an invalid response.');
    }
    const newComplaint = result.data.complaint;
    setComplaints(current => [newComplaint, ...current.filter(complaint => complaint.id !== newComplaint.id)]);
    setSelectedTicketId(newComplaint.id);

    // Also register a notification
    notificationService.addNotification({
      title: 'Your complaint has been received.',
      message: `Token #${newComplaint.id} generated and routed to ${newComplaint.department}.`,
      category: 'complaints',
      priorityBadge: `${newComplaint.priority} • Received`,
      ticketId: newComplaint.id,
      actionLabel: 'Track Status',
      actionView: 'track_complaint',
      actionTicketId: newComplaint.id,
    });
    setNotifications(notificationService.getAll());

    showToast('Report Registered', `Complaint ${newComplaint.id} logged and routed to ${newComplaint.department}`);
    return newComplaint;
  }, [setSelectedTicketId, showToast]);

  const updateComplaintStatus = useCallback(async (id: string, status: Complaint['status'], extra?: Partial<Complaint>): Promise<boolean> => {
    const result = await apiClient.updateComplaintStatus(id, status, extra?.description);
    if (result.error || !result.data) {
      showToast('Status Not Updated', result.error ?? 'The server returned an invalid response.', 'error', 'error');
      return false;
    }
    setComplaints(current => current.map(complaint => complaint.id === id ? result.data!.complaint : complaint));

    notificationService.addNotification({
      title: `Complaint status updated: ${status}`,
      message: `Ticket #${id} status changed to ${status}.`,
      category: 'updates',
      priorityBadge: status,
      ticketId: id,
      actionLabel: 'Inspect',
      actionView: 'track_complaint',
      actionTicketId: id,
    });
    setNotifications(notificationService.getAll());

    showToast('Status Updated', `Ticket ${id} marked as ${status}`);
    return true;
  }, [showToast]);

  const assignComplaintToOfficer = useCallback(async (id: string, officerId: string, departmentId: string): Promise<boolean> => {
    if (!id.trim() || !officerId.trim() || !departmentId.trim()) {
      showToast('Assignment Not Saved', 'Choose a complaint, department, and active officer.', 'error', 'error');
      return false;
    }
    const result = await apiClient.adminAssignComplaint(id, officerId, departmentId);
    if (result.error || !result.data) {
      showToast('Assignment Not Saved', result.error ?? 'The server returned an invalid response.', 'error', 'error');
      return false;
    }
    setComplaints(current => current.map(complaint =>
      complaint.id === id ? result.data!.complaint : complaint
    ));
    showToast('Assignment Saved', `Complaint ${id} assigned to ${result.data.complaint.assignedOfficer ?? 'the selected officer'}.`);
    return true;
  }, [showToast]);

  const upvoteComplaint = useCallback(async (id: string) => {
    const result = await apiClient.upvoteComplaint(id);
    if (result.error || !result.data) {
      showToast('Endorsement Not Saved', result.error ?? 'The server returned an invalid response.', 'error', 'error');
      return;
    }
    setComplaints(current => current.map(complaint => complaint.id === id ? result.data!.complaint : complaint));
    showToast('Report Endorsed', `You endorsed complaint ${id}. Priority score increased.`);
  }, [showToast]);

  const appendEvidence = useCallback(async (id: string, photoUrl?: string, note?: string) => {
    const result = await apiClient.appendComplaintEvidence(id, {
      ...(photoUrl ? { photoUrls: [photoUrl] } : {}),
      ...(note ? { note } : {}),
    });
    if (result.error || !result.data) {
      showToast('Evidence Not Saved', result.error ?? 'The server returned an invalid response.', 'error', 'error');
      return;
    }
    setComplaints(current => current.map(complaint => complaint.id === id ? result.data!.complaint : complaint));
    showToast('Evidence Appended', `Supplemental evidence attached to ${id}`);
  }, [showToast]);

  const bulkReassignComplaints = useCallback(async (targetDept: string) => {
    const result = await apiClient.bulkRouteComplaints(targetDept);
    if (result.error || !result.data) {
      showToast('Routing Not Saved', result.error ?? 'The server returned an invalid response.', 'error', 'error');
      return 0;
    }
    const updatedById = new Map(result.data.complaints.map(complaint => [complaint.id, complaint]));
    setComplaints(current => current.map(complaint => updatedById.get(complaint.id) ?? complaint));
    showToast('Cases Routed', `${result.data.count} accessible open cases routed to ${targetDept}.`);
    return result.data.count;
  }, [showToast]);

  const provisionOfficer = useCallback((data: {
    name: string;
    role: string;
    department: string;
    ward: string;
    email: string;
    phone: string;
  }) => {
    const newOfficer = authService.provisionOfficer(data);
    setUsers(authService.getAllUsers());
    showToast('Officer Provisioned', `Officer ${newOfficer.name} credentialed in ${newOfficer.department}.`);
    return newOfficer;
  }, [showToast]);

  const updateUserStatus = useCallback((id: string, status: UserAccount['status']) => {
    authService.updateUserStatus(id, status);
    setUsers(authService.getAllUsers());
    showToast('Account Status Updated', `User account ${id} is now ${status}.`);
  }, [showToast]);

  const dispatchEmergencyIncident = useCallback(async (payload: EmergencyDispatchPayload) => {
    const result = await apiClient.dispatchEmergency({
      category: payload.hazardType,
      title: `EMERGENCY ALERT: ${payload.hazardType} at ${payload.location}`,
      description: payload.details,
      location: payload.location,
      ...(payload.coordinates ? { coordinates: payload.coordinates } : {}),
      locationSource: payload.coordinates ? 'gps' : 'manual',
      ...(payload.ward ? { ward: payload.ward } : {}),
    });
    if (result.error || !result.data) {
      showToast('Emergency Not Dispatched', result.error ?? 'The server returned an invalid response.', 'error', 'error');
      throw new Error(result.error ?? 'The server returned an invalid response.');
    }
    const emergencyComplaint = result.data.complaint;
    setComplaints(current => [emergencyComplaint, ...current.filter(complaint => complaint.id !== emergencyComplaint.id)]);
    setSelectedTicketId(emergencyComplaint.id);

    notificationService.addNotification({
      title: `EMERGENCY DISPATCH ACTIVATED`,
      message: `Rapid response unit alerted for ${payload.hazardType} at ${payload.location}.`,
      category: 'emergency',
      priorityBadge: 'P1 CRITICAL',
      ticketId: emergencyComplaint.id,
      actionLabel: 'Live Telemetry',
      actionView: 'track_complaint',
      actionTicketId: emergencyComplaint.id,
    });
    setNotifications(notificationService.getAll());

    showToast('Emergency Dispatched', `Tactical Unit QRV-01 deployed for ${emergencyComplaint.id}`, 'emergency', 'error');
    return emergencyComplaint;
  }, [setSelectedTicketId, showToast]);

  const syncRoster = useCallback(() => {
    const result = departmentService.syncRoster();
    showToast('Roster Synced', `${result.syncedCount} officers and field crews verified for ${result.activeShift}.`);
  }, [showToast]);

  const markNotificationAsRead = useCallback((id: string) => {
    notificationService.markAsRead(id);
    setNotifications(notificationService.getAll());
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getAll());
    showToast('All Read', 'All notifications marked as read');
  }, [showToast]);

  const clearAllNotifications = useCallback(() => {
    notificationService.clearAll();
    setNotifications([]);
    showToast('Cleared', 'All notifications cleared');
  }, [showToast]);

  const dismissNotification = useCallback((id: string) => {
    notificationService.dismiss(id);
    setNotifications(notificationService.getAll());
  }, []);

  const translations = i18nService.getTranslations(locale);

  return (
    <AppContext.Provider
      value={{
        persona,
        setPersona,
        currentView,
        setCurrentView,
        complaints,
        isComplaintsLoading,
        complaintLoadError,
        refreshComplaints,
        selectedTicketId,
        setSelectedTicketId,
        addComplaint,
        updateComplaintStatus,
        assignComplaintToOfficer,
        upvoteComplaint,
        appendEvidence,
        bulkReassignComplaints,
        users,
        selectedUserId,
        setSelectedUserId,
        provisionOfficer,
        updateUserStatus,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        dismissNotification,
        hotspots,
        dispatchEmergencyIncident,
        syncRoster,
        selectedCategoryDraft,
        setSelectedCategoryDraft,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,
        locale,
        setLocale,
        translations,
        toast,
        showToast,
        hideToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
