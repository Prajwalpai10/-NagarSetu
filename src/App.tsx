/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * NagarSetu App – Authentication-aware entry point.
 *
 * Authentication flow:
 * 1. AuthProvider calls /api/auth/me on load to restore session from cookie.
 * 2. If no session → LoginPage is shown.
 * 3. After login, role is taken from the server response – never from client state.
 * 4. AppProvider handles all existing civic complaint & dashboard state.
 * 5. Each portal (citizen/officer/admin) is protected by ProtectedRoute which
 *    enforces server-side role before rendering the dashboard.
 */

import React, { useCallback, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Toast } from './components/common/Toast';

// Auth UI
import { LoginPage, type PortalChoice } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { AccessDeniedPage } from './components/auth/AccessDeniedPage';
import { SessionLoadingScreen } from './components/auth/SessionLoadingScreen';

// Citizen Views
import { PublicLandingView } from './components/citizen/PublicLandingView';
import { CitizenHomeView } from './components/citizen/CitizenHomeView';
import { ReportIssueView } from './components/citizen/ReportIssueView';
import { TrackComplaintView } from './components/citizen/TrackComplaintView';
import { MyComplaintsView } from './components/citizen/MyComplaintsView';
import { NearbyIssuesView } from './components/citizen/NearbyIssuesView';
import { EmergencyView } from './components/citizen/EmergencyView';
import { NotificationsView } from './components/citizen/NotificationsView';
import { CitizenProfileView } from './components/citizen/CitizenProfileView';
import { TransparencyGalleryView } from './components/citizen/TransparencyGalleryView';

// Ops Field Views
import { OfficerDashboardView } from './components/ops/OfficerDashboardView';
import { ComplaintQueueView } from './components/ops/ComplaintQueueView';
import { IncidentDossierView } from './components/ops/IncidentDossierView';
import { DepartmentRoutingView } from './components/ops/DepartmentRoutingView';

// Admin / Command Center Views
import { CommandCenterView } from './components/admin/CommandCenterView';
import { CityOperationsMapView } from './components/admin/CityOperationsMapView';
import { HotspotsAnalyticsView } from './components/admin/HotspotsAnalyticsView';
import { EscalationsView } from './components/admin/EscalationsView';
import { DepartmentPerformanceView } from './components/admin/DepartmentPerformanceView';
import { AnalyticsDossierView } from './components/admin/AnalyticsDossierView';
import { UserManagementView } from './components/admin/UserManagementView';
import { AdminSettingsView } from './components/admin/AdminSettingsView';
import { AdminComplaintsView, AdminAssignmentsView } from './components/admin/AdminComplaintsView';
import { AdminResourcesView } from './components/admin/AdminResourcesView';
import { StaffProfileView } from './components/common/StaffProfileView';

// ─── Auth Flow Shell ──────────────────────────────────────────────────────────

/**
 * AuthShell wraps all auth state/page transitions.
 * It sits outside AppProvider to avoid re-mounting the entire app on login.
 */
type AuthScreen = 'app' | 'login' | 'register';

const AnnouncementTicker: React.FC = () => {
  const { locale, translations } = useApp();
  const announcments = [
    locale === 'kn'
      ? 'ಸರ್ಕಾರಿ ಸೇವೆ ಮಾಹಿತಿಗಳು ಮತ್ತು ಕೊಡುಗೆಗಳು ಈಗ ಲಭ್ಯವಿದೆ.'
      : 'Civic service guidance and updates are now available for residents.',
    locale === 'kn'
      ? 'ವ್ಯಕ್ತಿಯ ದೂರುಗಳನ್ನು ರಿಜಿಸ್ಟರ್ ಮಾಡಲು ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಸುಲಭವಾಗಿದೆ.'
      : 'Residents can register and track service requests with ease.',
    locale === 'kn'
      ? 'ತುರ್ತು ಸಂದರ್ಭಗಳಲ್ಲಿ 112 ಅಥವಾ 1913 ಕರೆ ಮಾಡಿ.'
      : 'For urgent matters, call 112 or the 1913 helpline.'
  ];

  return (
    <div className="border-b border-[#d9d3c5] bg-[#FFF0C7] text-[#171A17]" role="region" aria-label={locale === 'kn' ? 'ಸಾಮಾನ್ಯ ಸೇವಾ ಮಾರ್ಗದರ್ಶನ' : 'General civic-service guidance'}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm font-medium">
        <span className="material-symbols-outlined text-base shrink-0" aria-hidden="true">campaign</span>
        <span className="shrink-0 font-semibold text-[10px] uppercase tracking-[0.2em] text-[#315C4A]">
          {locale === 'kn' ? 'ಸೇವಾ ಮಾರ್ಗದರ್ಶನ' : 'Service guidance'}
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-track flex min-w-max items-center gap-8 whitespace-nowrap text-[13px]">
            {[...announcments, ...announcments].map((text, index) => (
              <span key={`${text}-${index}`} className="inline-flex items-center gap-3">
                <span className="dot h-1.5 w-1.5 rounded-full bg-[#315C4A]" />
                <span>{text}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthShell: React.FC = () => {
  const { user, status, logout } = useAuth();
  const [authScreen, setAuthScreen] = React.useState<AuthScreen>('login');
  const [portal, setPortal] = React.useState<PortalChoice>('citizen');

  // Once session is verified, decide which screen to show
  useEffect(() => {
    if (status === 'authenticated' && user) {
      setAuthScreen('app');
    } else if (status === 'unauthenticated') {
      setAuthScreen('login');
    }
  }, [status, user]);

  if (status === 'loading') return <SessionLoadingScreen />;

  if (authScreen === 'register') {
    return (
      <RegisterPage
        portal={portal}
        onRegisterSuccess={() => setAuthScreen('app')}
        onLoginClick={() => setAuthScreen('login')}
      />
    );
  }

  if (authScreen === 'login' || !user) {
    return (
      <LoginPage
        portal={portal}
        onPortalChange={setPortal}
        onLoginSuccess={() => setAuthScreen('app')}
        onRegisterClick={() => setAuthScreen('register')}
      />
    );
  }

  // Authenticated – render the full portal experience.
  return <MainApp onLogout={logout} />;
};

// ─── Main App (post-auth) ────────────────────────────────────────────────────

interface MainAppProps {
  onLogout: () => Promise<void>;
}

const MainApp: React.FC<MainAppProps> = ({ onLogout }) => {
  const { persona, currentView, setCurrentView, setPersona } = useApp();
  const { user } = useAuth();

  // Sync AppContext persona to the authenticated server role on mount & role change.
  // This guarantees the sidebar/header match the actual authenticated role.
  useEffect(() => {
    if (!user) return;
    const serverPersona = user.role === 'admin' ? 'admin' : user.role === 'officer' ? 'ops' : 'citizen';
    if (persona !== serverPersona) {
      setPersona(serverPersona);
    } else if (currentView === 'public_landing') {
      if (user.role === 'admin') setCurrentView('command_center');
      else if (user.role === 'officer') setCurrentView('officer_dashboard');
      else setCurrentView('citizen_home');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const handleGoHome = useCallback(() => {
    if (!user) return;
    if (user.role === 'admin') setCurrentView('command_center');
    else if (user.role === 'officer') setCurrentView('officer_dashboard');
    else setCurrentView('citizen_home');
  }, [user, setCurrentView]);

  // ─── Role guards for route-level access ────────────────────────────────────
  // These guard views that don't match the user's role.
  // We do NOT redirect silently – we show AccessDeniedPage.

  const isCitizenView = currentView.startsWith('citizen') ||
    ['public_landing', 'report_issue', 'track_complaint', 'my_complaints',
     'nearby_issues', 'emergency', 'notifications', 'citizen_profile',
     'transparency_gallery'].includes(currentView);

  const isOpsView = ['officer_dashboard', 'complaint_queue', 'incident_dossier', 'department_routing', 'staff_profile'].includes(currentView)
    || (currentView === 'city_map' && persona === 'ops')
    || (currentView === 'not_found' && persona === 'ops');

  const isAdminView = ['command_center', 'city_map', 'hotspots', 'escalations',
    'department_performance', 'analytics', 'user_management', 'admin_settings',
    'admin_complaints', 'admin_assignments', 'admin_resources', 'admin_profile'].includes(currentView)
    && persona === 'admin'
    || (currentView === 'not_found' && persona === 'admin');

  // If the current view requires a role the user doesn't have → show access denied
  if (user) {
    if (isOpsView && user.role !== 'officer') {
      return <AccessDeniedPage
        reason="Officer portal access requires an Ops Field account."
        onGoHome={handleGoHome}
      />;
    }
    if (isAdminView && user.role !== 'admin') {
      return <AccessDeniedPage
        reason="Admin portal access requires an Administrator account."
        onGoHome={handleGoHome}
      />;
    }
    // Citizens can't see officer-only or admin-only pages
    if (isCitizenView && user.role !== 'citizen' && currentView !== 'public_landing') {
      if (currentView !== 'emergency') {
        return <AccessDeniedPage
          reason="Citizen portal access requires a Citizen account."
          onGoHome={handleGoHome}
        />;
      }
    }
  }

  const renderCurrentView = () => {
    switch (currentView) {
      // Citizen Views
      case 'public_landing':    return <PublicLandingView />;
      case 'citizen_home':      return <CitizenHomeView />;
      case 'report_issue':      return <ReportIssueView />;
      case 'track_complaint':   return <TrackComplaintView />;
      case 'my_complaints':     return <MyComplaintsView />;
      case 'nearby_issues':     return <NearbyIssuesView />;
      case 'emergency':         return <EmergencyView />;
      case 'notifications':     return <NotificationsView />;
      case 'citizen_profile':   return <CitizenProfileView />;
      case 'transparency_gallery': return <TransparencyGalleryView />;

      // Ops Field Views
      case 'officer_dashboard': return <OfficerDashboardView />;
      case 'complaint_queue':   return <ComplaintQueueView />;
      case 'incident_dossier':  return <IncidentDossierView />;
      case 'department_routing': return <DepartmentRoutingView />;
      case 'staff_profile':     return <StaffProfileView />;

      // Admin & City Command Views
      case 'command_center':    return <CommandCenterView />;
      case 'city_map':          return <CityOperationsMapView />;
      case 'hotspots':          return <HotspotsAnalyticsView />;
      case 'escalations':       return <EscalationsView />;
      case 'department_performance': return <DepartmentPerformanceView />;
      case 'analytics':         return <AnalyticsDossierView />;
      case 'user_management':   return <UserManagementView />;
      case 'admin_settings':    return <AdminSettingsView />;
      case 'admin_complaints': return <AdminComplaintsView />;
      case 'admin_assignments': return <AdminAssignmentsView />;
      case 'admin_resources': return <AdminResourcesView />;
      case 'admin_profile': return <StaffProfileView />;
      case 'not_found': return (
        <div className="mx-auto max-w-2xl p-8">
          <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-6">
            <h1 className="text-xl font-bold text-on-surface">Page not found</h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              This NagarSetu destination does not exist. No portal data was changed.
            </p>
            <button
              type="button"
              onClick={handleGoHome}
              className="mt-4 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary"
            >
              Return to your portal
            </button>
          </section>
        </div>
      );

      default:                  return <PublicLandingView />;
    }
  };

  const getMainLayoutClasses = () => {
    if (currentView === 'public_landing') return 'pt-16 min-h-screen bg-surface';
    if (persona === 'ops') return 'pl-0 md:pl-64 pt-16 min-h-screen bg-surface-container-lowest transition-all';
    return 'pl-0 md:pl-72 pt-16 min-h-screen bg-surface-container-lowest transition-all';
  };

  return (
    <div className={`min-h-screen font-body text-on-surface bg-surface-container-lowest antialiased ${persona === 'admin' ? 'admin-shell' : ''}`}>
      <Header onLogout={onLogout} />
      <AnnouncementTicker />
      <Sidebar />
      <main className={getMainLayoutClasses()}>
        {renderCurrentView()}
      </main>
      <Toast />
    </div>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppProvider>
          <AuthShell />
        </AppProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
