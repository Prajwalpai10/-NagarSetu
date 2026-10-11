import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  onLogout?: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const authCtx = useAuth();

  const {
    persona,
    setPersona,
    currentView,
    setCurrentView,
    complaints,
    notifications,
    setSelectedTicketId,
    showToast,
    toggleMobileMenu,
    locale,
    setLocale,
    translations,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState('w12');
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    if (persona === 'admin') {
      setCurrentView('admin_complaints', { search: query });
      return;
    }
    if (persona === 'ops') {
      const normalizedQuery = query.toLocaleLowerCase();
      const match = complaints.find(complaint => [
        complaint.id,
        complaint.title,
        complaint.description,
        complaint.location,
      ].some(value => value.toLocaleLowerCase().includes(normalizedQuery)));
      if (match) {
        setSelectedTicketId(match.id);
        setCurrentView('incident_dossier', { id: match.id });
      } else {
        showToast('No Matching Complaint', `No accessible complaint matches "${query}".`, 'search_off', 'info');
      }
      return;
    }
    if (query.toUpperCase().includes('CMP') || query.includes('8712') || query.includes('1482') || query.includes('9041')) {
      setSelectedTicketId('CMP-2026-01482');
      setCurrentView('track_complaint');
      showToast('Record Found', `Loaded record for ${query}`);
    } else {
      showToast('Search Result', `Showing records matching "${query}"`);
    }
  };

  if (currentView === 'public_landing') {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between bg-[#F7F4EA]/90 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl md:px-margin-desktop">
        <div className="flex cursor-pointer items-center gap-space-sm" onClick={() => setCurrentView('public_landing')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#315C4A] text-white shadow-sm">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">account_balance</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold leading-none text-[#315C4A]">{translations.portalName}</span>
              <span className="rounded bg-[#eaf3ef] px-1 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#315C4A]">{translations.smartCity}</span>
            </div>
            <span className="truncate text-[10px] uppercase tracking-[0.18em] text-[#514533]">
              {translations.citizenPortal}
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-space-md text-sm font-medium lg:flex">
          <button className="cursor-pointer font-bold text-[#315C4A] hover:text-[#27493a]" onClick={() => { setPersona('citizen'); setCurrentView('citizen_home'); }}>{translations.citizenPortal}</button>
          <a className="text-[#514533] transition-colors hover:text-[#171A17]" href="#how-it-works">{translations.howItWorks}</a>
          <button className="flex cursor-pointer items-center gap-1 font-semibold text-[#C83E3E] transition-opacity hover:opacity-80" onClick={() => { setPersona('citizen'); setCurrentView('emergency'); }}>
            <span className="material-symbols-outlined text-sm" aria-hidden="true">emergency</span>{translations.emergencyHelpline}
          </button>
        </nav>

        <div className="flex items-center gap-space-xs sm:gap-space-sm">
          <LanguageSelector className="hidden sm:inline-flex" value={locale} onChange={setLocale} />
          <button
            onClick={() => setCurrentView('citizen_home')}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#315C4A] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:brightness-105 sm:px-space-md sm:py-2 sm:text-sm"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">login</span>
            {translations.signIn}
          </button>

          <button
            onClick={() => { setCurrentView('report_issue'); }}
            className="inline-flex items-center justify-center rounded-lg bg-[#F2A900] px-2.5 py-1.5 text-xs font-bold text-[#171A17] shadow-sm transition-all hover:brightness-95 sm:px-space-md sm:py-2 sm:text-sm"
          >
            {translations.reportIssue}
          </button>
        </div>
      </header>
    );
  }


  // Citizen Dashboard Top Header
  if (persona === 'citizen') {
    return (
      <header className="fixed top-0 left-0 md:left-72 right-0 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 md:px-gutter-desktop">
        <div className="flex items-center gap-space-xs sm:gap-space-md">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl" aria-hidden="true">menu</span>
          </button>

          <div className="flex items-center gap-space-xs py-1 px-space-sm bg-surface-container-low">
            <span className="material-symbols-outlined text-secondary text-base" aria-hidden="true">location_city</span>
            <span className="font-label-caps text-[10px] sm:text-label-caps uppercase tracking-wider text-on-surface-variant font-bold truncate">
              {translations.citizenPortal}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-xs sm:gap-space-md">
          <LanguageSelector value={locale} onChange={setLocale} />
          <button
            onClick={() => setCurrentView('report_issue')}
            className="flex items-center gap-space-xs py-1.5 sm:py-2 px-2.5 sm:px-space-md bg-primary-container text-on-primary-container rounded font-body-md text-xs sm:text-body-md font-bold shadow-sm hover:brightness-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base sm:text-lg" aria-hidden="true">add_circle</span>
            <span className="hidden sm:inline">+ Report an Issue</span>
            <span className="sm:hidden">Report</span>
          </button>

          <form onSubmit={handleSearch} className="relative hidden lg:block w-56">
            <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" aria-hidden="true">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaints..."
              aria-label="Search complaints"
              className="w-full pl-9 pr-space-sm py-1.5 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/70 font-body-sm text-body-sm rounded focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </form>

          <button
            onClick={() => setCurrentView('notifications')}
            aria-label="Notifications"
            className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-tertiary text-on-tertiary font-code-badge text-[0.625rem] rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <div
            onClick={() => setCurrentView('citizen_profile')}
            role="button"
            tabIndex={0}
            aria-label="Citizen profile"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCurrentView('citizen_profile'); }}
            className="flex items-center gap-space-xs pl-space-xs cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-bold text-xs">
              {authCtx.user?.name?.slice(0, 2).toUpperCase() ?? 'CI'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface leading-none">
                {authCtx.user?.name ?? 'Citizen'}
              </span>
              <span className="font-label-caps text-label-caps text-on-surface-variant leading-none mt-0.5">Citizen Resident</span>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
              className="p-2 rounded-lg text-on-surface-variant hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">logout</span>
            </button>
          )}
        </div>
      </header>
    );
  }



  // Ops Field Header
  if (persona === 'ops') {
    return (
      <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 md:px-gutter-desktop">
        <div className="flex items-center gap-space-xs sm:gap-space-lg">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl" aria-hidden="true">menu</span>
          </button>

          <div className="flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container rounded-lg">
            <span className="material-symbols-outlined text-secondary text-lg" aria-hidden="true">domain</span>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              aria-label="Select Ward"
              className="bg-transparent font-body-sm text-xs sm:text-body-sm font-semibold text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="w12">Ward 12 - Indiranagar East</option>
              <option value="w13">Ward 13 - Domlur</option>
              <option value="w14">Ward 14 - Halasuru</option>
            </select>
          </div>
          <div className="hidden lg:flex items-center gap-space-xs px-space-sm py-space-xs bg-secondary-fixed text-on-secondary-fixed rounded-lg">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-label-caps text-label-caps uppercase tracking-wide">On Duty • General Shift (08:00 - 18:00)</span>
          </div>
        </div>

        <div className="flex items-center gap-space-xs sm:gap-space-md">
          <form onSubmit={handleSearch} className="relative hidden sm:flex items-center w-48 md:w-80">
            <span className="material-symbols-outlined absolute left-space-sm text-on-surface-variant text-lg" aria-hidden="true">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search accessible complaints"
              className="w-full bg-surface-container-low pl-9 pr-space-sm py-space-xs rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-secondary transition-all"
              placeholder="Ticket ID, description, location..."
            />
          </form>

          <button
            onClick={() => setCurrentView('complaint_queue')}
            aria-label="Complaint Queue"
            className="relative p-space-xs rounded-lg hover:bg-surface-container transition-all text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error animate-ping"></span>
          </button>

          <div
            onClick={() => setCurrentView('staff_profile')}
            role="button"
            tabIndex={0}
            aria-label="Officer profile"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCurrentView('staff_profile'); }}
            className="flex items-center gap-space-sm pl-space-sm bg-surface-container-low py-space-xs pr-space-md rounded-lg cursor-pointer hover:bg-surface-container transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs">
              {authCtx.user?.name?.slice(0, 2).toUpperCase() ?? 'OF'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-body-sm text-body-sm font-bold text-on-surface leading-tight">
                {authCtx.user?.name ?? 'Officer'}
              </span>
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                {authCtx.user?.department ?? 'Field Officer'}
              </span>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
              className="p-space-xs rounded-lg text-on-surface-variant hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">logout</span>
            </button>
          )}
        </div>
      </header>
    );
  }



  // Admin / City Command Header
  return (
    <header className="fixed top-0 left-0 md:left-72 right-0 h-16 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 md:px-gutter-desktop">
      <div className="flex items-center gap-space-xs sm:gap-space-lg">
        {/* Mobile hamburger menu toggle */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl" aria-hidden="true">menu</span>
        </button>

        <div className="flex items-center gap-space-xs cursor-pointer" onClick={() => setCurrentView('command_center')}>
          <span className="font-headline-md text-headline-md text-on-surface font-bold">NagarSetu</span>
          <span className="text-on-surface-variant font-body-sm hidden sm:inline">—</span>
          <span className="font-body-md text-body-md text-on-surface-variant font-medium hidden sm:inline">Administration</span>
        </div>
        <div className="h-6 w-px bg-surface-container-high hidden md:block"></div>
        <div className="hidden sm:flex items-center gap-space-xs bg-surface-container px-space-md py-1.5 rounded-lg text-on-surface">
          <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">location_city</span>
          <span className="font-body-sm text-body-sm font-medium">Authorized complaint records</span>
        </div>
      </div>

      <div className="flex items-center gap-space-xs sm:gap-space-md">
        <form onSubmit={handleSearch} className="relative hidden lg:flex items-center">
          <span className="material-symbols-outlined absolute left-space-md text-[18px] text-on-surface-variant" aria-hidden="true">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search complaint ID, description, or location"
            className="w-56 xl:w-64 pl-9 pr-space-md py-1.5 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-secondary"
            placeholder="Search complaints..."
          />
        </form>

        <button
          onClick={() => setCurrentView('escalations')}
          aria-label="Escalations Alert"
          className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">notifications</span>
        </button>

        <div className="h-6 w-px bg-surface-container-high hidden sm:block"></div>

        <div
          onClick={() => setCurrentView('admin_profile')}
          role="button"
          tabIndex={0}
          aria-label="Administrator profile"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCurrentView('admin_profile'); }}
          className="flex items-center gap-space-sm pl-space-xs cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="hidden md:flex flex-col text-right">
            <span className="font-body-sm text-body-sm font-semibold text-on-surface">
              {authCtx.user?.name ?? 'Administrator'}
            </span>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              {authCtx.user?.department ?? 'Admin'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-on-primary">
            {authCtx.user?.name?.slice(0, 2).toUpperCase() ?? 'AD'}
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            className="p-2 rounded-lg text-on-surface-variant hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
          </button>
        )}
      </div>
    </header>
  );
};
