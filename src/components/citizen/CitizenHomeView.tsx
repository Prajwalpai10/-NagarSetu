import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const CitizenHomeView: React.FC = () => {
  const { user } = useAuth();
  const {
    setCurrentView,
    complaints,
    setSelectedTicketId,
    updateComplaintStatus,
    showToast,
    translations,
  } = useApp();

  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);

  const activeComplaints = complaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Submitted' || c.status === 'Assigned'
  );
  const resolvedComplaints = complaints.filter(
    (c) => c.status === 'Resolved' || c.status === 'Closed'
  );

  const handleTrackComplaint = (id: string) => {
    setSelectedTicketId(id);
    setCurrentView('track_complaint', { id });
  };

  const handleConfirmResolution = (id: string, satisfied: boolean) => {
    setFeedbackGiven(id);
    if (satisfied) {
      updateComplaintStatus(id, 'Closed');
      showToast('Thank you!', 'You confirmed that the issue was resolved.');
    } else {
      updateComplaintStatus(id, 'In Progress');
      showToast('Feedback Received', 'The ticket has been reopened for follow-up inspection.');
    }
  };

  return (
    <div className="civic-home-page w-full max-w-6xl mx-auto space-y-8 pb-12">
      {/* 1. WELCOME BANNER & PRIMARY ACTION */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-container shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/60 text-on-secondary-container text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>{translations.citizenPortal}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            {translations.welcomeCitizen}{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-on-surface-variant text-base mt-1">
            {translations.welcomeCitizenSubtitle}
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={() => setCurrentView('report_issue')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary-container text-on-surface font-bold text-base hover:brightness-95 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">add_circle</span>
            <span>{translations.reportIssue}</span>
          </button>
        </div>
      </section>

      {/* 2. COMPACT SUMMARY CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setCurrentView('my_complaints')}
          className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container shadow-sm hover:border-secondary transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">{translations.activeComplaints}</div>
            <div className="text-3xl font-bold text-on-surface mt-1">{activeComplaints.length}</div>
            <div className="text-xs text-secondary font-medium mt-0.5">{translations.currentlyInProgress}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
        </div>

        <div
          onClick={() => setCurrentView('my_complaints')}
          className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container shadow-sm hover:border-secondary transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">{translations.resolvedIssues}</div>
            <div className="text-3xl font-bold text-on-surface mt-1">{resolvedComplaints.length}</div>
            <div className="text-xs text-secondary font-medium mt-0.5">{translations.repairsCompleted}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">task_alt</span>
          </div>
        </div>

        <div
          onClick={() => setCurrentView('emergency')}
          className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container shadow-sm hover:border-tertiary transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-xs uppercase font-bold text-tertiary tracking-wider">{translations.emergencyHelplineCard}</div>
            <div className="text-3xl font-bold text-tertiary mt-1">1913 / 112</div>
            <div className="text-xs text-on-surface-variant font-medium mt-0.5">{translations.emergencyHelplineCardSubtitle}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">emergency</span>
          </div>
        </div>
      </section>

      {/* 3. RECENT COMPLAINTS */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-surface-container mb-4">
          <div>
            <h2 className="text-xl font-bold text-on-surface">{translations.recentComplaints}</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">{translations.recentComplaintsSubtitle}</p>
          </div>
          <button
            onClick={() => setCurrentView('my_complaints')}
            className="text-sm font-semibold text-secondary hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>{translations.viewAll}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="divide-y divide-surface-container">
          {complaints.slice(0, 4).map((c) => {
            const isPendingFeedback = (c.status === 'Resolved') && feedbackGiven !== c.id;

            return (
              <div key={c.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-secondary bg-secondary-container/40 px-2 py-0.5 rounded">
                      {c.id}
                    </span>
                    <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                      {c.category}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        c.status === 'Resolved' || c.status === 'Closed'
                          ? 'bg-secondary/15 text-secondary'
                          : c.status === 'In Progress'
                          ? 'bg-primary-container text-on-surface'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-on-surface">{c.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      {c.location}
                    </span>
                    <span>Reported: {c.reportedDate}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isPendingFeedback ? (
                    <div className="flex items-center gap-2 bg-secondary/10 p-2 rounded-xl">
                      <span className="text-xs font-medium text-secondary">Is this resolved?</span>
                      <button
                        onClick={() => handleConfirmResolution(c.id, true)}
                        className="px-3 py-1 bg-secondary text-on-secondary text-xs font-bold rounded-lg hover:brightness-105 transition-all cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleConfirmResolution(c.id, false)}
                        className="px-3 py-1 bg-surface-container text-on-surface text-xs font-medium rounded-lg hover:bg-surface-container-high transition-all cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleTrackComplaint(c.id)}
                      className="px-4 py-2 border border-secondary text-secondary hover:bg-secondary-container/40 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">search</span>
                      <span>Track Status</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. EMERGENCY & QUICK CONTACT ASSISTANCE */}
      <section className="bg-surface-container p-6 rounded-2xl border border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">emergency</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">Need Immediate Emergency Help?</h4>
            <p className="text-xs text-on-surface-variant">For fallen live wires, sewer bursts, or dangerous hazards, call emergency response.</p>
          </div>
        </div>
        <button
          onClick={() => setCurrentView('emergency')}
          className="px-5 py-2.5 rounded-xl bg-tertiary text-on-tertiary text-xs font-bold hover:brightness-105 transition-all shrink-0 cursor-pointer"
        >
          View Emergency Directory
        </button>
      </section>
    </div>
  );
};
