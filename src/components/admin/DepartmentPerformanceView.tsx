import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportService } from '../../services/exportService';

export const DepartmentPerformanceView: React.FC = () => {
  const { showToast, setCurrentView } = useApp();

  const [timeHorizon, setTimeHorizon] = useState<'7d' | '30d' | 'q3'>('30d');
  const [selectedDept, setSelectedDept] = useState<string>('Roads');

  const departments = [
    {
      id: 'Roads',
      name: 'Roads & Infrastructure (BBMP)',
      slaCompliance: 94.2,
      mttr: '3.4 Hours',
      totalCases: 642,
      resolved: 605,
      breached: 37,
      csat: 4.4,
      status: 'Target Met',
      leadEngineer: 'Chief Eng. K. R. Raghavan',
      budgetUtilized: '78.4%',
      primaryBottleneck: 'Monsoon asphalt curing delays & raw aggregate delivery',
      weeklyTrend: [45, 52, 58, 64, 70, 75, 82],
    },
    {
      id: 'Power',
      name: 'Power & Grid (BESCOM)',
      slaCompliance: 96.5,
      mttr: '2.1 Hours',
      totalCases: 418,
      resolved: 403,
      breached: 15,
      csat: 4.7,
      status: 'Exceeding SLA',
      leadEngineer: 'Superintending Eng. V. Rao',
      budgetUtilized: '84.1%',
      primaryBottleneck: 'Transformer fuse shortages in suburban feeder sub-stations',
      weeklyTrend: [30, 32, 28, 35, 40, 38, 42],
    },
    {
      id: 'Sanitation',
      name: 'Solid Waste Management (BBMP SWM)',
      slaCompliance: 88.6,
      mttr: '5.1 Hours',
      totalCases: 890,
      resolved: 789,
      breached: 101,
      csat: 4.1,
      status: 'Warning',
      leadEngineer: 'Joint Commissioner (Health & SWM)',
      budgetUtilized: '91.2%',
      primaryBottleneck: 'Compactor vehicle breakdown during secondary transfers',
      weeklyTrend: [90, 85, 95, 110, 105, 115, 120],
    },
    {
      id: 'Water',
      name: 'Water Supply & Sewerage (BWSSB)',
      slaCompliance: 81.4,
      mttr: '7.8 Hours',
      totalCases: 512,
      resolved: 417,
      breached: 95,
      csat: 3.8,
      status: 'At Risk',
      leadEngineer: 'Chief Eng. Maintenance (BWSSB)',
      budgetUtilized: '69.0%',
      primaryBottleneck: 'Trench digging road restoration clearance conflicts with BBMP',
      weeklyTrend: [50, 48, 62, 58, 70, 65, 74],
    },
    {
      id: 'Traffic',
      name: 'Traffic Police Civic Liaison',
      slaCompliance: 92.0,
      mttr: '4.0 Hours',
      totalCases: 230,
      resolved: 212,
      breached: 18,
      csat: 4.3,
      status: 'Target Met',
      leadEngineer: 'DCP Traffic Operations Desk',
      budgetUtilized: '62.5%',
      primaryBottleneck: 'Signals firmware synch & tow truck availability',
      weeklyTrend: [20, 22, 25, 24, 28, 29, 31],
    },
    {
      id: 'Forest',
      name: 'Forest & Tree Authority',
      slaCompliance: 87.2,
      mttr: '8.5 Hours',
      totalCases: 145,
      resolved: 126,
      breached: 19,
      csat: 4.2,
      status: 'Warning',
      leadEngineer: 'Deputy Conservator of Forests (BBMP)',
      budgetUtilized: '54.0%',
      primaryBottleneck: 'Hydraulic boom crane availability during high winds',
      weeklyTrend: [12, 14, 16, 18, 22, 20, 25],
    },
  ];

  const current = departments.find(d => d.id === selectedDept) || departments[0];

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      {/* Top Banner */}
      <div className="bg-surface border-b border-outline-variant/30 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">analytics</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">Inter-Agency Department Performance</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-secondary-container text-on-secondary-container font-mono">
              DEMONSTRATION DATA
            </span>
          </div>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Sample scorecard only; no operational department metrics, budget data, or agency integrations are connected.
          </p>
        </div>

        {/* Time Horizon Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-container p-0.5 rounded-lg text-xs font-semibold border border-outline-variant/40">
            <button
              onClick={() => setTimeHorizon('7d')}
              className={`px-3 py-1.5 rounded-md transition-colors ${timeHorizon === '7d' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeHorizon('30d')}
              className={`px-3 py-1.5 rounded-md transition-colors ${timeHorizon === '30d' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeHorizon('q3')}
              className={`px-3 py-1.5 rounded-md transition-colors ${timeHorizon === 'q3' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Q3 2026
            </button>
          </div>

          <button
            onClick={() => {
              const headers = ['Department', 'SLA Compliance (%)', 'MTTR', 'Total Cases', 'Resolved', 'Breached', 'CSAT', 'Status', 'Lead Engineer'];
              const rows = departments.map(d => [d.name, d.slaCompliance, d.mttr, d.totalCases, d.resolved, d.breached, d.csat, d.status, d.leadEngineer]);
              exportService.exportToCsv(`DEMO_Municipal_Scorecard_${timeHorizon}.csv`, headers, [['DEMONSTRATION DATA ONLY'], ...rows]);
              showToast('Sample Export Generated', 'Exported demonstration-only scorecard data.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container text-on-primary-container font-bold rounded-lg text-xs hover:brightness-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className="mx-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950">
        Every score, case count, SLA, budget figure, trend, staff name, and selected time period shown here is illustrative—not sourced from persisted complaints or agency systems.
      </div>

      {/* Aggregate City Scores Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 pb-2">
        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">City SLA Compliance</div>
            <div className="text-2xl font-bold text-secondary mt-1">91.8%</div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-xs">arrow_upward</span> +2.4% vs previous quarter
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary-container/40 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined">task_alt</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">Citywide Avg MTTR</div>
            <div className="text-2xl font-bold text-on-surface mt-1">4.2 Hours</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Target: &lt; 6.0 Hours</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
            <span className="material-symbols-outlined">timer</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">Aggregate Citizen CSAT</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">4.3 / 5.0</div>
            <div className="text-[11px] text-on-surface-variant mt-0.5">Based on 1,480 verified resident reviews</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
            <span className="material-symbols-outlined">star</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">Agency Conflict Flags</div>
            <div className="text-2xl font-bold text-tertiary mt-1">3 Active</div>
            <div className="text-[11px] text-tertiary font-medium mt-0.5">BBMP vs BWSSB Trench clearances</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined">alt_route</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Agency Scorecard Table + Detail Dossier */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Department List */}
        <div className="lg:col-span-7 bg-surface rounded-xl border border-outline-variant/30 shadow-xs flex flex-col">
          <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
            <h2 className="font-headline-md text-base font-bold text-on-surface">Agency SLA & Velocity League Table</h2>
            <span className="text-xs text-on-surface-variant font-mono">Sorted by Compliance</span>
          </div>

          <div className="divide-y divide-outline-variant/20 overflow-y-auto max-h-[580px]">
            {departments.map((dept) => {
              const isSelected = selectedDept === dept.id;

              return (
                <div
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.id)}
                  className={`p-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                    isSelected ? 'bg-secondary-container/20 border-l-4 border-l-secondary' : 'hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-md font-bold text-sm text-on-surface">{dept.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dept.status === 'Exceeding SLA' || dept.status === 'Target Met'
                          ? 'bg-emerald-100 text-emerald-800'
                          : dept.status === 'Warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {dept.status}
                      </span>
                    </div>

                    <div className="text-xs text-on-surface-variant mt-1 flex items-center gap-3">
                      <span>Total: <strong>{dept.totalCases}</strong></span>
                      <span>Resolved: <strong className="text-emerald-700">{dept.resolved}</strong></span>
                      <span>Breached: <strong className="text-red-600">{dept.breached}</strong></span>
                      <span>CSAT: <strong>{dept.csat} ★</strong></span>
                    </div>

                    {/* Progress Bar for SLA */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            dept.slaCompliance >= 90 ? 'bg-secondary' : dept.slaCompliance >= 85 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${dept.slaCompliance}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-on-surface">{dept.slaCompliance}%</span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="text-sm font-mono font-bold text-secondary">{dept.mttr}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase font-mono">Mean MTTR</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Agency In-Depth Audit Card */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-surface rounded-xl border border-outline-variant/30 p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-secondary">AGENCY AUDIT DOSSIER</span>
                <h3 className="font-headline-md text-lg font-bold text-on-surface mt-0.5">{current.name}</h3>
                <div className="text-xs text-on-surface-variant mt-0.5">{current.leadEngineer}</div>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-surface-container text-on-surface">
                {current.slaCompliance}% SLA
              </span>
            </div>

            {/* Metric Tiles */}
            <div className="grid grid-cols-3 gap-2 mt-4 bg-surface-container p-3 rounded-xl border border-outline-variant/20 text-center text-xs">
              <div>
                <div className="text-[10px] uppercase font-label-caps text-on-surface-variant">Mean Velocity</div>
                <div className="text-lg font-bold text-secondary">{current.mttr}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-label-caps text-on-surface-variant">Citizen CSAT</div>
                <div className="text-lg font-bold text-amber-600">{current.csat} ★</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-label-caps text-on-surface-variant">Budget Spend</div>
                <div className="text-lg font-bold text-on-surface">{current.budgetUtilized}</div>
              </div>
            </div>

            {/* Weekly Daily Throughput Simulation Bar Chart */}
            <div className="mt-5">
              <div className="text-xs font-semibold text-on-surface uppercase font-label-caps tracking-wider mb-2">
                Daily Resolution Velocity (Last 7 Days)
              </div>
              <div className="flex items-end justify-between gap-2 h-28 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                {current.weeklyTrend.map((val, idx) => {
                  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                  const heightPercent = Math.min(100, Math.round((val / 130) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[9px] font-mono font-semibold text-secondary">{val}</span>
                      <div className="w-full bg-secondary rounded-t transition-all" style={{ height: `${heightPercent}%` }} />
                      <span className="text-[10px] text-on-surface-variant font-mono">{days[idx]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operational Bottleneck Highlight */}
            <div className="mt-4 p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs">
              <div className="font-bold text-tertiary mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">build_circle</span>
                Current Operational Bottleneck
              </div>
              <p className="text-on-surface leading-relaxed">{current.primaryBottleneck}</p>
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                disabled
                title="Agency notice delivery is not connected"
                className="w-full py-2.5 px-4 rounded-lg bg-surface-container border border-outline-variant/40 font-bold text-xs text-on-surface-variant opacity-70 flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm text-tertiary">gavel</span>
                Notice delivery unavailable
              </button>

              <button
                onClick={() => {
                  setCurrentView('complaint_queue');
                }}
                className="w-full py-2 px-4 rounded-lg bg-secondary text-on-secondary font-bold text-xs hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">inbox</span>
                Open Active Queue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
