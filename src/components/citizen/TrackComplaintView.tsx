import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const TrackComplaintView: React.FC = () => {
  const {
    selectedTicketId,
    setSelectedTicketId,
    complaints,
    isComplaintsLoading,
    updateComplaintStatus,
    setCurrentView,
    showToast,
  } = useApp();

  const [searchCode, setSearchCode] = useState(selectedTicketId || 'CMP-2026-01482');
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);

  const complaint = selectedTicketId
    ? complaints.find((c) => c.id === selectedTicketId)
    : complaints[0];

  if (!complaint) {
    return (
      <div className="w-full max-w-4xl mx-auto rounded-2xl border border-surface-container bg-surface-container-lowest p-8 text-center">
        <h1 className="text-2xl font-bold text-on-surface">
          {isComplaintsLoading
            ? 'Loading complaints…'
            : selectedTicketId
              ? 'Complaint unavailable'
              : 'No complaints to track'}
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {isComplaintsLoading
            ? 'Your complaint records are loading from the service.'
            : selectedTicketId
              ? 'The selected complaint is not available in your account records.'
              : 'Complaints you submit will appear here.'}
        </p>
        {!isComplaintsLoading && (
          <button
            type="button"
            onClick={() => setCurrentView('report_issue')}
            className="mt-5 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary"
          >
            Report an issue
          </button>
        )}
      </div>
    );
  }

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchCode.trim().toUpperCase();
    const found = complaints.find((c) => c.id.toUpperCase() === clean);
    if (found) {
      setSelectedTicketId(found.id);
      showToast('Complaint Found', `Loaded record for ${found.id}`);
    } else {
      showToast('Not Found', `No exact match for ${clean}. Showing current ticket.`);
    }
  };

  const handleConfirmResolution = (satisfied: boolean) => {
    setFeedbackSent(true);
    if (satisfied) {
      updateComplaintStatus(complaint.id, 'Closed');
      showToast('Thank you!', 'You confirmed that the issue was resolved.');
    } else {
      updateComplaintStatus(complaint.id, 'In Progress');
      showToast('Feedback Received', 'The ticket has been reopened for follow-up inspection.');
    }
  };

  const steps = [
    { label: 'Submitted', desc: 'Complaint registered by citizen' },
    { label: 'Assigned', desc: `Assigned to ${complaint.department || 'Field Ops Crew'}` },
    { label: 'In Progress', desc: 'Field repair crew dispatched on site' },
    { label: 'Resolved', desc: 'Repair completed and verified' },
  ];

  const getStepStatus = (index: number) => {
    const s = complaint.status;
    if (s === 'Closed') return 'completed';
    if (s === 'Resolved') {
      return index <= 3 ? 'completed' : 'pending';
    }
    if (s === 'In Progress') {
      if (index <= 1) return 'completed';
      if (index === 2) return 'current';
      return 'pending';
    }
    if (s === 'Assigned') {
      if (index === 0) return 'completed';
      if (index === 1) return 'current';
      return 'pending';
    }
    // Submitted
    if (index === 0) return 'current';
    return 'pending';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Bar with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setCurrentView('citizen_home')}
            className="text-xs font-semibold text-on-surface-variant hover:text-secondary flex items-center gap-1 mb-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Citizen Home</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">Track Complaint</h1>
        </div>

        {/* Quick Search */}
        <form onSubmit={handleLookup} className="flex items-center gap-2 max-w-md w-full sm:w-auto">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Search Complaint ID (e.g. CMP-2026-01482)"
            className="flex-1 sm:w-64 px-3 py-2 text-sm rounded-xl border border-surface-container bg-surface-container-lowest text-on-surface focus:outline-none focus:border-secondary"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-secondary text-on-secondary text-sm font-semibold rounded-xl hover:brightness-105 transition-all cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Complaint Status Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-6">
        {/* Header Details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-container">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-base font-mono font-bold text-secondary bg-secondary-container/50 px-2.5 py-1 rounded-lg">
                #{complaint.id}
              </span>
              <span className="text-xs font-semibold bg-surface-container px-2.5 py-1 rounded-lg text-on-surface-variant">
                {complaint.category}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  complaint.status === 'Resolved' || complaint.status === 'Closed'
                    ? 'bg-secondary/15 text-secondary'
                    : complaint.status === 'In Progress'
                    ? 'bg-primary-container text-on-surface'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {complaint.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-on-surface">{complaint.title}</h2>
            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-sm">location_on</span>
              {complaint.location} • Reported on {complaint.reportedDate}
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs uppercase font-bold text-on-surface-variant block">Assigned Department</span>
            <span className="text-sm font-semibold text-on-surface">{complaint.department || 'Municipal Operations'}</span>
            <span className="text-xs text-on-surface-variant block mt-0.5">SLA Target: Within 48 hours</span>
          </div>
        </div>

        {/* Expected Next Step Alert */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container flex items-start gap-3">
          <span className="material-symbols-outlined text-secondary text-xl mt-0.5">schedule</span>
          <div>
            <span className="text-xs uppercase font-bold text-secondary block">Next Step</span>
            <p className="text-sm text-on-surface mt-0.5 font-medium">
              {complaint.status === 'Resolved' || complaint.status === 'Closed'
                ? 'Repair is completed. Please confirm below if the issue was resolved to your satisfaction.'
                : complaint.status === 'In Progress'
                ? 'Field crew is currently on site executing repairs. Expected completion today.'
                : complaint.status === 'Assigned'
                ? 'Workorder issued to zonal field crew. Crew mobilization in progress.'
                : 'Complaint received and scheduled for inspection by ward officer.'}
            </p>
          </div>
        </div>

        {/* Simple Progress Timeline */}
        <div className="py-2">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-6">Progress Timeline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {steps.map((step, idx) => {
              const state = getStepStatus(idx);
              const isCompleted = state === 'completed';
              const isCurrent = state === 'current';

              return (
                <div key={idx} className="flex flex-col items-start relative">
                  {/* Step indicator */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCompleted
                          ? 'bg-secondary text-on-secondary'
                          : isCurrent
                          ? 'bg-primary-container text-on-surface ring-2 ring-primary-container ring-offset-2'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        isCompleted || isCurrent ? 'text-on-surface' : 'text-on-surface-variant'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resolution Feedback (Shown if resolved/closed or ready for confirmation) */}
        {(complaint.status === 'Resolved' || complaint.status === 'Closed') && !feedbackSent && (
          <div className="bg-secondary/10 p-5 rounded-xl border border-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-secondary">Did this repair solve the problem?</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Your sign-off confirms the work order and helps maintain municipal quality standards.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleConfirmResolution(true)}
                className="px-4 py-2 bg-secondary text-on-secondary text-sm font-bold rounded-lg hover:brightness-105 transition-all cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                <span>Yes, Resolved</span>
              </button>
              <button
                onClick={() => handleConfirmResolution(false)}
                className="px-4 py-2 bg-surface-container text-on-surface text-sm font-semibold rounded-lg hover:bg-surface-container-high transition-all cursor-pointer"
              >
                No, Still an Issue
              </button>
            </div>
          </div>
        )}

        {/* Photos Preview if available */}
        {complaint.photos && complaint.photos.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-3">
              Attached Photos ({complaint.photos.length})
            </h4>
            <div className="flex flex-wrap gap-3">
              {complaint.photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Proof ${i + 1}`}
                  className="w-28 h-28 object-cover rounded-xl border border-surface-container"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Emergency Assistance Footer Card */}
      <div className="bg-surface-container p-5 rounded-2xl border border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">emergency</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">Immediate Hazard or Emergency?</h4>
            <p className="text-xs text-on-surface-variant">Live electric wires, gas leaks, or dangerous sinkholes.</p>
          </div>
        </div>
        <button
          onClick={() => setCurrentView('emergency')}
          className="px-5 py-2 rounded-xl bg-tertiary text-on-tertiary text-xs font-bold hover:brightness-105 transition-all shrink-0 cursor-pointer"
        >
          Dial 112 / 1913
        </button>
      </div>
    </div>
  );
};
