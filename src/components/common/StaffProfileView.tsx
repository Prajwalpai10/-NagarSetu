/**
 * StaffProfileView — profile page for Ops Field Officers and Administrators.
 *
 * Reads from AuthContext. Shows real role, name, email, department, zone, and
 * assigned wards. Allows name editing through the backend. No fabricated data.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';

const ROLE_LABEL: Record<string, string> = {
  officer: 'Ops Field Officer',
  admin: 'Administrator',
};

export const StaffProfileView: React.FC = () => {
  const { setCurrentView, showToast } = useApp();
  const { user, refreshUser, logout } = useAuth();

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editZone, setEditZone] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setEditName(user?.name ?? '');
    setEditDept(user?.department ?? '');
    setEditZone(user?.zone ?? '');
    setEditError('');
    setShowEdit(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    if (!editName.trim() || editName.trim().length < 2) {
      setEditError('Name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    const result = await apiClient.updateProfile({
      name: editName.trim(),
      ...(user?.role !== 'officer' ? { department: editDept.trim() || undefined } : {}),
      zone: editZone.trim() || undefined,
    });
    setSaving(false);
    if (result.error) {
      setEditError(result.error);
    } else {
      await refreshUser();
      setShowEdit(false);
      showToast('Profile Updated', 'Your profile has been saved.');
    }
  };

  const displayName = user?.name ?? 'Staff';
  const initials = displayName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = ROLE_LABEL[user?.role ?? ''] ?? 'Staff';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;

  const homeView = user?.role === 'admin' ? 'command_center' : 'officer_dashboard';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-space-lg pb-space-xl">
      {/* Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="space-y-1">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-on-surface-variant font-code-badge text-code-badge">
            <button onClick={() => setCurrentView(homeView)} className="hover:text-secondary cursor-pointer">
              {user?.role === 'admin' ? 'Admin' : 'Officer'} Portal
            </button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-secondary font-bold">My Profile</span>
          </nav>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            {user?.role === 'admin' ? 'Administrator Profile' : 'Staff Profile'}
          </h1>
        </div>
        <button
          type="button"
          onClick={openEdit}
          className="inline-flex items-center gap-space-xs px-space-md py-2 bg-secondary text-on-secondary hover:bg-secondary/90 rounded-lg shadow-sm transition-all font-body-md text-body-md font-semibold cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg">edit_square</span>
          Edit Profile
        </button>
      </div>

      {/* Profile card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-lg">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-2xl font-bold shadow-sm shrink-0">
            {initials}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="font-headline-md text-headline-md text-on-surface font-bold">{displayName}</span>
              <span className="font-code-badge text-[0.6875rem] uppercase tracking-wider px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold">
                {roleLabel}
              </span>
              <span className={`font-code-badge text-[0.6875rem] px-2 py-0.5 rounded font-semibold ${
                user?.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                user?.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                {user?.status ?? '—'}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-space-md gap-y-1 text-on-surface-variant font-body-sm text-body-sm">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-secondary">mail</span>
                {user?.email ?? '—'}
              </span>
              {user?.department && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-secondary">business</span>
                  {user.department}
                </span>
              )}
              {user?.zone && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                  {user.zone}
                </span>
              )}
              {memberSince && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  Member since {memberSince}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        {[
          { label: 'Full Name', value: user?.name },
          { label: 'Email', value: user?.email },
          { label: 'Role', value: roleLabel },
          { label: 'Account Status', value: user?.status },
          { label: 'Department', value: user?.department },
          { label: 'Zone', value: user?.zone },
          { label: 'Assigned Wards', value: user?.assignedWards?.join(', ') },
          { label: 'Member Since', value: memberSince },
        ].filter(f => f.value).map(({ label, value }) => (
          <div key={label} className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block font-bold mb-1">{label}</span>
            <span className="font-body-md text-body-md text-on-surface font-semibold">{value}</span>
          </div>
        ))}
      </div>

      {/* Account ID */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block font-bold mb-1">Account ID</span>
        <span className="font-code-sla text-code-sla text-on-surface-variant text-xs">{user?.id ?? '—'}</span>
      </div>

      {/* Logout */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 px-space-md py-2 rounded-lg text-[#93000a] bg-[#ffdad6] hover:brightness-95 font-semibold text-sm transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Sign Out
        </button>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-2xl max-w-sm w-full border border-outline-variant/30 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">edit_square</span>
                <h3 className="font-headline-md font-bold text-base text-on-surface">Edit Profile</h3>
              </div>
              <button type="button" onClick={() => setShowEdit(false)} className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-on-surface mb-1.5">Display Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface text-on-surface outline-none focus:border-secondary"
                />
              </div>
              {user?.role !== 'officer' ? (
                <div>
                  <label className="block font-semibold text-on-surface mb-1.5">Department</label>
                  <input
                    type="text"
                    value={editDept}
                    onChange={e => setEditDept(e.target.value)}
                    placeholder="Municipal department"
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface text-on-surface outline-none focus:border-secondary"
                  />
                </div>
              ) : (
                <p className="rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">
                  Department membership is managed by an administrator in User Management.
                </p>
              )}
              <div>
                <label className="block font-semibold text-on-surface mb-1.5">Zone</label>
                <input
                  type="text"
                  value={editZone}
                  onChange={e => setEditZone(e.target.value)}
                  placeholder="e.g. East Zone"
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface text-on-surface outline-none focus:border-secondary"
                />
              </div>

              {editError && (
                <p className="text-[#ba1a1a] text-xs font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">error</span>{editError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowEdit(false)} className="px-3.5 py-2 rounded-lg bg-surface-container text-on-surface font-semibold hover:bg-surface-container-high transition-colors cursor-pointer text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-bold hover:bg-secondary/90 transition-colors shadow-xs disabled:opacity-60 cursor-pointer flex items-center gap-1.5 text-sm">
                  {saving ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
