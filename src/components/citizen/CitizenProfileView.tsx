/**
 * CitizenProfileView — displays and edits the currently authenticated citizen's profile.
 *
 * Data source: AuthContext (from /api/auth/me on load) + real-time edits
 * through PATCH /api/auth/profile.
 *
 * No field is hardcoded to a specific person. If a field is absent from the
 * backend record it is shown as a neutral placeholder or omitted.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';

export const CitizenProfileView: React.FC = () => {
  const { setCurrentView, showToast, complaints } = useApp();
  const { user, refreshUser } = useAuth();

  // ── Edit modal state ─────────────────────────────────────────────────────────
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Notification preference toggles (local UI state) ─────────────────────────
  const [toggles, setToggles] = useState({
    complaints: true,
    resolution: true,
    wardUpdates: true,
    emergency: true,
    maskName: true,
    precisionGps: true,
  });

  const handleToggle = (key: keyof typeof toggles, label: string) => {
    setToggles(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      showToast(
        updated[key] ? 'Preference Enabled' : 'Preference Disabled',
        `${label} setting updated.`
      );
      return updated;
    });
  };

  // ── Profile edit ─────────────────────────────────────────────────────────────
  const openEdit = () => {
    setEditName(user?.name ?? '');
    setEditError('');
    setShowEdit(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    if (!editName.trim() || editName.trim().length < 2) {
      setEditError('Name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    const result = await apiClient.updateProfile({ name: editName.trim() });
    setSaving(false);
    if (result.error) {
      setEditError(result.error);
    } else {
      await refreshUser();
      setShowEdit(false);
      showToast('Profile Updated', 'Your display name has been saved.');
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────────
  const displayName = user?.name ?? 'Citizen';
  const initials = displayName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;

  // My complaints: only those filed by this user's email/name (best-effort on local data)
  const myComplaints = complaints.filter(c =>
    user?.name && (c.citizenName === user.name || c.citizenName?.toLowerCase().includes(user.name.toLowerCase().split(' ')[0].toLowerCase()))
  );
  const resolvedCount = myComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-space-lg pb-space-xl">
      {/* Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="space-y-1">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-on-surface-variant font-code-badge text-code-badge">
            <button onClick={() => setCurrentView('citizen_home')} className="hover:text-secondary cursor-pointer">Citizen Portal</button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-secondary font-bold">My Profile</span>
          </nav>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">Citizen Profile</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Your registered municipal identity and contact preferences.
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            onClick={openEdit}
            className="inline-flex items-center gap-space-xs px-space-md py-2 bg-secondary text-on-secondary hover:bg-secondary/90 rounded-lg shadow-sm transition-all font-body-md text-body-md font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">edit_square</span>
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Profile Banner */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-md">
            {/* Avatar — initials-based, no hardcoded image */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-2xl font-bold shadow-sm">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-sm font-bold">person</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="font-headline-md text-headline-md text-on-surface font-bold">{displayName}</span>
                <span className="font-code-badge text-[0.6875rem] uppercase tracking-wider px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold">
                  Citizen
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-space-md text-on-surface-variant font-body-sm text-body-sm">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-secondary">mail</span>
                  {user?.email ?? '—'}
                </span>
                {memberSince && (
                  <span className="flex items-center gap-1 text-on-surface-variant/80">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    Member since {memberSince}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-space-md pt-space-xs sm:pt-0 sm:self-end lg:self-center">
            <div className="bg-surface-container-low px-space-md py-space-sm rounded-lg text-center min-w-[110px]">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant block font-bold">Complaints Filed</span>
              <span className="font-headline-md text-headline-md text-secondary font-bold">{myComplaints.length}</span>
              <span className="font-code-badge text-[0.625rem] text-on-surface-variant block">In system</span>
            </div>
            <div className="bg-secondary-container/40 px-space-md py-space-sm rounded-lg text-center min-w-[110px]">
              <span className="font-label-caps text-label-caps uppercase text-on-secondary-container block font-bold">Resolved</span>
              <span className="font-headline-md text-headline-md text-on-secondary-container font-bold">{resolvedCount}</span>
              <span className="font-code-badge text-[0.625rem] text-secondary font-medium">Confirmed closed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left column */}
        <div className="lg:col-span-7 space-y-space-lg">
          {/* Account details */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
            <div className="flex items-center gap-space-xs pb-space-xs">
              <span className="material-symbols-outlined text-secondary text-xl">demography</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Account Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md font-body-sm text-body-sm">
              <div className="bg-surface-container-low p-space-md rounded-lg space-y-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block font-bold">Full Name</span>
                <span className="font-body-md text-body-md text-on-surface font-semibold block">{user?.name ?? '—'}</span>
              </div>
              <div className="bg-surface-container-low p-space-md rounded-lg space-y-1">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block font-bold">Account Role</span>
                <span className="font-body-md text-body-md text-on-surface font-semibold block capitalize">{user?.role ?? '—'}</span>
              </div>
              <div className="bg-surface-container-low p-space-md rounded-lg space-y-1 md:col-span-2">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block font-bold">Registered Email</span>
                <span className="font-code-sla text-code-sla text-on-surface font-medium block">{user?.email ?? '—'}</span>
              </div>
              {memberSince && (
                <div className="bg-surface-container-low p-space-md rounded-lg space-y-1">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block font-bold">Member Since</span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold block">{memberSince}</span>
                </div>
              )}
            </div>
          </section>

          {/* Activity ledger */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-xl">task_alt</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">My Activity Ledger</h2>
              </div>
              <button onClick={() => setCurrentView('my_complaints')} className="font-body-sm text-body-sm text-secondary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer">
                View All Complaints →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-sm">
              <div className="p-space-sm rounded-lg bg-surface-container text-center">
                <span className="font-headline-lg text-headline-lg font-bold text-on-surface block leading-tight">{myComplaints.length}</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">Filed</span>
              </div>
              <div className="p-space-sm rounded-lg bg-secondary-container/50 text-center">
                <span className="font-headline-lg text-headline-lg font-bold text-on-secondary-container block leading-tight">{resolvedCount}</span>
                <span className="font-label-caps text-label-caps text-on-secondary-container uppercase font-bold">Resolved</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container text-center">
                <span className="font-headline-lg text-headline-lg font-bold text-secondary block leading-tight">
                  {myComplaints.length - resolvedCount}
                </span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">In Progress</span>
              </div>
            </div>

            {myComplaints.length === 0 && (
              <div className="text-center py-8 text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-3xl block mb-2">inbox</span>
                No complaints filed yet. <button onClick={() => setCurrentView('report_issue')} className="text-secondary underline cursor-pointer">Report an issue</button>
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 space-y-space-lg">
          {/* Notification preferences */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-xl">notifications_active</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Alert Preferences</h2>
              </div>
              <span className="font-code-badge text-[0.6875rem] text-secondary font-semibold bg-secondary-container/40 px-2 py-0.5 rounded">
                Local UI
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Choose how NagarSetu notifies you about complaints and ward updates.
            </p>

            <div className="space-y-space-sm pt-space-xs">
              {[
                { key: 'complaints' as const, label: 'Complaint Lifecycle Updates', sub: 'From submission to field dispatch.' },
                { key: 'resolution' as const, label: 'Resolution & Sign-Off Prompts', sub: 'Alerts when field crew marks task complete.' },
                { key: 'wardUpdates' as const, label: 'Neighbourhood Updates (500m)', sub: 'Civic works, water advisories, road paving.' },
              ].map(({ key, label, sub }) => (
                <label key={key} className="flex items-start justify-between gap-space-md p-space-sm bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container transition-colors">
                  <div className="space-y-0.5">
                    <span className="font-body-md text-body-md font-semibold text-on-surface block">{label}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block">{sub}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles[key]}
                    onChange={() => handleToggle(key, label)}
                    className="w-5 h-5 accent-secondary rounded cursor-pointer mt-1"
                  />
                </label>
              ))}

              <label className="flex items-start justify-between gap-space-md p-space-sm bg-error-container/20 rounded-lg cursor-not-allowed">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-tertiary text-base">emergency</span>
                    <span className="font-body-md text-body-md font-semibold text-tertiary block">Emergency Broadcasts</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant block">Disaster warnings and public safety advisories. Always on.</span>
                </div>
                <input type="checkbox" checked disabled className="w-5 h-5 accent-secondary rounded cursor-not-allowed mt-1" />
              </label>
            </div>
          </section>

          {/* Privacy */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
            <div className="flex items-center gap-space-xs pb-space-xs">
              <span className="material-symbols-outlined text-secondary text-xl">shield</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Privacy &amp; Redaction</h2>
            </div>

            <div className="space-y-space-sm">
              {[
                { key: 'maskName' as const, label: 'Mask Name on Public Board', sub: 'Show as "Citizen" on community reports.' },
                { key: 'precisionGps' as const, label: 'Precision GPS Geo-Anchoring', sub: 'Auto-tag coordinates during issue submission.' },
              ].map(({ key, label, sub }) => (
                <label key={key} className="flex items-center justify-between gap-space-sm p-space-sm bg-surface-container-low rounded-lg cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="font-body-sm text-body-sm font-semibold text-on-surface block">{label}</span>
                    <span className="text-xs text-on-surface-variant block">{sub}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={toggles[key]}
                    onChange={() => handleToggle(key, label)}
                    className="w-5 h-5 accent-secondary rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Account safeguards */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md">
            <div className="flex items-center gap-space-xs pb-space-xs">
              <span className="material-symbols-outlined text-secondary text-xl">lock_person</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Account Safeguards</h2>
            </div>

            <div className="space-y-space-xs text-body-sm font-body-sm">
              <div className="flex items-center justify-between py-1.5 px-space-sm bg-surface-container-low rounded">
                <span className="text-on-surface-variant">Account Status:</span>
                <span className={`font-semibold ${user?.status === 'active' ? 'text-secondary' : 'text-tertiary'}`}>
                  {user?.status ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-space-sm bg-surface-container-low rounded">
                <span className="text-on-surface-variant">Account ID:</span>
                <span className="font-code-sla text-code-sla text-on-surface-variant text-xs truncate max-w-[180px]">{user?.id ?? '—'}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-2xl max-w-sm w-full border border-outline-variant/30 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">edit_square</span>
                <h3 className="font-headline-md font-bold text-base text-on-surface">Edit Profile</h3>
              </div>
              <button type="button" onClick={() => setShowEdit(false)} className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-on-surface mb-1.5">Display Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface text-on-surface outline-none focus:border-secondary"
                />
              </div>

              {editError && (
                <p className="text-[#ba1a1a] text-xs font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">error</span>{editError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowEdit(false)} className="px-3.5 py-2 rounded-lg bg-surface-container text-on-surface font-semibold hover:bg-surface-container-high transition-colors cursor-pointer text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-bold hover:bg-secondary/90 transition-colors shadow-xs disabled:opacity-60 cursor-pointer flex items-center gap-1.5 text-sm">
                  {saving ? (
                    <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  ) : (
                    <>Save Changes</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
