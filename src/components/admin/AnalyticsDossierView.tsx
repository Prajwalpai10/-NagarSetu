import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportService } from '../../services/exportService';

export const AnalyticsDossierView: React.FC = () => {
  const { showToast } = useApp();

  const [activeCycle, setActiveCycle] = useState<'month' | 'quarter' | 'year'>('month');

  const categoryBreakdown = [
    { name: 'Roads & Asphalt Cavities', count: 842, pct: 38, color: 'bg-amber-600' },
    { name: 'Solid Waste & Street Sanitation', count: 576, pct: 26, color: 'bg-emerald-600' },
    { name: 'Streetlights & Electrical Grid', count: 398, pct: 18, color: 'bg-sky-600' },
    { name: 'Water Pipelines & Sewerage', count: 265, pct: 12, color: 'bg-indigo-600' },
    { name: 'Parks, Encroachments & Other', count: 133, pct: 6, color: 'bg-slate-500' },
  ];

  const zonalStressIndex = [
    { zone: 'Mahadevapura (Tech Corridor)', score: 88, status: 'Severe Stress', complaints: 642, mttr: '4.8h' },
    { zone: 'East Zone (Indiranagar / HAL)', score: 76, status: 'High Stress', complaints: 489, mttr: '3.2h' },
    { zone: 'South Zone (Koramangala / HSR)', score: 71, status: 'High Stress', complaints: 421, mttr: '3.6h' },
    { zone: 'West Zone (Malleshwaram)', score: 54, status: 'Moderate', complaints: 290, mttr: '2.8h' },
    { zone: 'Bommanahalli Zone', score: 68, status: 'Elevated', complaints: 375, mttr: '4.1h' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      {/* Header Banner */}
      <div className="bg-surface border-b border-outline-variant/30 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">description</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">City Operations Intelligence Dossier</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-surface-container text-on-surface font-mono">
              DEMONSTRATION DATA
            </span>
          </div>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Illustrative analytics only; this dossier is not connected to operational complaint or agency data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-container p-0.5 rounded-lg text-xs font-semibold border border-outline-variant/40">
            <button
              onClick={() => setActiveCycle('month')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeCycle === 'month' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              October 2026
            </button>
            <button
              onClick={() => setActiveCycle('quarter')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeCycle === 'quarter' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Q3 2026
            </button>
            <button
              onClick={() => setActiveCycle('year')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeCycle === 'year' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              YTD 2026
            </button>
          </div>

          <button
            onClick={() => {
              exportService.exportToPdf(
                `DEMO_Municipal_Intelligence_Dossier_${activeCycle}.pdf`,
                'DEMONSTRATION ONLY — NagarSetu Operations Intelligence Dossier',
                `Illustrative values only • Selected sample cycle: ${activeCycle.toUpperCase()}`,
                [
                  'Executive KPI: Total Civic Intakes - 2,214 grievances recorded',
                  'Composite SLA Compliance: 91.8% (-8.2% reduction vs monsoon peak)',
                  'Dominant Category: Roads & Asphalt Cavities (38% of intake load)',
                  'Highest Stress Zone: Mahadevapura (Tech Corridor) - Stress Score 88/100',
                  'Statutory MTTR Benchmark: 3.8 Hours across 198 Wards',
                  'Ombudsman Escalation Rate: 2.1% of all logged cases',
                  'Citizen Satisfaction (CSAT): 4.4 / 5.0 across verified completions'
                ]
              );
              showToast('Sample Dossier Generated', 'Exported demonstration-only analytics values.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container text-on-primary-container font-bold rounded-lg text-xs hover:brightness-95 transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            Download PDF
          </button>
        </div>
      </div>

      <div className="mx-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950">
        Every intake total, trend, AI metric, SLA figure, citizen rating, zone score, and export value in this dossier is demonstration data—not verified operating statistics.
      </div>

      {/* Top Level Strategic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 pb-2">
        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-xs">
          <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">Total Civic Intakes</div>
          <div className="text-2xl font-bold text-on-surface mt-1">2,214</div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-xs">trending_down</span> -8.2% vs previous monsoon cycle
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-xs">
          <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">AI Triage Precision</div>
          <div className="text-2xl font-bold text-secondary mt-1">94.6%</div>
          <div className="text-[11px] text-on-surface-variant mt-0.5">1,420 duplicate tickets auto-merged</div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-xs">
          <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">Avg Civic MTTR</div>
          <div className="text-2xl font-bold text-on-surface mt-1">3.8 Hours</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Statutory compliance at 92.4%</div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-xs">
          <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">Citizen Satisfaction</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">4.4 / 5.0</div>
          <div className="text-[11px] text-on-surface-variant mt-0.5">86% positive resolution reviews</div>
        </div>
      </div>

      {/* Section 1: Grievance Category Breakdown + AI Precision Audit */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-7 bg-surface rounded-xl border border-outline-variant/30 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-base font-bold text-on-surface">Civic Intake Categorization Distribution</h2>
            <span className="text-xs font-mono text-on-surface-variant">2,214 Processed</span>
          </div>

          {/* Visual Stacked Bar */}
          <div className="h-4 rounded-full flex overflow-hidden w-full mb-5">
            {categoryBreakdown.map((cat, idx) => (
              <div
                key={idx}
                className={`${cat.color} h-full transition-all`}
                style={{ width: `${cat.pct}%` }}
                title={`${cat.name}: ${cat.pct}%`}
              />
            ))}
          </div>

          {/* Category List */}
          <div className="space-y-3">
            {categoryBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-container-low border border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="font-medium text-on-surface">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-on-surface-variant">{item.count} tickets</span>
                  <span className="font-mono font-bold text-secondary">{item.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Triage Audit Cockpit */}
        <div className="lg:col-span-5 bg-surface rounded-xl border border-outline-variant/30 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-secondary">ALGORITHMIC TRIAGE AUDIT</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                ACTIVE V4 MODEL
              </span>
            </div>
            <h3 className="font-headline-md text-base font-bold text-on-surface mt-1">Multi-Modal Computer Vision & GIS Engine</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Automated image classification, surface void depth estimation, and duplicate deduplication cluster verification.
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/30">
                <div className="flex justify-between font-bold text-on-surface">
                  <span>Photo Defect Recognition</span>
                  <span className="text-secondary font-mono">96.2% Precision</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Accurate asphalt void detection on 1,820 camera uploads</p>
              </div>

              <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/30">
                <div className="flex justify-between font-bold text-on-surface">
                  <span>Department Routing Auto-Match</span>
                  <span className="text-secondary font-mono">94.1% Accuracy</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Correct municipal jurisdiction routing without manual re-tagging</p>
              </div>

              <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/30">
                <div className="flex justify-between font-bold text-on-surface">
                  <span>Duplicate Cluster Compression</span>
                  <span className="text-secondary font-mono">1,420 Merged</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Reduced redundant dispatch truck deployments by 34%</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled
            title="AI routing configuration is not connected"
            className="mt-4 w-full py-2 px-3 rounded-lg bg-surface-container border border-outline-variant/40 text-xs font-bold text-on-surface-variant opacity-70 cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm text-secondary">tune</span>
            AI routing configuration unavailable
          </button>
        </div>
      </div>

      {/* Section 2: Zonal Infrastructure Stress Index */}
      <div className="p-6 pt-0">
        <div className="bg-surface rounded-xl border border-outline-variant/30 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-headline-md text-base font-bold text-on-surface">Zonal Civic Infrastructure Stress Index</h2>
              <p className="text-xs text-on-surface-variant">Combined index based on complaint recurrence, arterial traffic flow, and storm drainage load</p>
            </div>
            <span className="font-mono text-xs text-on-surface-variant">8 Municipal Zones Monitored</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {zonalStressIndex.map((zone, idx) => (
              <div key={idx} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-on-surface line-clamp-1">{zone.zone}</div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold font-mono text-secondary">{zone.score}</span>
                    <span className="text-[10px] text-on-surface-variant font-mono">/ 100</span>
                  </div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                    zone.score >= 80 ? 'bg-red-100 text-red-800' : zone.score >= 70 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {zone.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/20 text-[11px] text-on-surface-variant space-y-1">
                  <div className="flex justify-between">
                    <span>Intake Vol:</span>
                    <span className="font-mono font-medium text-on-surface">{zone.complaints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mean MTTR:</span>
                    <span className="font-mono font-medium text-on-surface">{zone.mttr}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
