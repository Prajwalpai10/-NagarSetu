import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Complaint } from '../../types';
import { complaintService } from '../../services/complaintService';

export const MyComplaintsView: React.FC = () => {
  const {
    complaints,
    setSelectedTicketId,
    setCurrentView,
    updateComplaintStatus,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'progress' | 'resolved' | 'closed'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const legacyComplaints = complaintService.getStoredComplaints();

  const exportLegacyComplaints = () => {
    if (!legacyComplaints?.length) return;
    const blob = new Blob([JSON.stringify(legacyComplaints, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nagarsetu-local-complaints-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Local Records Exported', `${legacyComplaints.length} browser-stored complaints were downloaded without changing the originals.`);
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;

    let matchesFilter = true;
    if (activeFilter === 'active') {
      matchesFilter = c.status === 'Submitted' || c.status === 'In Progress' || c.status === 'Assigned';
    } else if (activeFilter === 'progress') {
      matchesFilter = c.status === 'In Progress';
    } else if (activeFilter === 'resolved') {
      matchesFilter = c.status === 'Resolved';
    } else if (activeFilter === 'closed') {
      matchesFilter = c.status === 'Closed';
    }

    return matchesSearch && matchesCategory && matchesFilter;
  });

  const handleInspect = (id: string) => {
    setSelectedTicketId(id);
    setCurrentView('track_complaint');
  };

  const handleVerify = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateComplaintStatus(id, 'Closed', { lifecycleStage: 8 });
    showToast('Verification Recorded', `Citizen sign-off confirmed for ${id}. Ticket archived.`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-space-lg pb-space-xl">
      {/* Top Breadcrumbs & Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg pb-space-sm">
        <div className="space-y-space-xs">
          <nav aria-label="Breadcrumbs" className="flex items-center gap-space-xs text-on-surface-variant font-code-badge text-code-badge uppercase tracking-wider">
            <button onClick={() => setCurrentView('citizen_home')} className="hover:text-secondary cursor-pointer">Citizen Services</button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="hover:text-secondary cursor-pointer">Complaints</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-secondary font-bold">My History</span>
          </nav>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">My Complaints</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Track, inspect updates, and verify resolution across all your submitted civic reports.
          </p>
        </div>
        <div className="flex items-center gap-space-sm shrink-0">
          {legacyComplaints && legacyComplaints.length > 0 && (
            <button
              type="button"
              onClick={exportLegacyComplaints}
              className="inline-flex items-center gap-space-xs px-space-md py-2.5 border border-surface-container text-on-surface font-body-sm text-body-sm font-semibold rounded-lg hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Export local records ({legacyComplaints.length})
            </button>
          )}
          <button
            onClick={() => setCurrentView('report_issue')}
            className="inline-flex items-center gap-space-xs px-space-lg py-2.5 bg-primary-container text-on-primary-container font-headline-md text-body-md font-bold rounded-lg shadow-sm hover:brightness-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">add_circle</span>
            <span>+ Report an Issue</span>
          </button>
        </div>
      </div>

      {/* Quick Citizen Stat Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-xl">assignment</span>
          </div>
          <div>
            <span className="font-code-sla text-code-sla text-on-surface-variant block">Total Filed</span>
            <span className="font-headline-md text-headline-md font-bold text-on-surface">{complaints.length} Cases</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-lg bg-primary-fixed/40 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-xl">pending_actions</span>
          </div>
          <div>
            <span className="font-code-sla text-code-sla text-on-surface-variant block">In Action</span>
            <span className="font-headline-md text-headline-md font-bold text-on-surface">
              {complaints.filter(c => c.status === 'In Progress' || c.status === 'Submitted' || c.status === 'Assigned').length} Active
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-lg bg-secondary-container/50 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-xl">task_alt</span>
          </div>
          <div>
            <span className="font-code-sla text-code-sla text-on-surface-variant block">Resolved</span>
            <span className="font-headline-md text-headline-md font-bold text-on-surface">
              {complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length} Verified
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-xl">verified_user</span>
          </div>
          <div>
            <span className="font-code-sla text-code-sla text-on-surface-variant block">Sign-off Rate</span>
            <span className="font-headline-md text-headline-md font-bold text-on-surface">100%</span>
          </div>
        </div>
      </div>

      {/* Search Bar & Controls Bar */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="relative flex-1 max-w-xl">
          <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search complaint ID or keyword (e.g. CMP-2026-01482, pothole, streetlight)..."
            className="w-full pl-11 pr-space-md py-2.5 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/70 font-body-sm text-body-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-secondary"
          />
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-surface-container-low text-on-surface font-body-sm text-body-sm py-2 pl-space-md pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Roads & Potholes">Roads &amp; Potholes</option>
              <option value="Streetlights & Electrical">Streetlights</option>
              <option value="Garbage & Sanitation">Garbage &amp; Sanitation</option>
              <option value="Water Leakage & Mains">Water Supply</option>
              <option value="Storm Drainage & Flooding">Drainage &amp; Flooding</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-base">expand_more</span>
          </div>

          <div className="relative">
            <select className="appearance-none bg-surface-container-low text-on-surface font-body-sm text-body-sm py-2 pl-space-md pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer">
              <option>Sorted by: Most Recent</option>
              <option>Sorted by: Priority</option>
              <option>Sorted by: Oldest First</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-base">expand_more</span>
          </div>
        </div>
      </div>

      {/* Filter Tab Bar */}
      <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All', count: complaints.length },
          { key: 'active', label: 'Active', count: complaints.filter(c => c.status === 'In Progress' || c.status === 'Submitted' || c.status === 'Assigned').length },
          { key: 'progress', label: 'In Progress', count: complaints.filter(c => c.status === 'In Progress').length },
          { key: 'resolved', label: 'Resolved', count: complaints.filter(c => c.status === 'Resolved').length },
          { key: 'closed', label: 'Closed', count: complaints.filter(c => c.status === 'Closed').length },
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key as any)}
              className={`px-space-md py-2 rounded-lg font-headline-md text-body-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-secondary text-on-secondary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full font-code-badge text-code-badge ${isActive ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                <th className="py-space-md px-space-lg">Complaint Details</th>
                <th className="py-space-md px-space-md">Location</th>
                <th className="py-space-md px-space-md">Date &amp; Priority</th>
                <th className="py-space-md px-space-md">Current Status</th>
                <th className="py-space-md px-space-md">Latest Field Note</th>
                <th className="py-space-md px-space-lg text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high text-on-surface">
              {filteredComplaints.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => handleInspect(c.id)}
                  className="hover:bg-surface-container-low/60 transition-colors group cursor-pointer"
                >
                  <td className="py-space-md px-space-lg">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-code-badge text-code-badge text-secondary font-bold bg-secondary-container/40 px-1.5 py-0.5 rounded">
                          {c.id}
                        </span>
                        <span className="font-code-badge text-[0.6875rem] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">
                          {c.category}
                        </span>
                      </div>
                      <span className="font-headline-md text-body-md font-bold text-on-surface group-hover:text-secondary transition-colors">
                        {c.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="flex items-start gap-1 max-w-xs">
                      <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">location_on</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                        {c.location}
                      </span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="font-code-sla text-code-sla text-on-surface-variant">{c.reportedDate.split(',')[0]}</span>
                      <span className={`inline-flex items-center gap-1 font-code-badge text-code-badge px-2 py-0.5 rounded-full font-bold w-fit ${
                        c.priority === 'P1'
                          ? 'text-tertiary bg-tertiary-fixed/60'
                          : c.priority === 'P2'
                          ? 'text-primary bg-primary-fixed/50'
                          : 'text-on-surface-variant bg-surface-container'
                      }`}>
                        {c.priority === 'P1' && <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>}
                        {c.priority} High
                      </span>
                    </div>
                  </td>
                  <td className="py-space-md px-space-md whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-headline-md text-body-sm font-semibold w-fit ${
                        c.status === 'In Progress'
                          ? 'bg-primary-fixed/50 text-on-primary-fixed'
                          : c.status === 'Resolved'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : c.status === 'Closed'
                          ? 'bg-surface-container-high text-on-surface-variant'
                          : 'bg-surface-container text-on-surface'
                      }`}>
                        {c.status === 'Resolved' && <span className="material-symbols-outlined text-xs">check_circle</span>}
                        {c.status === 'In Progress' && <span className="w-2 h-2 rounded-full bg-primary-container"></span>}
                        {c.status}
                      </span>
                      {c.status === 'Resolved' && (
                        <span className="font-code-badge text-[0.6875rem] text-primary font-bold pl-1">Needs Sign-Off</span>
                      )}
                    </div>
                  </td>
                  <td className="py-space-md px-space-md">
                    <div className="max-w-xs font-body-sm text-body-sm text-on-surface-variant">
                      <span className="font-semibold text-on-surface">{c.timeAgo}</span> • {c.assignedCrew || 'Field crew assigned'}
                    </div>
                  </td>
                  <td className="py-space-md px-space-lg text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.status === 'Resolved' && (
                        <button
                          type="button"
                          onClick={(e) => handleVerify(c.id, e)}
                          className="px-space-sm py-1.5 rounded bg-primary-container text-on-primary-container font-headline-md text-body-sm font-bold hover:brightness-95 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">check</span>
                          <span>Verify</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleInspect(c.id); }}
                        className="inline-flex items-center gap-1 px-space-md py-1.5 rounded bg-surface-container-low text-secondary font-headline-md text-body-sm font-semibold hover:bg-secondary hover:text-on-secondary transition-all cursor-pointer"
                      >
                        <span>View Details</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="block md:hidden space-y-space-md">
        {filteredComplaints.map((c) => (
          <div
            key={c.id}
            onClick={() => handleInspect(c.id)}
            className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm space-y-space-sm cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-code-badge text-code-badge text-secondary font-bold bg-secondary-container/40 px-2 py-0.5 rounded">
                {c.id}
              </span>
              <span className="font-code-badge text-code-badge px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                {c.priority}
              </span>
            </div>
            <div>
              <span className="font-code-badge text-[0.6875rem] text-on-surface-variant uppercase">{c.category}</span>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">{c.title}</h2>
            </div>
            <div className="flex items-start gap-1 text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">location_on</span>
              <span>{c.location}</span>
            </div>
            <div className="pt-space-xs flex items-center justify-between border-t border-surface-container">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-headline-md text-body-sm font-semibold">
                {c.status}
              </span>
              <span className="font-code-sla text-code-sla text-on-surface-variant">{c.reportedDate.split(',')[0]}</span>
            </div>
            <div className="flex items-center gap-space-xs pt-1">
              {c.status === 'Resolved' && (
                <button
                  type="button"
                  onClick={(e) => handleVerify(c.id, e)}
                  className="flex-1 py-2 rounded bg-primary-container text-on-primary-container font-headline-md text-body-sm font-bold text-center"
                >
                  Verify Now
                </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleInspect(c.id); }}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded bg-surface-container text-secondary font-headline-md text-body-sm font-semibold"
              >
                <span>Details</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Civic Transparency Guarantee Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-xl text-center flex flex-col items-center justify-center relative overflow-hidden">
        <div className="w-28 h-28 rounded-full bg-secondary-container/30 flex items-center justify-center mb-space-md text-secondary">
          <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-4xl text-secondary">verified</span>
          </div>
        </div>
        <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-space-xs">
          Civic Transparency Guarantee
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mb-space-lg">
          Every NagarSetu ticket is cryptographically assigned to ward field supervisors. When a task is resolved, you hold full citizen sign-off authority.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-space-sm mb-space-md">
          <button
            onClick={() => setCurrentView('report_issue')}
            className="px-space-lg py-2.5 bg-primary-container text-on-primary-container font-headline-md text-body-md font-bold rounded-lg shadow-sm hover:brightness-95 transition-all flex items-center gap-space-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add_task</span>
            <span>Report Your First Issue</span>
          </button>
          <button
            onClick={() => setCurrentView('track_complaint')}
            className="px-space-md py-2.5 bg-surface-container-low text-on-surface font-headline-md text-body-md font-medium rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Track via Reference ID
          </button>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant/80 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-base text-secondary">info</span>
          <span>Need help looking up a past offline ticket? You can search by reference ID or your registered mobile number anytime.</span>
        </p>
      </div>
    </div>
  );
};
