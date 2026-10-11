import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import type { Complaint } from '../../types';
import { OpsPortalShell, opsCopy, opsStatusLabel } from './OpsPortalShell';

const STATUSES: Complaint['status'][] = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Escalated'];
const PRIORITIES: Complaint['priority'][] = ['P1', 'P2', 'P3', 'P4'];

function assignedToOfficer(complaint: Complaint, officerName: string): boolean {
  return Boolean(officerName) && complaint.assignedOfficer === officerName;
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function assignmentDate(complaint: Complaint): string | undefined {
  return complaint.statusHistory?.find(item => item.status === 'Assigned')?.changedAt;
}

export const ComplaintQueueView: React.FC = () => {
  const { complaints, isComplaintsLoading, complaintLoadError, refreshComplaints, setSelectedTicketId, setCurrentView, locale } = useApp();
  const { user } = useAuth();
  const location = useLocation();
  const t = opsCopy(locale);
  const queryStatus = new URLSearchParams(location.search).get('status') ?? '';
  const completedView = queryStatus === 'Completed';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState(queryStatus);
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

  React.useEffect(() => {
    setStatus(queryStatus);
  }, [queryStatus]);

  const assigned = useMemo(
    () => complaints.filter(item => assignedToOfficer(item, user?.name ?? '')),
    [complaints, user?.name]
  );
  const categories = useMemo(() => [...new Set(assigned.map(item => item.category).filter(Boolean))].sort(), [assigned]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return [...assigned]
      .filter(item => !needle || [item.id, item.category, item.title, item.description, item.location, item.ward]
        .some(value => value?.toLocaleLowerCase().includes(needle)))
      .filter(item => !category || item.category === category)
      .filter(item => !status || (status === 'Completed'
        ? item.status === 'Resolved' || item.status === 'Closed'
        : item.status === status))
      .filter(item => !priority || item.priority === priority)
      .sort((a, b) => {
        const left = Date.parse(assignmentDate(a) ?? '');
        const right = Date.parse(assignmentDate(b) ?? '');
        const order = Number.isNaN(left) || Number.isNaN(right) ? 0 : left - right;
        return sort === 'newest' ? -order : order;
      });
  }, [assigned, query, category, status, priority, sort]);

  const openTask = (id: string) => {
    setSelectedTicketId(id);
    setCurrentView('incident_dossier', { id });
  };

  return (
    <OpsPortalShell active={queryStatus === 'In Progress' ? 'progress' : completedView ? 'completed' : 'tasks'}>
      <header className="ops-page-heading">
        <div>
          <h1>{queryStatus === 'In Progress' ? t.inProgress : completedView ? t.completed : t.tasks}</h1>
          <p>{filtered.length} / {assigned.length}</p>
        </div>
        <button type="button" className="ops-button ops-button--secondary" onClick={() => void refreshComplaints()} disabled={isComplaintsLoading}>
          <span className="material-symbols-outlined" aria-hidden="true">refresh</span>
          {isComplaintsLoading ? t.loading : t.refresh}
        </button>
      </header>

      {complaintLoadError && assigned.length === 0 ? (
        <section className="ops-panel ops-panel__error p-4 text-sm" role="alert">
          <p className="font-bold">{t.loadError}</p>
          <p className="mt-1">{complaintLoadError}</p>
          <button type="button" className="ops-button mt-3" onClick={() => void refreshComplaints()} disabled={isComplaintsLoading}>{t.retry}</button>
        </section>
      ) : isComplaintsLoading && complaints.length === 0 ? (
        <p className="ops-panel p-5 text-sm" role="status">{t.loading}</p>
      ) : complaintLoadError && complaints.length > 0 ? (
        <section className="ops-panel ops-panel__error mb-4 p-4 text-sm" role="alert">
          <p className="font-bold">{t.loadError}</p><p className="mt-1">{complaintLoadError}</p>
        </section>
      ) : null}

      {!complaintLoadError && assigned.length === 0 && !isComplaintsLoading ? (
        <p className="ops-panel ops-panel__empty p-5 text-sm" role="status">{t.noTasks}</p>
      ) : assigned.length > 0 && (
        <>
          <section className="ops-panel mb-3 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5" aria-label={t.filters}>
            <label className="lg:col-span-2">
              <span className="mb-1 block text-xs font-bold">{t.search}</span>
              <input className="ops-form-control" type="search" value={query} onChange={event => setQuery(event.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold">{t.category}</span>
              <select className="ops-form-control" value={category} onChange={event => setCategory(event.target.value)}>
                <option value="">{t.allCategories}</option>
                {categories.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold">{t.status}</span>
              <select className="ops-form-control" value={status} onChange={event => setStatus(event.target.value)}>
                <option value="">{t.allStatuses}</option>
                <option value="Completed">{t.completed}</option>
                {STATUSES.map(value => <option key={value} value={value}>{opsStatusLabel(locale, value)}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold">{t.priority}</span>
              <select className="ops-form-control" value={priority} onChange={event => setPriority(event.target.value)}>
                <option value="">{t.allPriorities}</option>
                {PRIORITIES.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold">{t.sort}</span>
              <select className="ops-form-control" value={sort} onChange={event => setSort(event.target.value as 'newest' | 'oldest')}>
                <option value="newest">{t.newest}</option>
                <option value="oldest">{t.oldest}</option>
              </select>
            </label>
          </section>

          {filtered.length === 0 ? (
            <p className="ops-panel ops-panel__empty p-5 text-sm" role="status">{t.noResults}</p>
          ) : (
            <div className="ops-panel overflow-x-auto">
              <table className="ops-data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>{t.category} / {t.description}</th><th>{t.location}</th><th>{t.priority}</th><th>{t.status}</th><th>{t.assignment}</th><th>{t.updated}</th><th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(task => (
                    <tr key={task.id}>
                      <td className="font-mono font-bold">{task.id}</td>
                      <td><strong>{task.category}</strong><div className="mt-1 max-w-sm text-xs text-on-surface-variant">{task.description}</div></td>
                      <td>{task.location}{task.ward ? <div className="text-xs text-on-surface-variant">{task.ward}</div> : null}</td>
                      <td><span className={`ops-priority ${task.priority === 'P1' ? 'ops-priority--p1' : task.priority === 'P2' ? 'ops-priority--p2' : ''}`}>{task.priority}</span></td>
                      <td><span className={`ops-status ops-status--${task.status.toLowerCase().replaceAll(' ', '-')}`}>{opsStatusLabel(locale, task.status)}</span></td>
                      <td>{formatDate(assignmentDate(task))}</td>
                      <td>{formatDate(task.updatedAt)}</td>
                      <td><button type="button" className="ops-button ops-button--secondary" onClick={() => openTask(task.id)}>{t.open}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </OpsPortalShell>
  );
};
