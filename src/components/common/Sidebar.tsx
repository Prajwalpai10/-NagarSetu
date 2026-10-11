import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { AppView } from '../../types';
import { ADMIN_PRIMARY_NAVIGATION, ADMIN_SECONDARY_NAVIGATION } from '../admin/adminNavigation';

export const Sidebar: React.FC = () => {
  const {
    persona,
    currentView,
    setCurrentView,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useApp();
  const { user, logout } = useAuth();

  // Public Landing doesn't have a fixed sidebar
  if (currentView === 'public_landing') {
    return null;
  }

  const handleNavClick = (view: AppView) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  // Backdrop for mobile screens
  const mobileBackdrop = isMobileMenuOpen ? (
    <div
      onClick={() => setIsMobileMenuOpen(false)}
      aria-label="Close navigation overlay"
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
    />
  ) : null;

  // ── Citizen Portal Sidebar (w-72) ─────────────────────────────────────────
  if (persona === 'citizen') {
    const navItems: { label: string; view: AppView; icon: string }[] = [
      { label: 'Home', view: 'citizen_home', icon: 'home' },
      { label: 'Report an Issue', view: 'report_issue', icon: 'add_circle' },
      { label: 'My Complaints', view: 'my_complaints', icon: 'inbox' },
      { label: 'Track Complaint', view: 'track_complaint', icon: 'search' },
      { label: 'Nearby Issues', view: 'nearby_issues', icon: 'near_me' },
      { label: 'Emergency Assistance', view: 'emergency', icon: 'fmd_bad' },
      { label: 'Notifications', view: 'notifications', icon: 'notifications' },
      { label: 'Profile', view: 'citizen_profile', icon: 'person' },
      { label: 'Transparency Gallery', view: 'transparency_gallery', icon: 'verified' },
    ];

    return (
      <>
        {mobileBackdrop}
        <aside
          className={`fixed left-0 top-0 h-full w-72 bg-secondary text-on-secondary z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.06)] transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex flex-col flex-1 min-h-0">
            {/* Brand Logo Header */}
            <div className="p-space-lg flex items-center justify-between bg-secondary/40">
              <div
                className="flex items-center gap-space-sm cursor-pointer"
                onClick={() => handleNavClick('public_landing')}
              >
                <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center p-0.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                  <span className="material-symbols-outlined text-secondary text-2xl" aria-hidden="true">account_balance</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline-md text-headline-md font-bold tracking-tight text-on-secondary leading-tight truncate">NagarSetu</span>
                  <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary-fixed opacity-90 truncate">SMART CITY • CITIZEN</span>
                </div>
              </div>

              {/* Close button on mobile */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation"
                className="md:hidden p-1.5 rounded-lg text-secondary-fixed hover:bg-secondary/60 transition-colors"
              >
                <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
              </button>
            </div>

            {/* Authenticated user badge */}
            {user && (
              <div className="px-space-md py-space-sm">
                <div className="flex items-center gap-space-sm bg-secondary/50 px-space-md py-space-sm rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs shrink-0">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-body-sm text-on-secondary font-semibold text-sm truncate">{user.name}</span>
                    <span className="font-label-caps text-[10px] text-secondary-fixed-dim uppercase tracking-wide">Citizen Account</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Items */}
            <nav className="flex-1 px-space-md py-space-xs space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() => handleNavClick(item.view)}
                    className={`w-full flex items-center gap-space-sm px-space-md py-2 rounded-lg transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                        : 'text-secondary-fixed hover:bg-secondary/60 hover:text-on-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">{item.icon}</span>
                    <span className="font-body-md text-body-md font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Citizen Emergency Hotline + Logout */}
          <div className="p-space-md bg-secondary/80 flex flex-col gap-space-xs">
            <div className="flex items-center justify-between text-secondary-fixed font-code-sla text-code-sla px-1">
              <span>CITIZEN HELPLINE</span>
              <span className="font-code-badge text-code-badge text-secondary-fixed font-bold">1913</span>
            </div>
            <button
              type="button"
              onClick={() => handleNavClick('emergency')}
              className="w-full flex items-center justify-center gap-space-xs py-2 px-space-sm bg-tertiary text-on-tertiary rounded font-body-md text-body-md font-semibold hover:bg-tertiary/90 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.12)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">emergency</span>
              <span>Emergency Helpline</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-space-xs py-1.5 px-space-sm text-secondary-fixed-dim hover:text-on-secondary hover:bg-secondary/60 rounded transition-colors font-body-sm text-body-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      </>
    );
  }

  // ── Ops Field Sidebar (w-64) ──────────────────────────────────────────────
  if (persona === 'ops') {
    const navItems: { label: string; view: AppView; icon: string; count?: string }[] = [
      { label: 'Dashboard', view: 'officer_dashboard', icon: 'dashboard' },
      { label: 'Complaint Queue', view: 'complaint_queue', icon: 'assignment' },
      { label: 'Incident Dossier', view: 'incident_dossier', icon: 'folder_open' },
      { label: 'Department Routing', view: 'department_routing', icon: 'alt_route' },
      { label: 'Map Triage', view: 'city_map', icon: 'map' },
      { label: 'My Profile', view: 'staff_profile', icon: 'person' },
    ];

    return (
      <>
        {mobileBackdrop}
        <aside
          className={`fixed left-0 top-0 h-full w-64 bg-on-secondary-fixed text-secondary-fixed z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex flex-col">
            {/* Logo Header */}
            <div className="p-space-lg flex items-center justify-between bg-on-secondary-fixed-variant">
              <div
                className="flex items-center gap-space-sm cursor-pointer"
                onClick={() => handleNavClick('public_landing')}
              >
                <span className="material-symbols-outlined text-secondary-fixed text-2xl" aria-hidden="true">account_balance</span>
                <div className="flex flex-col">
                  <span className="font-headline-md text-body-md font-bold text-on-primary tracking-tight leading-tight">NagarSetu</span>
                  <span className="font-label-caps text-label-caps text-secondary-fixed uppercase tracking-wider">OFFICER PORTAL • BBMP</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation"
                className="md:hidden p-1.5 rounded-lg text-secondary-fixed hover:bg-on-secondary-fixed transition-colors"
              >
                <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
              </button>
            </div>

            {/* Authenticated officer badge */}
            {user && (
              <div className="px-space-md py-space-sm bg-on-secondary-fixed/30">
                <div className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-bold text-xs shrink-0">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-body-sm text-secondary-fixed font-semibold text-xs truncate">{user.name}</span>
                    <span className="font-label-caps text-[10px] text-secondary-fixed-dim uppercase">{user.department ?? 'Field Officer'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="px-space-md py-space-xs text-secondary-fixed-dim font-label-caps text-label-caps uppercase tracking-wider">
              Operational Modules
            </div>

            <nav className="flex flex-col gap-space-xs px-space-sm">
              {navItems.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() => handleNavClick(item.view)}
                    className={`flex items-center justify-between px-space-md py-space-sm rounded-lg transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-secondary text-on-secondary font-semibold shadow-sm'
                        : 'text-secondary-fixed-dim hover:bg-on-secondary-fixed-variant hover:text-on-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-lg" aria-hidden="true">{item.icon}</span>
                      <span className="font-body-md text-body-md">{item.label}</span>
                    </div>
                    {item.count && (
                      <span className={`font-code-badge text-code-badge px-space-xs rounded ${
                        item.count.includes('P1') ? 'bg-tertiary text-on-tertiary' : 'bg-secondary-container text-on-secondary-container'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Emergency Hotline + Logout */}
          <div className="p-space-md flex flex-col gap-space-sm bg-on-secondary-fixed-variant">
            <div
              title="Emergency dispatch is not connected to this portal"
              className="flex items-center justify-between p-space-sm rounded bg-on-secondary-fixed text-secondary-fixed-dim w-full text-left"
            >
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-base text-primary-container" aria-hidden="true">call</span>
                <span className="font-label-caps text-label-caps uppercase">Emergency Command</span>
              </div>
              <span className="font-code-sla text-code-sla text-primary-container font-bold">1913</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-space-xs py-1.5 text-secondary-fixed-dim hover:text-on-secondary hover:bg-on-secondary-fixed rounded transition-colors font-body-sm text-body-sm w-full cursor-pointer"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      </>
    );
  }

  // ── Admin / City Command Sidebar (w-72) ───────────────────────────────────
  return (
    <>
      {mobileBackdrop}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Brand Header */}
          <div className="h-16 px-gutter-desktop flex items-center justify-between bg-surface-container-low">
            <div
              className="flex items-center gap-space-sm cursor-pointer"
              onClick={() => handleNavClick('command_center')}
              role="button"
              tabIndex={0}
              aria-label="Go to Admin dashboard"
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') handleNavClick('command_center');
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-secondary text-[20px]" aria-hidden="true">account_balance</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-md text-headline-md leading-none text-on-surface">NagarSetu</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Urban OS Core</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-space-xs px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-code-badge text-code-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <span>v4.8</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation"
                className="md:hidden p-1 rounded text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
              </button>
            </div>
          </div>

          {/* Admin user badge */}
          {user && (
            <div className="px-gutter-desktop pt-space-sm pb-space-xs">
              <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg border border-outline-variant/30">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-bold text-xs shrink-0">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-sm text-on-surface font-semibold text-sm truncate">{user.name}</span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wide">
                    {user.department ?? 'Administrator'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="px-gutter-desktop pt-space-md pb-space-sm">
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Administration</p>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-space-md pb-space-sm flex flex-col gap-space-xs">
            {ADMIN_PRIMARY_NAVIGATION.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleNavClick(item.view)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between px-space-md py-space-sm rounded-lg transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-secondary text-on-secondary font-bold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-space-md">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{item.icon}</span>
                    <span className="font-body-md text-body-md">{item.label}</span>
                  </div>
                </button>
              );
            })}
            <details className="mt-2 border-t border-surface-container pt-2">
              <summary className="cursor-pointer rounded-lg px-space-md py-space-sm text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
                More admin tools
              </summary>
              <div className="mt-1 flex flex-col gap-1">
                {ADMIN_SECONDARY_NAVIGATION.map(item => (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() => handleNavClick(item.view)}
                    aria-current={currentView === item.view ? 'page' : undefined}
                    className={`flex items-center gap-space-md px-space-md py-space-sm rounded-lg text-left text-sm ${
                      currentView === item.view
                        ? 'bg-secondary text-on-secondary font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </details>
          </nav>
        </div>

        {/* Sign out */}
        <div className="p-space-md flex flex-col gap-space-xs">
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center gap-space-xs py-2 text-on-surface-variant hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors font-body-sm text-body-sm w-full cursor-pointer"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
