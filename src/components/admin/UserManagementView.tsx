import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { apiClient, AuthUser, DepartmentRecord } from '../../services/apiClient';

// ── Status badge helper ────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active'   ? 'bg-emerald-100 text-emerald-800' :
    status === 'pending'  ? 'bg-amber-100 text-amber-800' :
    status === 'suspended'? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-800';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cls}`}>
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === 'admin'   ? 'text-secondary font-bold' :
    role === 'officer' ? 'text-primary font-bold' :
                         'text-on-surface-variant';
  return <span className={`font-mono text-xs ${cls}`}>{role.toUpperCase()}</span>;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export const UserManagementView: React.FC = () => {
  const { showToast } = useApp();

  // ── Backend user state ──────────────────────────────────────────────────────
  const [apiUsers, setApiUsers] = useState<AuthUser[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [departmentRecords, setDepartmentRecords] = useState<DepartmentRecord[]>([]);
  const [departmentError, setDepartmentError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [departmentSaving, setDepartmentSaving] = useState(false);
  const [membershipDepartmentId, setMembershipDepartmentId] = useState('');
  const [membershipSaving, setMembershipSaving] = useState(false);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'officer' | 'admin' | 'citizen'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended' | 'disabled'>('all');

  // ── Provision modal state ────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'officer' as 'officer' | 'admin',
    departmentId: '',
    zone: 'East Zone',
    temporaryPassword: '',
  });

  // ── Load users from backend ─────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setApiLoading(true);
    setApiError('');
    const [usersResult, departmentsResult] = await Promise.all([
      apiClient.adminGetUsers(),
      apiClient.adminGetDepartments(),
    ]);
    if (usersResult.error || !usersResult.data) {
      setApiError(usersResult.error ?? 'The user directory returned an invalid response.');
    } else {
      setApiUsers(usersResult.data.users);
      if (!selectedUserId && usersResult.data.users.length > 0) {
        setSelectedUserId(usersResult.data.users[0].id);
      }
    }
    if (departmentsResult.error || !departmentsResult.data) {
      setDepartmentError(departmentsResult.error ?? 'The department directory returned an invalid response.');
    } else {
      setDepartmentError('');
      setDepartmentRecords(departmentsResult.data.departments);
    }
    setApiLoading(false);
  }, [selectedUserId]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filteredUsers = apiUsers.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q) &&
        !(u.department ?? '').toLowerCase().includes(q) &&
        !(u.zone ?? '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const selectedUser = apiUsers.find(u => u.id === selectedUserId) ?? apiUsers[0];
  const activeDepartments = departmentRecords.filter(department => department.status === 'active');

  useEffect(() => {
    const matchedDepartment = selectedUser?.departmentId
      ?? departmentRecords.find(department => department.name === selectedUser?.department)?.id
      ?? '';
    setMembershipDepartmentId(matchedDepartment);
  }, [selectedUser?.id, selectedUser?.departmentId, selectedUser?.department, departmentRecords]);

  // ── Status change ───────────────────────────────────────────────────────────
  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended' | 'disabled') => {
    const result = await apiClient.adminUpdateStatus(userId, newStatus);
    if (result.error) {
      showToast('Error', result.error, 'error', 'error');
    } else {
      showToast('Account Updated', `Account status changed to ${newStatus}.`);
      loadUsers();
    }
  };

  // ── Approve pending officer ─────────────────────────────────────────────────
  const handleApprove = async (userId: string, name: string) => {
    const result = await apiClient.adminApproveOfficer(userId);
    if (result.error) {
      showToast('Error', result.error, 'error', 'error');
    } else {
      showToast('Officer Approved', `${name} is now active.`);
      loadUsers();
    }
  };

  // ── Provision new officer/admin ─────────────────────────────────────────────
  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newUser.name.trim()) { setFormError('Name is required.'); return; }
    if (!newUser.email.trim()) { setFormError('Email is required.'); return; }
    if (!newUser.temporaryPassword) { setFormError('Temporary password is required.'); return; }
    if (newUser.role === 'officer' && !activeDepartments.some(department => department.id === newUser.departmentId)) {
      setFormError('Select an active department for the officer.');
      return;
    }

    setSaving(true);
    const result = await apiClient.adminProvisionUser({
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      ...(newUser.role === 'officer' ? { departmentId: newUser.departmentId } : {}),
      zone: newUser.zone,
      temporaryPassword: newUser.temporaryPassword,
    });
    setSaving(false);

    if (result.error) {
      setFormError(result.error);
    } else {
      showToast(
        'Account Provisioned',
        `${newUser.name} provisioned as ${newUser.role}. ${newUser.role === 'officer' ? 'Pending approval.' : 'Active.'}`
      );
      setShowAddModal(false);
      setNewUser({ name: '', email: '', role: 'officer', departmentId: '', zone: 'East Zone', temporaryPassword: '' });
      loadUsers();
    }
  };

  const handleCreateDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    setDepartmentSaving(true);
    const result = await apiClient.adminCreateDepartment(newDepartmentName);
    setDepartmentSaving(false);
    if (result.error || !result.data) {
      setDepartmentError(result.error ?? 'The department was not created.');
      return;
    }
    setDepartmentRecords(current => [...current.filter(item => item.id !== result.data!.department.id), result.data!.department]);
    setDepartmentError('');
    setNewDepartmentName('');
    showToast('Department Created', `${result.data.department.name} is available for officer membership.`);
  };

  const handleDepartmentStatus = async (department: DepartmentRecord) => {
    const status = department.status === 'active' ? 'inactive' : 'active';
    const result = await apiClient.adminUpdateDepartmentStatus(department.id, status);
    if (result.error || !result.data) {
      setDepartmentError(result.error ?? 'The department status was not updated.');
      return;
    }
    setDepartmentRecords(current => current.map(item => item.id === department.id ? result.data!.department : item));
    setDepartmentError('');
    showToast('Department Updated', `${department.name} is now ${status}.`);
  };

  const handleOfficerDepartmentSave = async () => {
    if (!selectedUser || selectedUser.role !== 'officer' || membershipSaving) return;
    if (!activeDepartments.some(department => department.id === membershipDepartmentId)) {
      setDepartmentError('Choose an active department before saving officer membership.');
      return;
    }
    setMembershipSaving(true);
    const result = await apiClient.adminSetOfficerDepartment(selectedUser.id, membershipDepartmentId);
    setMembershipSaving(false);
    if (result.error || !result.data) {
      setDepartmentError(result.error ?? 'Officer department membership was not saved.');
      return;
    }
    setApiUsers(current => current.map(user => user.id === selectedUser.id ? result.data!.user : user));
    setDepartmentError('');
    showToast('Officer Department Saved', `Department membership updated for ${result.data.user.name}.`);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      {/* Header Banner */}
      <div className="bg-surface border-b border-outline-variant/30 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">groups</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">Departments &amp; Officers</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-surface-container text-on-surface font-mono">
              LIVE BACKEND
            </span>
          </div>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Manage the authoritative department registry and existing officer memberships without changing account credentials or roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadUsers}
            disabled={apiLoading}
            title="Refresh user list"
            className="p-2 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30 transition-colors cursor-pointer"
          >
            <span className={`material-symbols-outlined text-sm ${apiLoading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-secondary text-on-secondary font-bold rounded-lg text-xs hover:bg-secondary/90 transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Provision New Officer
          </button>
        </div>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/30 flex items-center gap-3 text-sm text-[#93000a]">
          <span className="material-symbols-outlined text-base">wifi_off</span>
          <span><strong>Backend error:</strong> {apiError} — Make sure the API server is running with <code className="font-mono text-xs bg-black/10 px-1 rounded">npm run server:dev</code></span>
        </div>
      )}

      <section className="mx-6 mt-4 rounded-xl border border-outline-variant/30 bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-headline-md text-base font-bold text-on-surface">Department Registry</h2>
            <p className="mt-1 text-xs text-on-surface-variant">Active departments are available for officer membership and complaint assignment. Adding a department does not create an officer account.</p>
          </div>
          <form onSubmit={event => void handleCreateDepartment(event)} className="flex w-full max-w-lg gap-2">
            <label className="sr-only" htmlFor="admin-new-department">New department name</label>
            <input
              id="admin-new-department"
              value={newDepartmentName}
              onChange={event => setNewDepartmentName(event.target.value)}
              required
              minLength={2}
              maxLength={120}
              placeholder="Enter a configured department name"
              className="min-w-0 flex-1 rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={departmentSaving || newDepartmentName.trim().length < 2}
              className="rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-on-secondary disabled:opacity-50"
            >
              {departmentSaving ? 'Adding…' : 'Add department'}
            </button>
          </form>
        </div>
        {departmentError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-900">{departmentError}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {departmentRecords.map(department => (
            <div key={department.id} className="flex items-center gap-2 rounded-lg border border-outline-variant/30 px-3 py-2 text-sm">
              <span className="font-medium text-on-surface">{department.name}</span>
              <StatusBadge status={department.status} />
              <button
                type="button"
                onClick={() => void handleDepartmentStatus(department)}
                className="text-xs font-semibold text-secondary hover:underline"
              >
                {department.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
          {!apiLoading && departmentRecords.length === 0 && !departmentError && (
            <p className="text-sm text-on-surface-variant">No departments are configured yet.</p>
          )}
        </div>
      </section>

      {/* Filter Ribbon */}
      <div className="bg-surface-container-low px-6 py-3 border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, dept, zone..."
              className="w-full bg-surface pl-8 pr-3 py-1.5 rounded-lg border border-outline-variant/40 text-on-surface outline-none focus:border-secondary"
            />
          </div>

          <div className="flex items-center bg-surface rounded-lg p-0.5 border border-outline-variant/40">
            {(['all', 'officer', 'admin', 'citizen'] as const).map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize ${
                  roleFilter === role ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {role === 'all' ? 'All' : role}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-surface rounded-lg p-0.5 border border-outline-variant/40">
            {(['all', 'active', 'pending', 'suspended', 'disabled'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize ${
                  statusFilter === s ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        <div className="text-on-surface-variant font-mono">
          Showing <strong>{filteredUsers.length}</strong> of {apiUsers.length} accounts
        </div>
      </div>

      {/* Main: Directory + Detail Panel */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: User Directory */}
        <div className="lg:col-span-7 bg-surface rounded-xl border border-outline-variant/30 shadow-xs flex flex-col">
          <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
            <h2 className="font-headline-md text-base font-bold text-on-surface">Personnel Directory</h2>
            <span className="text-xs text-on-surface-variant font-mono">
              {apiLoading ? 'Loading…' : 'Live API data'}
            </span>
          </div>

          {apiLoading && (
            <div className="flex items-center justify-center py-12 gap-3 text-on-surface-variant text-sm">
              <span className="w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
              Loading users from server…
            </div>
          )}

          {!apiLoading && filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-3xl">person_off</span>
              {apiError ? 'Backend offline – no users loaded' : 'No users match the current filters'}
            </div>
          )}

          <div className="divide-y divide-outline-variant/20 overflow-y-auto max-h-[600px]">
            {filteredUsers.map((user) => {
              const isSelected = selectedUserId === user.id;
              const initials = user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`p-4 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-secondary-container/20 border-l-4 border-l-secondary' : 'hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline-md font-bold text-sm text-on-surface">{user.name}</span>
                        <StatusBadge status={user.status} />
                        {user.status === 'pending' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApprove(user.id, user.name); }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary text-on-secondary hover:bg-secondary/90 cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        <span className="font-mono">{user.email}</span>
                      </div>
                      <div className="text-[11px] text-on-surface mt-1 font-medium">
                        {user.department ?? '—'} • {user.zone ?? '—'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0 text-xs gap-1">
                    <RoleBadge role={user.role} />
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detail / Action Panel */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {selectedUser ? (
            <div className="bg-surface rounded-xl border border-outline-variant/30 p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-lg">
                    {selectedUser.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-headline-md text-base font-bold text-on-surface">{selectedUser.name}</h3>
                    <div className="text-xs text-secondary font-semibold mt-0.5">
                      <RoleBadge role={selectedUser.role} />
                    </div>
                    <div className="text-xs text-on-surface-variant mt-0.5 font-mono">{selectedUser.email}</div>
                  </div>
                </div>
                <StatusBadge status={selectedUser.status} />
              </div>

              {/* Jurisdiction Details */}
              <div className="mt-4 p-3 bg-surface-container rounded-xl border border-outline-variant/20 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Department:</span>
                  <span className="font-medium text-on-surface">{selectedUser.department ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Zone:</span>
                  <span className="font-medium text-on-surface">{selectedUser.zone ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Assigned Wards:</span>
                  <span className="font-mono text-on-surface">{selectedUser.assignedWards?.join(', ') || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Member since:</span>
                  <span className="text-on-surface">
                    {new Date(selectedUser.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {selectedUser.role === 'officer' && (
                <section className="mt-4 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-on-surface">Officer Department Membership</h4>
                  <p className="mt-1 text-xs text-on-surface-variant">Choose the correct department explicitly. This updates department membership only; credentials and role are unchanged.</p>
                  <label className="mt-3 block">
                    <span className="mb-1 block text-xs font-semibold text-on-surface">Department</span>
                    <select
                      value={membershipDepartmentId}
                      onChange={event => setMembershipDepartmentId(event.target.value)}
                      disabled={activeDepartments.length === 0 || membershipSaving}
                      className="w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 text-sm disabled:opacity-60"
                    >
                      <option value="">Select an active department</option>
                      {activeDepartments.map(department => (
                        <option key={department.id} value={department.id}>{department.name}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleOfficerDepartmentSave()}
                    disabled={membershipSaving || !membershipDepartmentId || selectedUser.departmentId === membershipDepartmentId}
                    className="mt-2 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-on-secondary disabled:opacity-50"
                  >
                    {membershipSaving ? 'Saving membership…' : 'Save department membership'}
                  </button>
                </section>
              )}

              {/* RBAC summary */}
              <div className="mt-4">
                <div className="text-xs font-semibold text-on-surface uppercase font-label-caps tracking-wider mb-2">
                  Effective Permissions
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'View Operations Map & GIS Telemetry', allowed: true },
                    { label: 'Resolve Complaints & Upload Verification Photos', allowed: selectedUser.role !== 'citizen' },
                    { label: 'Execute Emergency SLA Escalations', allowed: selectedUser.role === 'admin' },
                    { label: 'Manage Users & Provision Accounts', allowed: selectedUser.role === 'admin' },
                  ].map(({ label, allowed }) => (
                    <div key={label} className="flex items-center gap-2 p-2 rounded bg-surface-container-low border border-outline-variant/20">
                      <span className={`material-symbols-outlined text-sm ${allowed ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        {allowed ? 'check_circle' : 'cancel'}
                      </span>
                      <span className={allowed ? 'text-on-surface' : 'text-on-surface-variant line-through'}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Actions */}
              <div className="mt-5 space-y-2">
                {selectedUser.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange(selectedUser.id, 'suspended')}
                    className="w-full py-2 px-3 rounded-lg bg-[#ffdad6] text-[#93000a] hover:brightness-95 border border-[#ba1a1a]/20 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">person_off</span>
                    Suspend Account
                  </button>
                )}
                {selectedUser.status === 'suspended' && (
                  <button
                    onClick={() => handleStatusChange(selectedUser.id, 'active')}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-100 text-emerald-800 hover:brightness-95 border border-emerald-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">person_check</span>
                    Reinstate Account
                  </button>
                )}
                {selectedUser.status === 'pending' && (
                  <button
                    onClick={() => handleApprove(selectedUser.id, selectedUser.name)}
                    className="w-full py-2 px-3 rounded-lg bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">how_to_reg</span>
                    Approve & Activate Officer
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-outline-variant/30 p-10 text-center text-on-surface-variant text-sm shadow-xs">
              Select a user to view their profile and manage access.
            </div>
          )}
        </div>
      </div>

      {/* Provision New Officer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-2xl max-w-md w-full border border-outline-variant/30 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">person_add</span>
                <h3 className="font-headline-md font-bold text-base text-on-surface">Provision Municipal Personnel</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setFormError(''); }}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleProvision} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-on-surface mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Er. Anand Kumar"
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface text-on-surface outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="officer@bbmp.gov.in"
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface text-on-surface outline-none focus:border-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Account Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'officer' | 'admin' })}
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface text-on-surface outline-none focus:border-secondary"
                  >
                    <option value="officer">Ops Field Officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Zone</label>
                  <select
                    value={newUser.zone}
                    onChange={(e) => setNewUser({ ...newUser, zone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface text-on-surface outline-none focus:border-secondary"
                  >
                    {['East Zone', 'West Zone', 'North Zone', 'South Zone', 'Central Zone', 'All Zones'].map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Municipal Department</label>
                <select
                  value={newUser.departmentId}
                  onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value })}
                  required={newUser.role === 'officer'}
                  disabled={newUser.role !== 'officer' || activeDepartments.length === 0}
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface text-on-surface outline-none focus:border-secondary"
                >
                  <option value="">{activeDepartments.length ? 'Select an active department' : 'No active departments configured'}</option>
                  {activeDepartments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
                {newUser.role === 'officer' && activeDepartments.length === 0 && (
                  <p className="mt-1 text-xs text-on-surface-variant">Create or activate a department in the registry before provisioning an officer.</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">
                  Temporary Password *
                  <span className="font-normal text-on-surface-variant ml-1">(min 8 chars, uppercase, digit)</span>
                </label>
                <input
                  type="password"
                  required
                  value={newUser.temporaryPassword}
                  onChange={(e) => setNewUser({ ...newUser, temporaryPassword: e.target.value })}
                  placeholder="Temp@Password123"
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface text-on-surface outline-none focus:border-secondary"
                />
                <p className="text-on-surface-variant mt-1">
                  Share securely with the officer. They should change it on first login.
                </p>
              </div>

              {newUser.role === 'officer' && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Officer accounts start as <strong>Pending</strong> and must be approved before they can log in.
                </div>
              )}

              {formError && (
                <p className="text-[#ba1a1a] font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {formError}
                </p>
              )}

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setFormError(''); }}
                  className="px-3.5 py-2 rounded-lg bg-surface-container text-on-surface font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-bold hover:bg-secondary/90 transition-colors shadow-xs disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                >
                  {saving ? (
                    <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Provisioning…</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">how_to_reg</span>Provision Account</>
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
