import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import type { Complaint } from '../../types';
import { OpsPortalShell, opsCopy, opsStatusLabel } from './OpsPortalShell';

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export const IncidentDossierView: React.FC = () => {
  const {
    selectedTicketId, complaints, isComplaintsLoading, complaintLoadError,
    refreshComplaints, updateComplaintStatus, setCurrentView, locale,
  } = useApp();
  const { user } = useAuth();
  const t = opsCopy(locale);
  const [remark, setRemark] = useState('');
  const [nextStatus, setNextStatus] = useState<Complaint['status']>('In Progress');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const complaint = useMemo(
    () => complaints.find(item => item.id === selectedTicketId && item.assignedOfficer === user?.name),
    [complaints, selectedTicketId, user?.name]
  );

  const saveUpdate = async (status: Complaint['status']) => {
    if (!complaint || saving) return;
    if (status === 'Resolved' && !window.confirm(t.confirmResolve)) return;
    setSaving(true);
    setError('');
    const succeeded = await updateComplaintStatus(complaint.id, status, { description: remark.trim() || undefined });
    if (!succeeded) {
      setError(t.saveFailed);
      setSaving(false);
      return;
    }
    setRemark('');
    setSaving(false);
    await refreshComplaints();
  };

  if (!complaint) {
    return (
      <OpsPortalShell active="tasks">
        <section className="ops-panel p-6" role={complaintLoadError ? 'alert' : 'status'}>
          <h1 className="text-lg font-bold">{isComplaintsLoading ? t.loading : t.unavailable}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            {complaintLoadError ?? (isComplaintsLoading ? t.loading : t.unavailable)}
          </p>
          {complaintLoadError && <button type="button" className="ops-button mt-3" onClick={() => void refreshComplaints()}>{t.retry}</button>}
          <button type="button" className="ops-button ops-button--secondary mt-3" onClick={() => setCurrentView('complaint_queue')}>{t.back}</button>
        </section>
      </OpsPortalShell>
    );
  }

  const history = [...(complaint.statusHistory ?? [])].sort((a, b) => Date.parse(b.changedAt) - Date.parse(a.changedAt));
  const images = complaint.photos ?? [];
  const canUpdate = !['Resolved', 'Closed'].includes(complaint.status);

  return (
    <OpsPortalShell active="tasks">
      <header className="ops-page-heading">
        <div>
          <button type="button" className="ops-link mb-2" onClick={() => setCurrentView('complaint_queue')}>← {t.back}</button>
          <h1>{t.details} · <span className="font-mono">{complaint.id}</span></h1>
        </div>
        <span className={`ops-status ops-status--${complaint.status.toLowerCase().replaceAll(' ', '-')}`}>{opsStatusLabel(locale, complaint.status)}</span>
      </header>

      {complaintLoadError && (
        <section className="ops-panel ops-panel__error mb-4 p-4 text-sm" role="alert">
          <p className="font-bold">{t.loadError}</p><p className="mt-1">{complaintLoadError}</p>
          <button type="button" className="ops-button mt-3" onClick={() => void refreshComplaints()} disabled={isComplaintsLoading}>{t.retry}</button>
        </section>
      )}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <div className="space-y-4">
          <section className="ops-panel p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`ops-priority ${complaint.priority === 'P1' ? 'ops-priority--p1' : complaint.priority === 'P2' ? 'ops-priority--p2' : ''}`}>{complaint.priority}</span>
              <span className="text-sm font-semibold">{complaint.category}{complaint.subCategory ? ` · ${complaint.subCategory}` : ''}</span>
            </div>
            <h2 className="text-xl font-bold">{complaint.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">{complaint.description}</p>
            <dl className="ops-detail-grid mt-5">
              <div><dt>{t.location}</dt><dd>{complaint.location}{complaint.ward ? ` · ${complaint.ward}` : ''}</dd></div>
              <div><dt>{t.assignedOfficer}</dt><dd>{complaint.assignedOfficer ?? '—'}</dd></div>
              <div><dt>{t.department}</dt><dd>{complaint.department || '—'}</dd></div>
              <div><dt>{t.submitted}</dt><dd>{formatDate(complaint.createdAt ?? complaint.reportedDate)}</dd></div>
              <div><dt>{t.updated}</dt><dd>{formatDate(complaint.updatedAt)}</dd></div>
              <div><dt>{t.currentStatus}</dt><dd>{opsStatusLabel(locale, complaint.status)}</dd></div>
            </dl>
          </section>

          <section className="ops-panel p-5">
            <h2 className="mb-3 text-base font-bold">{t.evidence}</h2>
            {images.length === 0 ? <p className="text-sm text-on-surface-variant">{t.noEvidence}</p> : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {images.map((url, index) => (
                  <li key={`${url}-${index}`} className="overflow-hidden border border-outline-variant">
                    <a href={url} target="_blank" rel="noreferrer" className="ops-link block">
                      <img src={url} alt={`${t.evidence} ${index + 1}`} className="max-h-64 w-full object-contain" loading="lazy" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ops-panel p-5">
            <h2 className="mb-3 text-base font-bold">{t.history}</h2>
            {history.length === 0 ? <p className="text-sm text-on-surface-variant">{t.noHistory}</p> : (
              <ol className="space-y-3">
                {history.map((item, index) => (
                  <li key={`${item.changedAt}-${index}`} className="border-l-2 border-secondary pl-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <strong className="text-sm">{opsStatusLabel(locale, item.status)}</strong>
                      <time className="text-xs text-on-surface-variant">{formatDate(item.changedAt)}</time>
                    </div>
                    {item.note && <p className="mt-1 whitespace-pre-wrap text-sm text-on-surface-variant">{item.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="ops-panel p-5">
            <h2 className="mb-1 text-base font-bold">{t.statusUpdate}</h2>
            <p className="mb-4 text-xs text-on-surface-variant">{t.note}</p>
            {!canUpdate ? (
            <p className="text-sm text-on-surface-variant">{opsStatusLabel(locale, complaint.status)}</p>
            ) : (
              <form onSubmit={event => { event.preventDefault(); void saveUpdate(nextStatus); }}>
                <label className="mb-3 block">
                  <span className="mb-1 block text-xs font-bold">{t.status}</span>
                  <select className="ops-form-control" value={nextStatus} onChange={event => setNextStatus(event.target.value as Complaint['status'])}>
                    <option value="In Progress">{opsStatusLabel(locale, 'In Progress')}</option>
                    <option value="Resolved">{opsStatusLabel(locale, 'Resolved')}</option>
                  </select>
                </label>
                <label className="mb-3 block">
                  <span className="mb-1 block text-xs font-bold">{t.note}</span>
                  <textarea className="ops-form-control min-h-28" maxLength={1000} value={remark} onChange={event => setRemark(event.target.value)} />
                  <span className="mt-1 block text-right text-xs text-on-surface-variant">{remark.length}/1000</span>
                </label>
                {error && <p className="mb-3 text-sm text-error" role="alert">{error}</p>}
                <button type="submit" className="ops-button w-full" disabled={saving}>
                  {saving ? t.saving : t.save}
                </button>
              </form>
            )}
          </section>
          <section className="ops-panel p-4 text-sm text-on-surface-variant">
            <p>{t.guidance}</p>
          </section>
        </aside>
      </div>
    </OpsPortalShell>
  );
};
