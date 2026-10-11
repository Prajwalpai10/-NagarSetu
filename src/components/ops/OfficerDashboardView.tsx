import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { OpsPortalShell, opsCopy, opsStatusLabel } from './OpsPortalShell';
import type { Complaint } from '../../types';

function assignedToOfficer(complaint: Complaint, officerName: string): boolean {
  return Boolean(officerName) && complaint.assignedOfficer === officerName;
}

function displayTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export const OfficerDashboardView: React.FC = () => {
  const {
    setCurrentView,
    setSelectedTicketId,
    complaints,
    isComplaintsLoading,
    complaintLoadError,
    refreshComplaints,
    locale,
  } = useApp();
  const { user } = useAuth();
  const t = opsCopy(locale);
  const assigned = complaints.filter(item => assignedToOfficer(item, user?.name ?? ''));
  const active = assigned.filter(item => !['Resolved', 'Closed'].includes(item.status));
  const pending = active.filter(item => item.status === 'Submitted' || item.status === 'Assigned');
  const inProgress = active.filter(item => item.status === 'In Progress');
  const completed = assigned.filter(item => item.status === 'Resolved' || item.status === 'Closed');
  const overdue = active.filter(item => item.slaBreached === true);
  const openTask = (id: string) => {
    setSelectedTicketId(id);
    setCurrentView('incident_dossier', { id });
  };

  return (
    <OpsPortalShell active="overview">
      <header className="ops-page-heading">
        <div>
          <h1>{t.overview}</h1>
          <p>{t.total} · {user?.name ?? '—'}</p>
        </div>
        <button type="button" className="ops-button ops-button--secondary" onClick={() => void refreshComplaints()} disabled={isComplaintsLoading}>
          <span className="material-symbols-outlined" aria-hidden="true">refresh</span>
          {isComplaintsLoading ? t.loading : t.refresh}
        </button>
      </header>

      {complaintLoadError && (
        <section className="ops-panel ops-panel__error mb-4 p-4 text-sm" role="alert">
          <p className="font-bold">{t.loadError}</p>
          <p className="mt-1">{complaintLoadError}</p>
          <button type="button" className="ops-button mt-3" onClick={() => void refreshComplaints()} disabled={isComplaintsLoading}>
            {t.retry}
          </button>
        </section>
      )}

      {isComplaintsLoading && complaints.length === 0 ? (
        <p className="ops-panel p-5 text-sm" role="status">{t.loading}</p>
      ) : complaintLoadError && complaints.length === 0 ? null : !complaintLoadError && assigned.length === 0 ? (
        <p className="ops-panel ops-panel__empty p-5 text-sm" role="status">{t.noTasks}</p>
      ) : (
        <>
          <section className="ops-metrics mb-4" aria-label={t.overview}>
            <div className="ops-panel ops-metric">
              <span className="ops-metric__label">{t.total}</span>
              <strong className="ops-metric__value">{assigned.length}</strong>
            </div>
            <div className="ops-panel ops-metric ops-metric--amber">
              <span className="ops-metric__label">{t.pending}</span>
              <strong className="ops-metric__value">{pending.length}</strong>
            </div>
            <div className="ops-panel ops-metric">
              <span className="ops-metric__label">{t.inProgress}</span>
              <strong className="ops-metric__value">{inProgress.length}</strong>
            </div>
            <div className="ops-panel ops-metric">
              <span className="ops-metric__label">{t.completed}</span>
              <strong className="ops-metric__value">{completed.length}</strong>
            </div>
          </section>

          {overdue.length > 0 && (
            <section className="ops-panel ops-metric ops-metric--red mb-4" aria-label={t.overdue}>
              <span className="ops-metric__label">{t.overdue}</span>
              <strong className="ops-metric__value">{overdue.length}</strong>
            </section>
          )}

          {assigned.length > 0 && (
            <section className="ops-panel p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="m-0 text-base font-bold">{t.tasks}</h2>
                <button type="button" className="ops-button ops-button--secondary" onClick={() => setCurrentView('complaint_queue')}>
                  {t.tasks}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="ops-data-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>{t.category}</th><th>{t.location}</th><th>{t.priority}</th><th>{t.status}</th><th>{t.updated}</th><th />
                    </tr>
                  </thead>
                  <tbody>
                    {[...assigned]
                      .sort((a, b) => Number(b.priority.slice(1)) - Number(a.priority.slice(1)) || Date.parse(b.updatedAt ?? '') - Date.parse(a.updatedAt ?? ''))
                      .slice(0, 8)
                      .map(task => (
                        <tr key={task.id}>
                          <td className="font-mono font-bold">{task.id}</td>
                          <td>{task.category}</td>
                          <td>{task.location}{task.ward ? ` · ${task.ward}` : ''}</td>
                          <td><span className={`ops-priority ${task.priority === 'P1' ? 'ops-priority--p1' : task.priority === 'P2' ? 'ops-priority--p2' : ''}`}>{task.priority}</span></td>
                          <td><span className={`ops-status ops-status--${task.status.toLowerCase().replaceAll(' ', '-')}`}>{opsStatusLabel(locale, task.status)}</span></td>
                          <td>{displayTime(task.updatedAt ?? task.createdAt)}</td>
                          <td><button type="button" className="ops-button ops-button--secondary" onClick={() => openTask(task.id)}>{t.open}</button></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </OpsPortalShell>
  );
};
