import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { INITIAL_HOTSPOTS } from '../../data/initialData';
import { HotspotCorridor } from '../../types';
import { exportService } from '../../services/exportService';

export const HotspotsAnalyticsView: React.FC = () => {
  const { showToast, hotspots } = useApp();

  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedCorridor, setSelectedCorridor] = useState<HotspotCorridor>(hotspots[0] || INITIAL_HOTSPOTS[0]);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'rapid' | 'stable'>('all');

  const filteredHotspots = hotspots.filter(h => {
    if (selectedZone !== 'All' && !h.zone.toLowerCase().includes(selectedZone.toLowerCase())) return false;
    if (filterSeverity === 'rapid' && h.velocityTrend !== 'Rapidly Escalating' && h.velocityTrend !== 'New Cluster') return false;
    if (filterSeverity === 'stable' && h.velocityTrend !== 'Stable High') return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      {/* Header Banner */}
      <div className="bg-surface border-b border-outline-variant/30 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-2xl">scatter_plot</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">Hotspot Corridor Analytics</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-tertiary-container text-on-tertiary-container font-mono">
              DEMONSTRATION DATA
            </span>
          </div>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Sample corridor analytics only; this view is not connected to complaint clustering or field dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              exportService.exportToPdf(
                'Corridor_Density_Briefing.pdf',
                'NagarSetu Municipal Hotspot Corridor Density Briefing',
                `Zone: ${selectedZone} • Analyzed Clusters: ${hotspots.length}`,
                [
                  `Primary Critical Cluster: ${selectedCorridor.name} (${selectedCorridor.zone})`,
                  `Velocity Trend: ${selectedCorridor.velocityTrend}`,
                  `Incident Density: ${selectedCorridor.totalComplaints} incidents / sq km`,
                  `Lead Agency: ${selectedCorridor.leadAgency}`,
                  `Contributing Root Factor: ${selectedCorridor.dominantIssue}`,
                  'Demonstration-only sample. No live clustering, safety scoring, or agency action has taken place.'
                ]
              );
              showToast('Export Generated', 'Corridor Density Briefing exported to PDF');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 rounded-lg text-xs font-semibold text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Brief
          </button>
          <button
            type="button"
            disabled
            title="Complaint-based corridor clustering is not implemented"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-on-surface-variant font-bold rounded-lg text-xs opacity-70 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Clustering unavailable
          </button>
        </div>
      </div>

      {/* Metric Tiles Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 pb-2">
        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">Sample Density Spread</div>
            <div className="text-2xl font-bold text-secondary mt-1">+14.2%</div>
            <div className="text-[11px] text-tertiary font-medium flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-xs">trending_up</span> Surge in 3 major arterials
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary-container/40 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined">hub</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">Sample P1 Hotspots</div>
            <div className="text-2xl font-bold text-tertiary mt-1">06 Corridors</div>
            <div className="text-[11px] text-on-surface-variant mt-0.5">Requiring joint BBMP + BWSSB rigs</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-tertiary-container/40 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined">warning</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">Sample Aggregated Reports</div>
            <div className="text-2xl font-bold text-on-surface mt-1">1,946 Cases</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">72% Auto-deduplicated</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
            <span className="material-symbols-outlined">dataset</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">Sample Inter-Agency SLA</div>
            <div className="text-2xl font-bold text-on-surface mt-1">3.4 Hours</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">48m faster than baseline</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
            <span className="material-symbols-outlined">speed</span>
          </div>
        </div>
      </div>

      <div className="mx-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950">
        All corridor names, counts, trends, SLA values, charts, and exported briefing values below are demonstration samples, not measured city data.
      </div>

      {/* Main Analysis Layout: Corridor List (Left) and Detail Drilldown (Right) */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Corridor Rankings Table */}
        <div className="lg:col-span-7 bg-surface rounded-xl border border-outline-variant/30 shadow-xs flex flex-col">
          <div className="p-4 border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-headline-md text-base font-bold text-on-surface">Ranked High-Risk Urban Corridors</h2>
            <div className="flex items-center gap-2">
              {/* Zone Filter */}
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-surface-container px-2.5 py-1 rounded-lg text-xs font-medium border border-outline-variant/40 text-on-surface outline-none"
              >
                <option value="All">All Zones</option>
                <option value="Mahadevapura">Mahadevapura</option>
                <option value="South">South Zone</option>
                <option value="East">East Zone</option>
                <option value="West">West Zone</option>
              </select>

              {/* Severity Quick Filter */}
              <button
                onClick={() => setFilterSeverity(filterSeverity === 'rapid' ? 'all' : 'rapid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  filterSeverity === 'rapid'
                    ? 'bg-tertiary-container text-on-tertiary-container font-bold border-tertiary'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant/40'
                }`}
              >
                Escalating Only
              </button>
            </div>
          </div>

          <div className="divide-y divide-outline-variant/20 overflow-y-auto max-h-[580px]">
            {filteredHotspots.map((corridor) => {
              const isSelected = selectedCorridor.corridorId === corridor.corridorId;

              return (
                <div
                  key={corridor.corridorId}
                  onClick={() => setSelectedCorridor(corridor)}
                  className={`p-4 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    isSelected ? 'bg-secondary-container/20 border-l-4 border-l-secondary' : 'hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-sm font-bold text-secondary bg-surface-container px-2 py-1 rounded">
                      {corridor.rank}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline-md font-bold text-sm text-on-surface">{corridor.name}</span>
                        <span className="font-mono text-[10px] text-on-surface-variant">[{corridor.corridorId}]</span>
                      </div>
                      <div className="text-xs text-on-surface-variant mt-0.5">{corridor.zone}</div>
                      <div className="text-xs text-on-surface mt-1.5 line-clamp-1">
                        <span className="font-semibold text-secondary">Core Defect: </span>
                        {corridor.dominantIssue}
                      </div>

                      {/* Micro Tags */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          corridor.velocityTrend === 'Rapidly Escalating' || corridor.velocityTrend === 'New Cluster'
                            ? 'bg-red-100 text-red-800'
                            : corridor.velocityTrend === 'Stable High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          <span className="material-symbols-outlined text-[12px]">
                            {corridor.velocityTrend.includes('Escalating') ? 'trending_up' : 'trending_flat'}
                          </span>
                          {corridor.velocityTrend}
                        </span>
                        <span className="text-[11px] font-mono font-medium text-tertiary">{corridor.growthPct}</span>
                        <span className="text-[11px] text-on-surface-variant">• Lead: {corridor.leadAgency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="text-base font-bold text-on-surface">{corridor.totalComplaints}</span>
                    <span className="text-[10px] text-on-surface-variant font-mono uppercase">Reports</span>
                    {corridor.emergencyCount > 0 && (
                      <span className="mt-1.5 px-1.5 py-0.5 rounded bg-tertiary text-on-tertiary text-[10px] font-bold">
                        {corridor.emergencyCount} P1 Crits
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Corridor Deep-Dive Dossier */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Corridor Profile Card */}
          <div className="bg-surface rounded-xl border border-outline-variant/30 p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-secondary">{selectedCorridor.rank} • CORRIDOR DOSSIER</span>
                <h3 className="font-headline-md text-lg font-bold text-on-surface mt-0.5">{selectedCorridor.name}</h3>
                <div className="text-xs text-on-surface-variant mt-0.5">{selectedCorridor.zone} • Sector ID: {selectedCorridor.corridorId}</div>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                selectedCorridor.velocityTrend.includes('Escalating') ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedCorridor.velocityTrend}
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 mt-4 bg-surface-container p-3 rounded-xl border border-outline-variant/20 text-center">
              <div>
                <div className="text-[10px] uppercase font-label-caps text-on-surface-variant">Complaint Vol</div>
                <div className="text-lg font-bold text-secondary">{selectedCorridor.totalComplaints}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-label-caps text-on-surface-variant">Cycle Growth</div>
                <div className="text-lg font-bold text-tertiary">{selectedCorridor.growthPct}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-label-caps text-on-surface-variant">P1 Emergencies</div>
                <div className="text-lg font-bold text-red-600">{selectedCorridor.emergencyCount}</div>
              </div>
            </div>

            {/* Root Cause Matrix */}
            <div className="mt-4">
              <div className="text-xs font-semibold text-on-surface uppercase font-label-caps tracking-wider mb-2">
                Compounding Root Causes
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-medium text-on-surface">Subterranean Drain Cavitation</span>
                    <span className="font-mono font-bold text-secondary">42%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: '42%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-medium text-on-surface">Heavy Freight Axle Loading Overstress</span>
                    <span className="font-mono font-bold text-tertiary">28%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-tertiary rounded-full" style={{ width: '28%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-medium text-on-surface">Cable Trench Incomplete Restoration</span>
                    <span className="font-mono font-bold text-amber-600">18%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '18%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-medium text-on-surface">Solid Waste Culvert Choking</span>
                    <span className="font-mono font-bold text-slate-600">12%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-slate-500 rounded-full" style={{ width: '12%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Dominant Defect Detail */}
            <div className="mt-4 p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs">
              <div className="font-bold text-secondary mb-1">Dominant Structural Incident:</div>
              <p className="text-on-surface leading-relaxed">{selectedCorridor.dominantIssue}</p>
              <p className="text-on-surface-variant mt-1 text-[11px]">Secondary consequence: {selectedCorridor.subIssue}</p>
            </div>

            {/* Action Triggers */}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                disabled
                title="Field taskforce dispatch is not connected"
                className="w-full py-2.5 px-4 rounded-lg bg-surface-container text-on-surface-variant font-bold text-xs flex items-center justify-center gap-2 opacity-70 cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">campaign</span>
                Dispatch unavailable (demonstration data)
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled
                  title="Demonstration hotspot records are not linked to persisted complaint locations"
                  className="py-2 px-3 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-medium text-on-surface-variant opacity-70 cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">map</span>
                  Map unavailable (demo data)
                </button>
                <button
                  type="button"
                  disabled
                  title="Agency notices are not connected to a backend workflow"
                  className="py-2 px-3 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-medium text-on-surface-variant opacity-70 cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">gavel</span>
                  Agency notice unavailable
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
