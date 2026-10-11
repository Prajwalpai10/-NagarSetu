import React from 'react';
import { useApp } from '../../context/AppContext';
import { Complaint } from '../../types';

function formatSubmittedAt(complaint: Complaint): string {
  if (complaint.createdAt) {
    const timestamp = Date.parse(complaint.createdAt);
    if (Number.isFinite(timestamp)) {
      return new Date(timestamp).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
  }
  return complaint.reportedDate || 'Timestamp unavailable';
}

export const CommandCenterView: React.FC = () => {
  const {
    complaints,
    isComplaintsLoading,
    complaintLoadError,
    refreshComplaints,
    setCurrentView,
  } = useApp();

  const submittedCount = complaints.filter(complaint => complaint.status === 'Submitted').length;
  const inProgressCount = complaints.filter(complaint => complaint.status === 'In Progress').length;
  const resolvedCount = complaints.filter(complaint =>
    complaint.status === 'Resolved' || complaint.status === 'Closed'
  ).length;
  const openP1Count = complaints.filter(complaint =>
    complaint.priority === 'P1' && complaint.status !== 'Resolved' && complaint.status !== 'Closed'
  ).length;
  const recentComplaints = [...complaints]
    .sort((a, b) => Date.parse(b.createdAt ?? '') - Date.parse(a.createdAt ?? ''))
    .slice(0, 8);
  const metrics = [
    { label: 'Total complaints', value: complaints.length, detail: 'Records available to this administrator' },
    { label: 'Submitted', value: submittedCount, detail: 'Awaiting assignment or initial review' },
    { label: 'In progress', value: inProgressCount, detail: 'Current status from complaint records' },
    { label: 'Resolved or closed', value: resolvedCount, detail: 'Counts both final statuses once per record' },
    { label: 'Open P1 priority', value: openP1Count, detail: 'P1 records not resolved or closed' },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 pb-12 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">Admin Portal</p>
          <h1 className="mt-1 text-2xl font-bold text-on-surface sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Operational counts are calculated from complaint records returned by the authorized API.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refreshComplaints()}
            disabled={isComplaintsLoading}
            className="rounded-lg border border-surface-container px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container disabled:opacity-60"
          >
            {isComplaintsLoading ? 'Refreshing…' : 'Refresh records'}
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('admin_complaints')}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary"
          >
            Manage complaints
          </button>
        </div>
      </header>

      {complaintLoadError && (
        <section role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Complaint records could not be loaded.</p>
          <p className="mt-1">{complaintLoadError}</p>
          <p className="mt-1">Previously loaded records, if any, have been retained; totals are not presented as an empty result.</p>
        </section>
      )}

      {isComplaintsLoading && complaints.length === 0 ? (
        <p role="status" className="rounded-lg border border-surface-container bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
          Loading complaint records…
        </p>
      ) : !complaintLoadError && complaints.length === 0 ? (
        <p className="rounded-lg border border-surface-container bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
          No complaint records are currently available to this account.
        </p>
      ) : (
        <>
          <section aria-label="Complaint metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map(metric => (
              <article key={metric.label} className="rounded-xl border border-surface-container bg-surface-container-lowest p-4">
                <h2 className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">{metric.label}</h2>
                <p className="mt-2 text-3xl font-bold text-on-surface">{metric.value}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{metric.detail}</p>
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-xl border border-surface-container bg-surface-container-lowest">
            <div className="flex flex-col gap-2 border-b border-surface-container p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-on-surface">Recent complaints</h2>
                <p className="text-xs text-on-surface-variant">Actual API-visible records; unavailable timestamps are identified in details.</p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('admin_complaints')}
                className="text-left text-sm font-semibold text-secondary hover:underline"
              >
                Open complaint management →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3">Complaint ID</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {recentComplaints.map(complaint => (
                    <tr key={complaint.id} className="text-on-surface">
                      <td className="px-4 py-3 font-mono text-xs">{complaint.id}</td>
                      <td className="max-w-sm truncate px-4 py-3" title={complaint.description}>{complaint.description}</td>
                      <td className="px-4 py-3">{complaint.status}</td>
                      <td className="px-4 py-3">{complaint.priority}</td>
                      <td className="px-4 py-3">{formatSubmittedAt(complaint)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setCurrentView('admin_complaints', { id: complaint.id })}
                          className="font-semibold text-secondary hover:underline"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
