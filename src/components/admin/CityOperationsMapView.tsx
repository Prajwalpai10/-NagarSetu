import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Complaint } from '../../types';

export const CityOperationsMapView: React.FC = () => {
  const {
    complaints,
    complaintLoadError,
    isComplaintsLoading,
    persona,
    refreshComplaints,
    setSelectedTicketId,
    setCurrentView,
  } = useApp();

  const [selectedZone, setSelectedZone] = useState<string>('All Zones');
  const [selectedLayer, setSelectedLayer] = useState<'all' | 'potholes' | 'water' | 'sanitation' | 'electrical'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'P1' | 'P2' | 'P3'>('all');
  const [selectedPin, setSelectedPin] = useState<Complaint | null>(complaints[0] || null);

  const zones = ['All Zones', ...new Set(complaints.map(complaint => complaint.zone).filter(Boolean))];

  const filteredComplaints = complaints.filter(c => {
    if (selectedZone !== 'All Zones' && c.zone !== selectedZone) return false;
    if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
    if (selectedLayer === 'potholes' && !c.category.toLowerCase().includes('road')) return false;
    if (selectedLayer === 'water' && !c.category.toLowerCase().includes('water')) return false;
    if (selectedLayer === 'sanitation' && !c.category.toLowerCase().includes('garbage')) return false;
    if (selectedLayer === 'electrical' && !c.category.toLowerCase().includes('light')) return false;
    return true;
  });

  const handleInspectTicket = (ticket: Complaint) => {
    setSelectedPin(ticket);
    setSelectedTicketId(ticket.id);
  };

  const handleDeepDive = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    if (persona === 'admin') setCurrentView('admin_complaints', { id: ticketId });
    else setCurrentView('incident_dossier', { id: ticketId });
  };

  useEffect(() => {
    setSelectedPin(current => current
      ? filteredComplaints.find(complaint => complaint.id === current.id) ?? filteredComplaints[0] ?? null
      : filteredComplaints[0] ?? null);
  }, [filteredComplaints]);

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      {/* Top Banner / Map Header */}
      <div className="bg-surface border-b border-outline-variant/30 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">public</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">City Operations Map</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              Complaint records only
            </span>
          </div>
          <p className="text-on-surface-variant text-sm mt-0.5">
            The list and record details use authorized API-visible complaints. Canvas, roads, ward shapes, and distributed marker positions are illustrative—not geographic complaint coordinates.
          </p>
        </div>

        {/* Quick Map Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30 text-center">
            <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">Matching Records</div>
            <div className="font-bold text-lg text-secondary">{filteredComplaints.length}</div>
          </div>
          <div className="bg-tertiary-container/30 px-3 py-1.5 rounded-lg border border-tertiary/20 text-center">
            <div className="text-xs text-tertiary font-medium uppercase font-label-caps">P1 Records</div>
            <div className="font-bold text-lg text-tertiary">
              {filteredComplaints.filter(c => c.priority === 'P1').length}
            </div>
          </div>
          <div className="bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30 text-center">
            <div className="text-xs text-on-surface-variant font-medium uppercase font-label-caps">Field Crews</div>
            <div className="font-bold text-lg text-on-surface">Unavailable</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-amber-50 text-amber-950 border-b border-amber-200 text-sm">
        <p role={complaintLoadError ? 'alert' : 'status'}>
          {complaintLoadError
            ? `Complaint records could not be loaded: ${complaintLoadError}`
            : isComplaintsLoading
              ? 'Loading authorized complaint records…'
              : `${complaints.length} authorized complaint record${complaints.length === 1 ? '' : 's'} loaded. Map geometry and marker placement are illustrative only.`}
        </p>
        <button
          type="button"
          onClick={() => void refreshComplaints()}
          disabled={isComplaintsLoading}
          className="rounded-lg border border-amber-300 px-3 py-1.5 font-semibold hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isComplaintsLoading ? 'Refreshing…' : 'Refresh records'}
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-surface-container-low px-6 py-3 border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Zone Selector */}
          <div className="flex items-center gap-1 bg-surface rounded-lg px-2.5 py-1.5 border border-outline-variant/40">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">location_city</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-transparent font-medium text-on-surface text-xs outline-none cursor-pointer"
            >
              {zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {/* Layer Filter Buttons */}
          <div className="flex items-center bg-surface rounded-lg p-0.5 border border-outline-variant/40">
            <button
              onClick={() => setSelectedLayer('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${selectedLayer === 'all' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              All Layers
            </button>
            <button
              onClick={() => setSelectedLayer('potholes')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${selectedLayer === 'potholes' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Roads/Potholes
            </button>
            <button
              onClick={() => setSelectedLayer('water')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${selectedLayer === 'water' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Water/Drains
            </button>
            <button
              onClick={() => setSelectedLayer('sanitation')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${selectedLayer === 'sanitation' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Solid Waste
            </button>
            <button
              onClick={() => setSelectedLayer('electrical')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${selectedLayer === 'electrical' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Streetlights
            </button>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center bg-surface rounded-lg p-0.5 border border-outline-variant/40">
            {(['all', 'P1', 'P2', 'P3'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2 py-1 rounded text-xs font-medium uppercase transition-colors ${
                  priorityFilter === p ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Unsupported overlays are disclosed rather than presented as live GIS. */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            title="A complaint-density heatmap is not implemented"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-outline-variant/40 bg-surface text-on-surface-variant opacity-70 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">local_fire_department</span>
            Heatmap unavailable
          </button>

          <button
            disabled
            title="Crew GPS telemetry is not connected"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-outline-variant/40 text-on-surface-variant opacity-70 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">local_shipping</span>
            Crew Telemetry unavailable
          </button>
        </div>
      </div>

      {/* Main Map Content Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden" style={{ minHeight: '620px' }}>
        {/* Interactive Spatial Canvas */}
        <div className="flex-1 relative bg-[#0f172a] overflow-hidden select-none">
          {/* Map Grid Pattern Background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, #0f172a 1px)',
              backgroundSize: '40px 40px',
              backgroundPosition: '0 0, 20px 20px',
            }}
          />

          {/* SVG Road Network & Ward Polygons */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            {/* Simulated Bangalore Arterial Grid lines */}
            <path d="M 50,180 Q 280,160 520,240 T 950,220" stroke="#334155" strokeWidth="4" fill="none" strokeDasharray="6,4" />
            <path d="M 120,40 Q 300,260 480,480 T 820,590" stroke="#334155" strokeWidth="6" fill="none" />
            <path d="M 40,360 Q 340,340 680,380 T 1100,320" stroke="#475569" strokeWidth="5" fill="none" />
            <path d="M 380,80 Q 420,320 460,540" stroke="#475569" strokeWidth="4" fill="none" />
            <path d="M 680,100 Q 720,310 760,560" stroke="#334155" strokeWidth="4" fill="none" strokeDasharray="8,4" />

            {/* Ward Boundaries (Stylized Polygons) */}
            <polygon points="180,120 420,110 460,320 220,340" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.3" fill="#0ea5e9" fillOpacity="0.04" />
            <polygon points="420,110 780,130 820,360 460,320" stroke="#10b981" strokeWidth="1" strokeOpacity="0.3" fill="#10b981" fillOpacity="0.04" />
            <polygon points="220,340 460,320 490,560 210,540" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.3" fill="#f59e0b" fillOpacity="0.04" />
            <polygon points="460,320 820,360 860,570 490,560" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.3" fill="#a855f7" fillOpacity="0.04" />

            {/* Ward Labels */}
            <text x="240" y="150" fill="#94a3b8" fontSize="12" fontFamily="monospace" fontWeight="bold">WARD 12 • INDIRANAGAR</text>
            <text x="520" y="150" fill="#94a3b8" fontSize="12" fontFamily="monospace" fontWeight="bold">WARD 84 • HAL AIRPORT</text>
            <text x="260" y="470" fill="#94a3b8" fontSize="12" fontFamily="monospace" fontWeight="bold">WARD 151 • KORAMANGALA</text>
            <text x="560" y="470" fill="#94a3b8" fontSize="12" fontFamily="monospace" fontWeight="bold">WARD 174 • HSR LAYOUT</text>
          </svg>

          {/* Illustrative marker placement: positions below do not represent complaint coordinates. */}
          <div className="absolute inset-0">
            {filteredComplaints.map((complaint, index) => {
              // Derive pseudo visual coordinates across canvas
              const posX = 160 + ((index * 137) % 680);
              const posY = 130 + ((index * 93) % 400);
              const isSelected = selectedPin?.id === complaint.id;

              return (
                <div
                  key={complaint.id}
                  onClick={() => handleInspectTicket(complaint)}
                  style={{ left: `${posX}px`, top: `${posY}px` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                >
                  {/* Glowing Radar Ring for P1 */}
                  {complaint.priority === 'P1' && (
                    <span className="absolute -inset-2 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
                  )}

                  {/* Pin Body */}
                  <div
                    className={`relative flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-125 ${
                      isSelected ? 'ring-4 ring-white scale-125' : ''
                    } ${
                      complaint.priority === 'P1'
                        ? 'bg-red-600 text-white w-9 h-9'
                        : complaint.priority === 'P2'
                        ? 'bg-amber-500 text-white w-8 h-8'
                        : 'bg-sky-600 text-white w-7 h-7'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {complaint.category.includes('Road') ? 'warning' :
                       complaint.category.includes('Water') ? 'water_drop' :
                       complaint.category.includes('Garbage') ? 'delete' : 'bolt'}
                    </span>
                  </div>

                  {/* Pin Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-slate-900/95 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-xl border border-slate-700 pointer-events-none whitespace-nowrap z-30">
                    <div className="font-bold flex items-center gap-1">
                      <span className={`px-1 rounded text-[10px] ${
                        complaint.priority === 'P1' ? 'bg-red-500 text-white' : 'bg-amber-400 text-slate-900'
                      }`}>
                        {complaint.priority}
                      </span>
                      <span>{complaint.id}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 max-w-xs truncate">{complaint.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Illustrative position only</div>
                  </div>
                </div>
              );
            })}

          </div>

          {/* Map Controls Floating Overlay */}
          <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur text-white p-3 rounded-xl border border-slate-700 text-xs shadow-xl flex flex-col gap-2">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Active Legend</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
              <span className="text-slate-200">P1 Emergency Critical (&lt; 4h)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
              <span className="text-slate-200">P2 High Escalation (&lt; 12h)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-500 shadow-sm" />
              <span className="text-slate-200">P3 Routine Civic (&lt; 24h)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 shadow-sm" />
              <span className="text-slate-200">Field Crew Transponder</span>
            </div>
          </div>
        </div>

        {/* Selected Incident Telemetry Drawer (Right Column) */}
        <div className="w-full lg:w-96 bg-surface border-l border-outline-variant/30 flex flex-col justify-between p-5 overflow-y-auto">
          {selectedPin ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      selectedPin.priority === 'P1'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {selectedPin.priority} PRIORITY
                    </span>
                    <span className="font-mono text-xs font-bold text-on-surface-variant">{selectedPin.id}</span>
                  </div>
                  <h3 className="font-headline-md text-base font-bold text-on-surface mt-1.5 leading-snug">
                    {selectedPin.title}
                  </h3>
                </div>
                <span className="material-symbols-outlined text-secondary text-2xl">location_on</span>
              </div>

              <div className="bg-surface-container p-3 rounded-xl border border-outline-variant/30 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Location:</span>
                  <span className="font-medium text-on-surface text-right truncate max-w-[200px]">{selectedPin.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Ward / Zone:</span>
                  <span className="font-medium text-on-surface">{selectedPin.ward}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Stored SLA field:</span>
                  <span className="font-bold text-tertiary">{selectedPin.slaRemaining || 'Unavailable'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Department:</span>
                  <span className="font-medium text-on-surface">{selectedPin.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Assigned Unit:</span>
                  <span className="font-medium text-on-surface">{selectedPin.assignedCrew || 'Unavailable'}</span>
                </div>
              </div>

              {/* Photo Preview if available */}
              {selectedPin.photos && selectedPin.photos.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-on-surface-variant mb-1.5">Visual Geotagged Evidence</div>
                  <img
                    src={selectedPin.photos[0]}
                    alt="Civic damage"
                    className="w-full h-36 object-cover rounded-xl border border-outline-variant/30 shadow-sm"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <div className="text-xs font-semibold text-on-surface-variant mb-1">Citizen Narrative</div>
                <p className="text-xs text-on-surface leading-relaxed bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/20">
                  {selectedPin.description}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleDeepDive(selectedPin.id)}
                  className="w-full py-2.5 px-4 rounded-lg bg-secondary text-on-secondary font-semibold text-xs hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  {persona === 'admin' ? 'Open complaint details' : 'Open incident dossier'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled
                    title="Crew dispatch integration is not connected"
                    className="py-2 px-3 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-medium text-on-surface-variant opacity-70 cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm text-emerald-600">navigation</span>
                    Crew routing unavailable
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Zonal escalation notice integration is not connected"
                    className="py-2 px-3 rounded-lg bg-tertiary-container/40 border border-tertiary/20 text-xs font-medium text-on-tertiary-container opacity-70 cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm text-tertiary">priority_high</span>
                    Notice unavailable
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 text-outline">location_off</span>
              <p className="text-sm font-medium">Select an illustrative record marker to inspect its API-returned complaint details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
