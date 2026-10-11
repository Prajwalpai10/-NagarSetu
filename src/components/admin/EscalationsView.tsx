import React from 'react';
import { useApp } from '../../context/AppContext';
import { Complaint } from '../../types';

export const EscalationsView: React.FC = () => {
  const {
    complaints,
    complaintLoadError,
    isComplaintsLoading,
    refreshComplaints,
    setCurrentView,
  } = useApp();
  const exceptionalComplaints = complaints.filter(complaint =>
    complaint.status === 'Escalated' || complaint.slaBreached === true
  );
  const escalatedCount = exceptionalComplaints.filter(complaint => complaint.status === 'Escalated').length;
  const breachedCount = exceptionalComplaints.filter(complaint => complaint.slaBreached === true).length;

  const submittedAt = (complaint: Complaint) => {
    if (complaint.createdAt && Number.isFinite(Date.parse(complaint.createdAt))) {
      return new Date(complaint.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    }
    return complaint.reportedDate || 'Timestamp unavailable';
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 pb-12 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-secondary">Admin Portal</p>
          <h1 className="mt-1 text-2xl font-bold text-on-surface sm:text-3xl">Escalations &amp; Workflow</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            This list includes only accessible complaint records explicitly marked Escalated or SLA-breached. No timer, fine, or dispatch service is implied.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshComplaints()}
          disabled={isComplaintsLoading}
          className="rounded-lg border border-surface-container px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isComplaintsLoading ? 'Refreshing…' : 'Refresh records'}
        </button>
      </header>

      {complaintLoadError && (
        <section role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Escalation data is unavailable because complaint records could not be loaded.</p>
          <p className="mt-1">{complaintLoadError}</p>
        </section>
      )}

      <section aria-label="Escalation counts" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-surface-container bg-surface-container-lowest p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Currently Escalated</h2>
          <p className="mt-2 text-3xl font-bold text-on-surface">
            {complaintLoadError || (isComplaintsLoading && complaints.length === 0) ? '—' : escalatedCount}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">Based on current complaint status.</p>
        </article>
        <article className="rounded-xl border border-surface-container bg-surface-container-lowest p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Flagged SLA Breached</h2>
          <p className="mt-2 text-3xl font-bold text-on-surface">
            {complaintLoadError || (isComplaintsLoading && complaints.length === 0) ? '—' : breachedCount}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">Counts only records with a persisted breach flag.</p>
        </article>
      </section>

      {isComplaintsLoading && complaints.length === 0 ? (
        <p role="status" className="rounded-lg border border-surface-container p-5 text-sm">Loading complaint workflow records…</p>
      ) : !complaintLoadError && exceptionalComplaints.length === 0 ? (
        <p className="rounded-lg border border-surface-container bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
          No accessible complaints are currently marked Escalated or SLA-breached.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-container bg-surface-container-lowest">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Complaint ID</th>
                <th className="px-4 py-3">Category / description</th>
                <th className="px-4 py-3">Status / breach flag</th>
                <th className="px-4 py-3">Department / officer</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {exceptionalComplaints.map(complaint => (
                <tr key={complaint.id}>
                  <td className="px-4 py-3 font-mono text-xs">{complaint.id}</td>
                  <td className="max-w-sm px-4 py-3">
                    <p className="font-semibold">{complaint.category || 'Category unavailable'}</p>
                    <p className="mt-1 truncate text-xs text-on-surface-variant" title={complaint.description}>{complaint.description || 'Description unavailable'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{complaint.status || 'Status unavailable'}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{complaint.slaBreached === true ? 'SLA breach flagged' : 'No breach flag'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{complaint.department || 'Department unavailable'}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{complaint.assignedOfficer || 'Unassigned'}</p>
                  </td>
                  <td className="px-4 py-3">{submittedAt(complaint)}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setCurrentView('admin_complaints', { id: complaint.id })} className="font-semibold text-secondary hover:underline">
                      Open complaint
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};
