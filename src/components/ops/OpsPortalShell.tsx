import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelector } from '../common/LanguageSelector';
import type { AppView } from '../../types';
import './OpsPortal.css';

const COPY = {
  en: {
    portal: 'Field Operations Portal',
    overview: 'Overview',
    tasks: 'My Assigned Tasks',
    inProgress: 'In Progress',
    completed: 'Completed Tasks',
    profile: 'My Profile',
    guidance: 'General guidance: verify the location and review the complaint history before updating a task.',
    filters: 'Task filters',
    sort: 'Sort',
    newest: 'Newest first',
    oldest: 'Oldest first',
    allCategories: 'All categories',
    statusSubmitted: 'Submitted',
    statusAssigned: 'Assigned',
    statusInProgress: 'In Progress',
    statusResolved: 'Resolved',
    statusClosed: 'Closed',
    statusEscalated: 'Escalated',
    active: 'Active',
    signOut: 'Sign out',
    loading: 'Loading assigned tasks…',
    loadError: 'Unable to load assigned tasks.',
    retry: 'Retry',
    noTasks: 'No tasks are currently assigned to your account.',
    noResults: 'No tasks match the current search and filters.',
    assigned: 'Assigned',
    pending: 'Pending',
    total: 'Assigned tasks',
    overdue: 'Overdue',
    search: 'Search ID, category, description, location, or ward',
    allStatuses: 'All statuses',
    allPriorities: 'All priorities',
    category: 'Category',
    description: 'Description',
    location: 'Location / ward',
    priority: 'Priority',
    status: 'Status',
    assignment: 'Assignment date',
    updated: 'Last update',
    open: 'Open task',
    refresh: 'Refresh tasks',
    unavailable: 'Task unavailable',
    back: 'Back to assigned tasks',
    details: 'Task details',
    currentStatus: 'Current status',
    assignedOfficer: 'Assigned officer',
    department: 'Department',
    submitted: 'Submitted',
    history: 'Status history and operational remarks',
    noHistory: 'No status history is recorded.',
    statusUpdate: 'Update status',
    note: 'Operational remark (saved with status update)',
    noteHint: 'Maximum 1000 characters',
    save: 'Save update',
    saving: 'Saving…',
    saveFailed: 'Update could not be saved.',
    saved: 'Task update saved.',
    confirmResolve: 'Mark this task as resolved? The update will be recorded in the complaint history.',
    evidence: 'Existing attachments',
    noEvidence: 'No attachments are recorded.',
    actionRequired: 'Needs action',
    resolved: 'Resolved',
    close: 'Closed',
    referenceTime: 'Time unavailable',
  },
  kn: {
    portal: 'ಕ್ಷೇತ್ರ ಕಾರ್ಯಾಚರಣೆ ಪೋರ್ಟಲ್',
    overview: 'ಅವಲೋಕನ',
    tasks: 'ನನಗೆ ನಿಯೋಜಿಸಿದ ಕಾರ್ಯಗಳು',
    inProgress: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    completed: 'ಪೂರ್ಣಗೊಂಡ ಕಾರ್ಯಗಳು',
    profile: 'ನನ್ನ ಪ್ರೊಫೈಲ್',
    guidance: 'ಸಾಮಾನ್ಯ ಮಾರ್ಗದರ್ಶನ: ಕಾರ್ಯವನ್ನು ನವೀಕರಿಸುವ ಮೊದಲು ಸ್ಥಳವನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ದೂರಿನ ಇತಿಹಾಸವನ್ನು ಓದಿ.',
    filters: 'ಕಾರ್ಯ ಫಿಲ್ಟರ್‌ಗಳು',
    sort: 'ವಿಂಗಡಿಸಿ',
    newest: 'ಹೊಸದು ಮೊದಲು',
    oldest: 'ಹಳೆಯದು ಮೊದಲು',
    allCategories: 'ಎಲ್ಲಾ ವರ್ಗಗಳು',
    statusSubmitted: 'ಸಲ್ಲಿಸಲಾಗಿದೆ',
    statusAssigned: 'ನಿಯೋಜಿಸಲಾಗಿದೆ',
    statusInProgress: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    statusResolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    statusClosed: 'ಮುಚ್ಚಲಾಗಿದೆ',
    statusEscalated: 'ಉನ್ನತ ಮಟ್ಟಕ್ಕೆ ಕಳುಹಿಸಲಾಗಿದೆ',
    active: 'ಸಕ್ರಿಯ',
    signOut: 'ನಿರ್ಗಮಿಸಿ',
    loading: 'ನಿಯೋಜಿತ ಕಾರ್ಯಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…',
    loadError: 'ನಿಯೋಜಿತ ಕಾರ್ಯಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
    retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
    noTasks: 'ನಿಮ್ಮ ಖಾತೆಗೆ ಪ್ರಸ್ತುತ ಯಾವುದೇ ಕಾರ್ಯಗಳನ್ನು ನಿಯೋಜಿಸಿಲ್ಲ.',
    noResults: 'ಪ್ರಸ್ತುತ ಹುಡುಕಾಟ ಮತ್ತು ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಯಾವುದೇ ಕಾರ್ಯ ಹೊಂದಿಕೆಯಾಗುವುದಿಲ್ಲ.',
    assigned: 'ನಿಯೋಜಿಸಲಾಗಿದೆ',
    pending: 'ಬಾಕಿ',
    total: 'ನಿಯೋಜಿತ ಕಾರ್ಯಗಳು',
    overdue: 'ಅವಧಿ ಮೀರಿದೆ',
    search: 'ಐಡಿ, ವರ್ಗ, ವಿವರಣೆ, ಸ್ಥಳ ಅಥವಾ ವಾರ್ಡ್ ಹುಡುಕಿ',
    allStatuses: 'ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು',
    allPriorities: 'ಎಲ್ಲಾ ಆದ್ಯತೆಗಳು',
    category: 'ವರ್ಗ',
    description: 'ವಿವರಣೆ',
    location: 'ಸ್ಥಳ / ವಾರ್ಡ್',
    priority: 'ಆದ್ಯತೆ',
    status: 'ಸ್ಥಿತಿ',
    assignment: 'ನಿಯೋಜಿಸಿದ ದಿನಾಂಕ',
    updated: 'ಕೊನೆಯ ನವೀಕರಣ',
    open: 'ಕಾರ್ಯ ತೆರೆಯಿರಿ',
    refresh: 'ಕಾರ್ಯಗಳನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ',
    unavailable: 'ಕಾರ್ಯ ಲಭ್ಯವಿಲ್ಲ',
    back: 'ನಿಯೋಜಿತ ಕಾರ್ಯಗಳಿಗೆ ಹಿಂತಿರುಗಿ',
    details: 'ಕಾರ್ಯದ ವಿವರಗಳು',
    currentStatus: 'ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ',
    assignedOfficer: 'ನಿಯೋಜಿತ ಅಧಿಕಾರಿ',
    department: 'ಇಲಾಖೆ',
    submitted: 'ಸಲ್ಲಿಸಲಾಗಿದೆ',
    history: 'ಸ್ಥಿತಿ ಇತಿಹಾಸ ಮತ್ತು ಕಾರ್ಯಾಚರಣೆಯ ಟಿಪ್ಪಣಿಗಳು',
    noHistory: 'ಯಾವುದೇ ಸ್ಥಿತಿ ಇತಿಹಾಸ ದಾಖಲಾಗಿಲ್ಲ.',
    statusUpdate: 'ಸ್ಥಿತಿ ನವೀಕರಿಸಿ',
    note: 'ಕಾರ್ಯಾಚರಣೆಯ ಟಿಪ್ಪಣಿ (ಸ್ಥಿತಿ ನವೀಕರಣದೊಂದಿಗೆ ಉಳಿಸಲಾಗುತ್ತದೆ)',
    noteHint: 'ಗರಿಷ್ಠ 1000 ಅಕ್ಷರಗಳು',
    save: 'ನವೀಕರಣ ಉಳಿಸಿ',
    saving: 'ಉಳಿಸಲಾಗುತ್ತಿದೆ…',
    saveFailed: 'ನವೀಕರಣವನ್ನು ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
    saved: 'ಕಾರ್ಯದ ನವೀಕರಣ ಉಳಿಸಲಾಗಿದೆ.',
    confirmResolve: 'ಈ ಕಾರ್ಯವನ್ನು ಪರಿಹಾರಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಬೇಕೇ? ಈ ನವೀಕರಣ ದೂರು ಇತಿಹಾಸದಲ್ಲಿ ದಾಖಲಾಗುತ್ತದೆ.',
    evidence: 'ಲಗತ್ತಿಸಲಾದ ಕಡತಗಳು',
    noEvidence: 'ಯಾವುದೇ ಲಗತ್ತುಗಳು ದಾಖಲಾಗಿಲ್ಲ.',
    actionRequired: 'ಕ್ರಮ ಅಗತ್ಯ',
    resolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    close: 'ಮುಚ್ಚಲಾಗಿದೆ',
    referenceTime: 'ಸಮಯ ಲಭ್ಯವಿಲ್ಲ',
  },
} as const;

interface OpsPortalShellProps {
  active: 'overview' | 'tasks' | 'progress' | 'completed' | 'profile';
  children: React.ReactNode;
}

export const OpsPortalShell: React.FC<OpsPortalShellProps> = ({ active, children }) => {
  const { locale, setLocale, setCurrentView } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const copy = COPY[locale === 'kn' ? 'kn' : 'en'];
  const navigation: { key: OpsPortalShellProps['active']; view: AppView; icon: string; label: string; query?: string }[] = [
    { key: 'overview', view: 'officer_dashboard', icon: 'dashboard', label: copy.overview },
    { key: 'tasks', view: 'complaint_queue', icon: 'assignment', label: copy.tasks },
    { key: 'progress', view: 'complaint_queue', icon: 'pending_actions', label: copy.inProgress, query: 'In Progress' },
    { key: 'completed', view: 'complaint_queue', icon: 'task_alt', label: copy.completed, query: 'Completed' },
    { key: 'profile', view: 'staff_profile', icon: 'person', label: copy.profile },
  ];

  return (
    <div className="ops-portal">
      <header className="ops-portal__header">
        <div className="ops-portal__brand">
          <span className="material-symbols-outlined" aria-hidden="true">account_balance</span>
          <span className="ops-portal__brand-name">NagarSetu</span>
          <span className="ops-portal__divider" aria-hidden="true">/</span>
          <span className="ops-portal__title">{copy.portal}</span>
        </div>
        <div className="ops-portal__account">
          <span className="ops-portal__officer">
            <strong>{user?.name ?? 'Officer'}</strong>
            {user?.department && <span>{user.department}</span>}
          </span>
          <span className="ops-portal__active"><span />{copy.active}</span>
          <LanguageSelector value={locale} onChange={setLocale} className="ops-portal__language" />
          <button type="button" className="ops-portal__signout" onClick={() => void logout()}>
            {copy.signOut}
          </button>
        </div>
      </header>

      <nav className="ops-portal__nav" aria-label={copy.portal}>
        {navigation.map(item => (
          <button
            type="button"
            key={item.key}
            aria-current={active === item.key ? 'page' : undefined}
            className={active === item.key ? 'is-active' : ''}
            onClick={() => item.query
              ? navigate(`/ops/queue?status=${encodeURIComponent(item.query)}`)
              : setCurrentView(item.view)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="ops-portal__guidance" role="note">
        <span className="material-symbols-outlined" aria-hidden="true">info</span>
        <span>{copy.guidance}</span>
      </div>

      <div className="ops-portal__content">{children}</div>
    </div>
  );
};

export const opsCopy = (locale: string) => COPY[locale === 'kn' ? 'kn' : 'en'];

export const opsStatusLabel = (locale: string, status: string): string => {
  const copy = opsCopy(locale);
  const labels: Record<string, string> = {
    Submitted: copy.statusSubmitted,
    Assigned: copy.statusAssigned,
    'In Progress': copy.statusInProgress,
    Resolved: copy.statusResolved,
    Closed: copy.statusClosed,
    Escalated: copy.statusEscalated,
  };
  return labels[status] ?? status;
};
