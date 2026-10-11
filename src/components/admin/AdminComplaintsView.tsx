import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient, AuthUser, DepartmentRecord } from '../../services/apiClient';
import {
  changeAssignmentComplaint,
  changeAssignmentDepartment,
  getAvailableDepartments,
  getEligibleOfficers,
} from '../../services/adminAssignmentOptions';
import { Complaint } from '../../types';
import { getViewFromPathname } from '../../routes';

const STATUS_OPTIONS: Complaint['status'][] = [
  'Submitted',
  'Assigned',
  'In Progress',
  'Resolved',
  'Closed',
  'Escalated',
];

function submittedAt(complaint: Complaint): string {
  if (complaint.createdAt) {
    const timestamp = Date.parse(complaint.createdAt);
    if (Number.isFinite(timestamp)) {
      return new Date(timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    }
  }
  return complaint.reportedDate || 'Timestamp unavailable';
}

function priorityBadgeClasses(priority: Complaint['priority']): string {
  if (priority === 'P1') return 'border-red-200 bg-red-100 text-red-800';
  if (priority === 'P2') return 'border-amber-200 bg-amber-100 text-amber-900';
  if (priority === 'P3') return 'border-blue-200 bg-blue-100 text-blue-800';
  return 'border-surface-container bg-surface-container text-on-surface-variant';
}

function statusBadgeClasses(status: Complaint['status']): string {
  if (status === 'Escalated') return 'border-red-200 bg-red-100 text-red-800';
  if (status === 'Resolved' || status === 'Closed') return 'border-emerald-200 bg-emerald-100 text-emerald-800';
  if (status === 'In Progress') return 'border-blue-200 bg-blue-100 text-blue-800';
  if (status === 'Assigned') return 'border-secondary/20 bg-secondary/10 text-secondary';
  return 'border-amber-200 bg-amber-50 text-amber-900';
}

export const AdminComplaintsView: React.FC = () => {
  const {
    complaints,
    complaintLoadError,
    isComplaintsLoading,
    refreshComplaints,
    setCurrentView,
    updateComplaintStatus,
  } = useApp();
  const location = useLocation();
  const selectedRouteId = getViewFromPathname(location.pathname).ticketId;
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('q') ?? '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<Complaint['status'] | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Complaint['priority'] | ''>('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [statusByComplaint, setStatusByComplaint] = useState<Record<string, Complaint['status']>>({});
  const [savingStatusFor, setSavingStatusFor] = useState('');

  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get('q') ?? '');
  }, [location.search]);

  const categories = useMemo(() => [...new Set(complaints.map(complaint => complaint.category).filter(Boolean))].sort(), [complaints]);
  const departments = useMemo(() => [...new Set(complaints.map(complaint => complaint.department).filter(Boolean))].sort(), [complaints]);
  const filteredComplaints = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return [...complaints]
      .filter(complaint => !normalizedQuery || [
        complaint.id,
        complaint.title,
        complaint.description,
        complaint.location,
      ].some(value => value.toLocaleLowerCase().includes(normalizedQuery)))
      .filter(complaint => !categoryFilter || complaint.category === categoryFilter)
      .filter(complaint => !statusFilter || complaint.status === statusFilter)
      .filter(complaint => !priorityFilter || complaint.priority === priorityFilter)
      .filter(complaint => !departmentFilter || complaint.department === departmentFilter)
      .sort((a, b) => {
        const aDate = Date.parse(a.createdAt ?? '');
        const bDate = Date.parse(b.createdAt ?? '');
        const difference = Number.isFinite(aDate) && Number.isFinite(bDate) ? aDate - bDate : 0;
        return sortOrder === 'newest' ? -difference : difference;
      });
  }, [complaints, query, categoryFilter, statusFilter, priorityFilter, departmentFilter, sortOrder]);

  const selectedComplaint = selectedRouteId
    ? complaints.find(complaint => complaint.id === selectedRouteId)
    : undefined;

  const handleStatusSave = async (complaint: Complaint) => {
    const nextStatus = statusByComplaint[complaint.id] ?? complaint.status;
    if (nextStatus === complaint.status || savingStatusFor) return;
    setSavingStatusFor(complaint.id);
    try {
      await updateComplaintStatus(complaint.id, nextStatus);
    } finally {
      setSavingStatusFor('');
    }
  };

  if (selectedRouteId) {
    if (isComplaintsLoading && !selectedComplaint) {
      return <p role="status" className="m-6 rounded-lg border border-surface-container p-5">Loading complaint details…</p>;
    }
    if (!selectedComplaint) {
      return (
        <section className="mx-auto max-w-3xl p-6">
          <button type="button" onClick={() => setCurrentView('admin_complaints')} className="mb-4 text-sm font-semibold text-secondary hover:underline">
            ← Back to complaints
          </button>
          <div role={complaintLoadError ? 'alert' : 'status'} className="rounded-xl border border-surface-container bg-surface-container-lowest p-5">
            <h1 className="font-bold text-on-surface">Complaint record unavailable</h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              {complaintLoadError
                ? `The complaint list could not be loaded: ${complaintLoadError}`
                : 'This complaint was not returned by the authorized API. It may not exist or may not be accessible to this account.'}
            </p>
            <button type="button" onClick={() => void refreshComplaints()} className="mt-4 text-sm font-semibold text-secondary hover:underline">
              Retry loading records
            </button>
          </div>
        </section>
      );
    }

    const nextStatus = statusByComplaint[selectedComplaint.id] ?? selectedComplaint.status;
    return (
      <main className="mx-auto w-full max-w-5xl space-y-5 p-4 pb-12 sm:p-6">
        <button type="button" onClick={() => setCurrentView('admin_complaints')} className="text-sm font-semibold text-secondary hover:underline">
          ← Complaint Management
        </button>
        <header>
          <p className="text-xs font-bold uppercase tracking-wide text-secondary">Complaint details</p>
          <h1 className="mt-1 break-all text-2xl font-bold text-on-surface">{selectedComplaint.id}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{selectedComplaint.title || 'Title unavailable'}</p>
        </header>
        <section className="grid grid-cols-1 gap-3 rounded-xl border border-surface-container bg-surface-container-lowest p-5 sm:grid-cols-2">
          <p><strong>Description:</strong> {selectedComplaint.description || 'Unavailable'}</p>
          <p><strong>Category:</strong> {selectedComplaint.category || 'Unavailable'}</p>
          <p><strong>Location:</strong> {selectedComplaint.location || 'Unavailable'}</p>
          <p><strong>Coordinates:</strong> {selectedComplaint.coordinates
            ? `${selectedComplaint.coordinates.lat}, ${selectedComplaint.coordinates.lng}`
            : 'Unavailable'}</p>
          <p><strong>Priority:</strong> {selectedComplaint.priority || 'Unavailable'}</p>
          <p><strong>Submitted:</strong> {submittedAt(selectedComplaint)}</p>
          <p><strong>Status:</strong> {selectedComplaint.status || 'Unavailable'}</p>
          <p><strong>Department:</strong> {selectedComplaint.department || 'Unavailable'}</p>
          <p><strong>Assigned officer:</strong> {selectedComplaint.assignedOfficer || 'Unassigned'}</p>
          <p><strong>Ward / zone:</strong> {[selectedComplaint.ward, selectedComplaint.zone].filter(Boolean).join(' / ') || 'Unavailable'}</p>
        </section>

        <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-5">
          <h2 className="text-lg font-bold text-on-surface">Status update</h2>
          <p className="mt-1 text-xs text-on-surface-variant">Status updates are saved through the existing API; invalid or unauthorized changes are rejected by the server.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="admin-complaint-status">New complaint status</label>
            <select
              id="admin-complaint-status"
              value={nextStatus}
              onChange={event => setStatusByComplaint(current => ({
                ...current,
                [selectedComplaint.id]: event.target.value as Complaint['status'],
              }))}
              className="rounded-lg border border-surface-container px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <button
              type="button"
              onClick={() => void handleStatusSave(selectedComplaint)}
              disabled={savingStatusFor.length > 0 || nextStatus === selectedComplaint.status}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary disabled:opacity-50"
            >
              {savingStatusFor === selectedComplaint.id ? 'Saving…' : 'Save status'}
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('admin_assignments', { id: selectedComplaint.id })}
              className="rounded-lg border border-surface-container px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container"
            >
              Manage assignment
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-5">
          <h2 className="text-lg font-bold text-on-surface">Evidence</h2>
          {selectedComplaint.photos.length ? (
            <ul className="mt-3 flex flex-wrap gap-3">
              {selectedComplaint.photos.map(photo => (
                <li key={photo}>
                  <a href={photo} target="_blank" rel="noreferrer" className="text-sm font-semibold text-secondary underline">
                    Open attachment
                  </a>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sm text-on-surface-variant">No evidence is attached to this complaint.</p>}
        </section>

        <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-5">
          <h2 className="text-lg font-bold text-on-surface">Status history</h2>
          {selectedComplaint.statusHistory?.length ? (
            <ol className="mt-3 space-y-3">
              {selectedComplaint.statusHistory.map((entry, index) => (
                <li key={`${entry.changedAt}-${entry.status}-${index}`} className="border-l-2 border-secondary pl-3">
                  <p className="text-sm font-semibold text-on-surface">{entry.status}</p>
                  <p className="text-xs text-on-surface-variant">
                    {Number.isFinite(Date.parse(entry.changedAt))
                      ? new Date(entry.changedAt).toLocaleString('en-IN')
                      : 'Timestamp unavailable'}
                    {entry.note ? ` — ${entry.note}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          ) : <p className="mt-2 text-sm text-on-surface-variant">Status history is unavailable.</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 pb-12 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-secondary">Admin Portal</p>
          <h1 className="mt-1 text-2xl font-bold text-on-surface sm:text-3xl">Complaint Management</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Search and manage records returned to this administrator by the shared complaint API.</p>
        </div>
        <button
          type="button"
          onClick={() => void refreshComplaints()}
          disabled={isComplaintsLoading}
          className="rounded-lg border border-surface-container px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isComplaintsLoading ? 'Loading…' : 'Refresh records'}
        </button>
      </header>

      {complaintLoadError && complaints.length === 0 ? (
        <section role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Complaint records are unavailable.</p>
          <p className="mt-1">{complaintLoadError}</p>
          <button
            type="button"
            onClick={() => void refreshComplaints()}
            disabled={isComplaintsLoading}
            className="mt-3 rounded-lg border border-red-300 px-3 py-2 font-semibold hover:bg-red-100 disabled:opacity-60"
          >
            {isComplaintsLoading ? 'Retrying…' : 'Retry loading records'}
          </button>
        </section>
      ) : (
        <>
          {complaintLoadError && (
            <section role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">Could not refresh complaint records.</p>
              <p className="mt-1">{complaintLoadError} Previously loaded records remain visible.</p>
            </section>
          )}
          {isComplaintsLoading && complaints.length === 0 ? (
            <p role="status" className="rounded-lg border border-surface-container p-5 text-sm">Loading complaint records…</p>
          ) : !complaintLoadError && complaints.length === 0 ? (
            <p className="rounded-lg border border-surface-container p-5 text-sm text-on-surface-variant">
              No complaints are currently available to this administrator.
            </p>
          ) : (
            <>
          <section aria-label="Complaint filters" className="grid grid-cols-1 gap-3 rounded-xl border border-surface-container bg-surface-container-lowest p-4 sm:grid-cols-2 xl:grid-cols-6">
            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">Search ID, description, or location</span>
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                className="w-full rounded-lg border border-surface-container px-3 py-2 text-sm"
                placeholder="Complaint ID or keyword"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">Category</span>
              <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="w-full rounded-lg border border-surface-container px-2 py-2 text-sm">
                <option value="">All categories</option>
                {categories.map(category => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">Status</span>
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as Complaint['status'] | '')} className="w-full rounded-lg border border-surface-container px-2 py-2 text-sm">
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map(status => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">Priority</span>
              <select value={priorityFilter} onChange={event => setPriorityFilter(event.target.value as Complaint['priority'] | '')} className="w-full rounded-lg border border-surface-container px-2 py-2 text-sm">
                <option value="">All priorities</option>
                {(['P1', 'P2', 'P3', 'P4'] as const).map(priority => <option key={priority}>{priority}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">Department</span>
              <select value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value)} className="w-full rounded-lg border border-surface-container px-2 py-2 text-sm">
                <option value="">All departments</option>
                {departments.map(department => <option key={department}>{department}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">Sort</span>
              <select value={sortOrder} onChange={event => setSortOrder(event.target.value as 'newest' | 'oldest')} className="w-full rounded-lg border border-surface-container px-2 py-2 text-sm">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </section>

          <p role="status" className="text-sm text-on-surface-variant">
            Showing {filteredComplaints.length} of {complaints.length} API-visible complaint records.
          </p>
          {filteredComplaints.length === 0 ? (
            <p className="rounded-lg border border-surface-container p-5 text-sm text-on-surface-variant">
              No accessible complaints match the current search and filters. Clear a filter or try another search.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-surface-container bg-surface-container-lowest">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3">Complaint ID</th>
                    <th className="px-4 py-3">Category / description</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Priority / status</th>
                    <th className="px-4 py-3">Department / assignee</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {filteredComplaints.map(complaint => (
                    <tr key={complaint.id}>
                      <td className="px-4 py-3 font-mono text-xs">{complaint.id}</td>
                      <td className="max-w-xs px-4 py-3">
                        <p className="font-semibold">{complaint.category || 'Category unavailable'}</p>
                        <p className="mt-1 truncate text-xs text-on-surface-variant" title={complaint.description}>{complaint.description || 'Description unavailable'}</p>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3" title={complaint.location}>{complaint.location || 'Location unavailable'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${priorityBadgeClasses(complaint.priority)}`}>{complaint.priority}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClasses(complaint.status)}`}>{complaint.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p>{complaint.department || 'Department unavailable'}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{complaint.assignedOfficer || 'Unassigned'}</p>
                      </td>
                      <td className="px-4 py-3">{submittedAt(complaint)}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setCurrentView('admin_complaints', { id: complaint.id })} className="font-semibold text-secondary hover:underline">
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
              </>
            )}
          </>
        )}
    </main>
  );
};

export const AdminAssignmentsView: React.FC = () => {
  const { complaints, complaintLoadError, isComplaintsLoading, refreshComplaints, assignComplaintToOfficer } = useApp();
  const { user } = useAuth();
  const location = useLocation();
  const routeComplaintId = getViewFromPathname(location.pathname).ticketId ?? '';
  const [officers, setOfficers] = useState<AuthUser[]>([]);
  const [departmentRecords, setDepartmentRecords] = useState<DepartmentRecord[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [officerError, setOfficerError] = useState('');
  const [complaintId, setComplaintId] = useState(routeComplaintId);
  const [officerId, setOfficerId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const savingAssignmentRef = useRef(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    setComplaintId(routeComplaintId);
    setOfficerId('');
    setSaveError('');
    setSaveSuccess('');
  }, [routeComplaintId]);

  useEffect(() => {
    let active = true;
    setOfficersLoading(true);
    void Promise.all([apiClient.adminGetUsers(), apiClient.adminGetDepartments()]).then(([usersResult, departmentsResult]) => {
      if (!active) return;
      const errors = [
        usersResult.error ?? (!usersResult.data ? 'The user service returned an invalid response.' : ''),
        departmentsResult.error ?? (!departmentsResult.data ? 'The department service returned an invalid response.' : ''),
      ].filter(Boolean);
      if (errors.length) {
        setOfficerError(errors.join(' '));
        setOfficers([]);
        setDepartmentRecords([]);
      } else {
        setOfficerError('');
        setOfficers(usersResult.data!.users.filter(account => account.role === 'officer' && account.status === 'active'));
        setDepartmentRecords(departmentsResult.data!.departments);
      }
      setOfficersLoading(false);
    });
    return () => { active = false; };
  }, []);

  const complaint = complaints.find(record => record.id === complaintId);
  const departments = getAvailableDepartments(departmentRecords);
  const [departmentId, setDepartmentId] = useState('');
  const selectedDepartment = departments.find(item => item.id === departmentId);
  const availableOfficers = getEligibleOfficers(officers, departmentId);

  useEffect(() => {
    setDepartmentId(complaint?.departmentId && departments.some(item => item.id === complaint.departmentId)
      ? complaint.departmentId
      : '');
    setOfficerId('');
  }, [complaint?.id, complaint?.departmentId, departments.map(item => item.id).join('|')]);

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError('');
    if (!complaint || !selectedDepartment || !officerId || isSaving || savingAssignmentRef.current) {
      setSaveError('Select an accessible complaint, department, and active officer before saving.');
      return;
    }
    const selectedOfficer = availableOfficers.find(officer => officer.id === officerId);
    if (!selectedOfficer || selectedOfficer.departmentId !== selectedDepartment.id) {
      setSaveError('The selected officer is not an active member of the selected department.');
      return;
    }
    if (complaint.assignedOfficer === selectedOfficer.name && complaint.departmentId === selectedDepartment.id) {
      setSaveError('This complaint is already assigned to the selected officer and department.');
      return;
    }
    savingAssignmentRef.current = true;
    setIsSaving(true);
    try {
      const saved = await assignComplaintToOfficer(complaint.id, selectedOfficer.id, selectedDepartment.id);
      if (!saved) setSaveError('The assignment was not saved. Review the server message and try again.');
      else setSaveSuccess(`Saved: ${selectedDepartment.name} · ${selectedOfficer.name}`);
    } finally {
      savingAssignmentRef.current = false;
      setIsSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return <section role="alert" className="m-6 rounded-lg border border-red-300 bg-red-50 p-5 text-sm text-red-900">Administrator access is required to assign complaints.</section>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-12 sm:p-7 lg:p-9">
      <header className="rounded-2xl bg-secondary px-6 py-7 text-on-secondary shadow-sm sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/75">Admin Portal / Assignment tracking</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Assign a complaint</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85">Choose a complaint, route it to an active department, select one of its active officers, then review before saving.</p>
        <p className="mt-4 text-xs text-white/70">{complaints.length} complaint records available to this administrator</p>
      </header>
      <ol aria-label="Assignment steps" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {['Select complaint', 'Select department', 'Select eligible officer', 'Review and save'].map((step, index) => (
          <li key={step} className="flex items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3 text-sm font-semibold text-on-surface shadow-sm">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-on-secondary">{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      {(complaintLoadError || officerError) && (
        <section role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          {complaintLoadError && <p>Complaint service: {complaintLoadError}</p>}
          {officerError && <p>Officer directory: {officerError}</p>}
        </section>
      )}
      {complaintLoadError && (
        <button type="button" onClick={() => void refreshComplaints()} className="text-sm font-semibold text-secondary hover:underline">
          Retry complaint list
        </button>
      )}
      {officerError && (
        <button
          type="button"
          onClick={() => {
            setOfficerError('');
            setOfficersLoading(true);
            void Promise.all([apiClient.adminGetUsers(), apiClient.adminGetDepartments()]).then(([usersResult, departmentsResult]) => {
              const errors = [
                usersResult.error ?? (!usersResult.data ? 'The user service returned an invalid response.' : ''),
                departmentsResult.error ?? (!departmentsResult.data ? 'The department service returned an invalid response.' : ''),
              ].filter(Boolean);
              if (errors.length) {
                setOfficerError(errors.join(' '));
                setOfficers([]);
                setDepartmentRecords([]);
              } else {
                setOfficerError('');
                setOfficers(usersResult.data!.users.filter(account => account.role === 'officer' && account.status === 'active'));
                setDepartmentRecords(departmentsResult.data!.departments);
              }
              setOfficersLoading(false);
            });
          }}
          className="text-sm font-semibold text-secondary hover:underline"
        >
          Retry officer directory
        </button>
      )}
      {isComplaintsLoading && complaints.length === 0 ? (
        <p role="status" className="rounded-lg border border-surface-container p-5 text-sm">Loading complaint records…</p>
      ) : complaintLoadError ? null : complaints.length === 0 ? (
        <p className="rounded-lg border border-surface-container p-5 text-sm text-on-surface-variant">No complaints are currently available for assignment.</p>
      ) : (
        <form onSubmit={event => void handleAssign(event)} className="space-y-5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm sm:p-7">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-on-surface">1. Complaint</span>
            <select
              id="assignment-complaint"
              value={complaintId}
              onChange={event => {
                const selection = changeAssignmentComplaint(event.target.value);
                setComplaintId(selection.complaintId);
                setDepartmentId(selection.departmentId);
                setOfficerId(selection.officerId);
                setSaveError('');
                setSaveSuccess('');
              }}
              required
              className="w-full rounded-xl border border-outline-variant/70 bg-white px-4 py-3 text-sm shadow-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            >
              <option value="">Select a complaint</option>
              {complaints.map(record => (
                <option key={record.id} value={record.id}>{record.id} — {record.title || record.description || 'Complaint'}</option>
              ))}
            </select>
          </label>
          {complaint && (
            <section className="grid gap-3 rounded-xl border border-outline-variant/50 bg-surface-container-low p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <p><strong>Category</strong><span className="mt-1 block">{complaint.category || 'Unavailable'}</span></p>
              <p><strong>Priority</strong><span className="mt-1 block">{complaint.priority || 'Unavailable'}</span></p>
              <p><strong>Location</strong><span className="mt-1 block">{complaint.location || 'Unavailable'}</span></p>
              <p><strong>Current status</strong><span className="mt-1 block">{complaint.status || 'Unavailable'}</span></p>
              <p><strong>Current department</strong><span className="mt-1 block">{complaint.department || 'Unassigned'}</span></p>
              <p><strong>Current officer</strong><span className="mt-1 block">{complaint.assignedOfficer || 'Unassigned'}</span></p>
            </section>
          )}
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-on-surface">2. Active department</span>
            <select
              value={departmentId}
              onChange={event => {
                const selection = changeAssignmentDepartment(event.target.value);
                setDepartmentId(selection.departmentId);
                setOfficerId(selection.officerId);
                setSaveError('');
                setSaveSuccess('');
              }}
              required
              disabled={officersLoading || departments.length === 0 || Boolean(officerError)}
              className="w-full rounded-xl border border-outline-variant/70 bg-white px-4 py-3 text-sm shadow-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:opacity-60"
            >
              <option value="">{officersLoading ? 'Loading departments…' : 'Select an active department'}</option>
              {departments.map(value => <option key={value.id} value={value.id}>{value.name}</option>)}
            </select>
            {!officersLoading && !officerError && departments.length === 0 && (
              <span className="mt-1 block text-xs text-on-surface-variant">No active departments are configured. Add or activate a department in User Management.</span>
            )}
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-on-surface">3. Eligible active officer</span>
            <select
              value={officerId}
              onChange={event => setOfficerId(event.target.value)}
              required
              disabled={officersLoading || !departmentId || availableOfficers.length === 0 || Boolean(officerError)}
              className="w-full rounded-xl border border-outline-variant/70 bg-white px-4 py-3 text-sm shadow-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:opacity-60"
            >
              <option value="">{officersLoading ? 'Loading officers…' : !departmentId ? 'Select a department first' : 'Select an eligible active officer'}</option>
              {availableOfficers.map(officer => (
                <option key={officer.id} value={officer.id}>{officer.name} — {officer.email}</option>
              ))}
            </select>
            {!officersLoading && !officerError && officers.length === 0 && (
              <span className="mt-1 block text-xs text-on-surface-variant">No active officers are available. No assignment can be made.</span>
            )}
            {!officersLoading && !officerError && departmentId && availableOfficers.length === 0 && (
              <span className="mt-1 block text-xs text-on-surface-variant">No active officer is currently listed in this department.</span>
            )}
          </label>
          {complaint && selectedDepartment && officerId && (
            <section aria-label="Assignment review" className="rounded-xl border border-secondary/30 bg-secondary/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-secondary">4. Review before saving</p>
              <p className="mt-2 text-sm text-on-surface">
                <strong>{complaint.id}</strong> → {selectedDepartment.name} → {availableOfficers.find(officer => officer.id === officerId)?.name}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">Saving updates the existing complaint record and assignment status through the authorized API.</p>
            </section>
          )}
          {saveError && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">{saveError}</p>}
          {saveSuccess && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{saveSuccess}. The saved values are now shown in the complaint record.</p>}
          <div className="flex flex-col gap-3 border-t border-surface-container pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-on-surface-variant">Submitted complaints move to Assigned. Other current statuses are retained.</p>
            <button
              type="submit"
              disabled={isSaving || officersLoading || !complaint || !selectedDepartment || !officerId || Boolean(officerError)}
              className="rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-on-secondary shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving assignment…' : 'Save assignment'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
};
