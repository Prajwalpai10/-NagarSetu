import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const NearbyIssuesView: React.FC = () => {
  const { setCurrentView, setSelectedTicketId, upvoteComplaint, showToast } = useApp();

  const [radius, setRadius] = useState('800');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeMapLayer, setActiveMapLayer] = useState<'cadastral' | 'satellite' | 'density'>('cadastral');
  const [selectedPin, setSelectedPin] = useState<string>('NS-8842');
  const [linkedTickets, setLinkedTickets] = useState<{ [id: string]: boolean }>({});

  const handleLinkTicket = (ticketId: string) => {
    setLinkedTickets(prev => ({ ...prev, [ticketId]: true }));
    upvoteComplaint('CMP-2026-01482');
    showToast('Report Linked', `Your issue was linked to ${ticketId}. Collective priority boosted.`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-space-md pb-space-xl">
      {/* Top Utility Sub-Header */}
      <section className="w-full p-space-sm bg-surface-container-low rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-space-sm">
        <div className="flex flex-wrap items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
          <button onClick={() => setCurrentView('citizen_home')} className="font-medium hover:text-on-surface cursor-pointer">Citizen Services</button>
          <span className="material-symbols-outlined text-sm text-on-surface-variant/60">chevron_right</span>
          <span className="font-medium hover:text-on-surface">Community Pulse</span>
          <span className="material-symbols-outlined text-sm text-on-surface-variant/60">chevron_right</span>
          <span className="font-semibold text-secondary">Nearby Issues</span>
        </div>
        <div className="inline-flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-highest rounded text-on-surface">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="font-code-badge text-code-badge tracking-tight">Ward 12, Indiranagar • Search Radius: {radius}m</span>
        </div>
      </section>

      {/* Page Title & Operational Control Banner */}
      <header className="pt-space-xs flex flex-col lg:flex-row lg:items-end lg:justify-between gap-space-md">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-space-xs px-space-xs py-0.5 mb-space-xs bg-secondary-container/60 rounded">
            <span className="material-symbols-outlined text-secondary text-base">radar</span>
            <span className="font-label-caps text-label-caps uppercase text-on-secondary-container font-bold">Neighbourhood Issues Map</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">Issues Near You</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            See reported civic issues in your neighbourhood, monitor live crew progress, and upvote or link reports to accelerate municipal resolution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm shrink-0">
          <div className="relative inline-flex items-center bg-surface-container-lowest shadow-sm rounded">
            <span className="material-symbols-outlined text-on-surface-variant pl-space-sm text-lg">explore</span>
            <select
              aria-label="Select Radius"
              value={radius}
              onChange={(e) => {
                setRadius(e.target.value);
                showToast('Radius Adjusted', `Showing issues within ${e.target.value}m radius`);
              }}
              className="bg-transparent pl-space-xs pr-8 py-2 font-body-sm text-body-sm font-semibold text-on-surface focus:outline-none cursor-pointer appearance-none"
            >
              <option value="500">Radius: 500m (Immediate)</option>
              <option value="800">Radius: 800m (Sector)</option>
              <option value="1200">Radius: 1.2km (Ward Bound)</option>
            </select>
            <span className="material-symbols-outlined text-on-surface-variant text-base absolute right-space-xs pointer-events-none">expand_more</span>
          </div>

          <button
            onClick={() => setCurrentView('report_issue')}
            className="inline-flex items-center gap-space-xs px-space-md py-2 bg-primary-container text-on-primary-container font-body-md text-body-md font-bold rounded shadow-sm hover:brightness-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>+ Report an Issue</span>
          </button>
        </div>
      </header>

      {/* Filter Chips Bar */}
      <section className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-xs overflow-x-auto pb-1 xl:pb-0">
          {[
            { name: 'All', count: 9 },
            { name: 'Roads', count: 3 },
            { name: 'Waste', count: 2 },
            { name: 'Water', count: 1 },
            { name: 'Streetlights', count: 2 },
            { name: 'Traffic', count: 1 },
            { name: 'Emergency', count: 0 },
          ].map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(cat.name)}
                className={`px-space-md py-1.5 rounded-full font-body-sm text-body-sm font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-secondary text-on-secondary shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full font-code-badge text-[0.6875rem] ${isActive ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-space-xs text-on-surface-variant font-code-badge text-code-badge shrink-0">
          <div className="flex items-center gap-1.5 px-space-sm py-1 bg-surface-container-lowest rounded shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <span className="font-semibold text-on-surface">4</span>
            <span>In Progress / Field Unit</span>
          </div>
          <div className="flex items-center gap-1.5 px-space-sm py-1 bg-surface-container-lowest rounded shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-semibold text-on-surface">3</span>
            <span>Resolved (48h)</span>
          </div>
          <div className="flex items-center gap-1.5 px-space-sm py-1 bg-surface-container-lowest rounded shadow-sm">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <span className="font-semibold text-on-surface">2</span>
            <span>Pending Triage</span>
          </div>
        </div>
      </section>

      {/* Split Main Workspace */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* LEFT: GIS CADASTRAL MAP VIEW */}
        <div className="lg:col-span-7 flex flex-col gap-space-sm">
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-md overflow-hidden relative min-h-[640px] flex flex-col justify-between">
            {/* Map Controls Toolbar */}
            <div className="absolute top-space-md left-space-md right-space-md z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-xs">
              <div className="flex items-center bg-surface/95 backdrop-blur-md px-space-md py-2 rounded shadow-md w-full sm:w-80">
                <span className="material-symbols-outlined text-secondary text-lg mr-space-xs">search</span>
                <input
                  type="text"
                  placeholder="Search street, metro pillar, park..."
                  className="w-full bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 self-end sm:self-auto bg-surface/95 backdrop-blur-md p-1 rounded shadow-md">
                <button
                  type="button"
                  onClick={() => setActiveMapLayer('cadastral')}
                  className={`px-space-sm py-1 rounded font-label-caps text-label-caps uppercase flex items-center gap-1 cursor-pointer ${activeMapLayer === 'cadastral' ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant hover:bg-surface-container'}`}
                >
                  <span className="material-symbols-outlined text-sm">map</span>
                  <span>Cadastral</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMapLayer('satellite')}
                  className={`px-space-sm py-1 rounded font-label-caps text-label-caps uppercase flex items-center gap-1 cursor-pointer ${activeMapLayer === 'satellite' ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant hover:bg-surface-container'}`}
                >
                  <span className="material-symbols-outlined text-sm">satellite_alt</span>
                  <span>Satellite</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMapLayer('density')}
                  className={`px-space-sm py-1 rounded font-label-caps text-label-caps uppercase flex items-center gap-1 cursor-pointer ${activeMapLayer === 'density' ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant hover:bg-surface-container'}`}
                >
                  <span className="material-symbols-outlined text-sm">bubble_chart</span>
                  <span>Density</span>
                </button>
              </div>
            </div>

            {/* Stylized GIS Map Canvas */}
            <div className={`relative w-full h-[640px] bg-[#EEF2EB] overflow-hidden select-none transition-all ${activeMapLayer === 'satellite' ? 'contrast-125 saturate-110' : ''}`}>
              <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="urbanGridNearby" width="40" height="40" patternUnits="userSpaceOnUse">
                    <rect width="39" height="39" fill="#F8FAF5" opacity="0.6" rx="2"></rect>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#urbanGridNearby)"></rect>

                {/* Parks / Water */}
                <path d="M 40,80 Q 140,60 210,120 T 260,250 T 120,310 Z" fill="#D3E8D7" opacity="0.85"></path>
                <path d="M 520,340 Q 640,300 700,380 T 680,520 T 560,540 Z" fill="#D3E8D7" opacity="0.85"></path>
                <path d="M 460,90 Q 560,70 610,140 T 540,210 T 420,160 Z" fill="#D2E7ED" opacity="0.9"></path>

                {/* Major Roads */}
                <line x1="10" y1="20" x2="720" y2="580" stroke="#FFFFFF" strokeWidth="26"></line>
                <line x1="10" y1="20" x2="720" y2="580" stroke="#DFE3D8" strokeWidth="28" strokeDasharray="8 6" opacity="0.4"></line>
                <line x1="0" y1="360" x2="800" y2="330" stroke="#FFFFFF" strokeWidth="22"></line>
                <line x1="380" y1="0" x2="410" y2="650" stroke="#FFFFFF" strokeWidth="20"></line>

                {/* Metro Purple Line */}
                <line x1="5" y1="365" x2="795" y2="335" stroke="#7E57C2" strokeWidth="4" strokeDasharray="10 4" opacity="0.8"></line>

                {/* 500m & 800m Radius Circles */}
                <circle cx="340" cy="330" r="180" fill="none" stroke="#3C6754" strokeWidth="2" strokeDasharray="6 4" opacity="0.7"></circle>
                <circle cx="340" cy="330" r="260" fill="none" stroke="#7F5700" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.45"></circle>

                {/* Density Heatmap Gradients if density layer active */}
                {activeMapLayer === 'density' && (
                  <circle cx="260" cy="230" r="120" fill="red" opacity="0.25"></circle>
                )}
              </svg>

              {/* Geographic Labels */}
              <div className="absolute top-28 left-16 pointer-events-none">
                <span className="font-code-badge text-[0.625rem] text-secondary font-bold uppercase tracking-wider bg-surface-container-lowest/80 px-1 rounded shadow-sm">
                  Defense Colony Park
                </span>
              </div>
              <div className="absolute top-36 right-36 pointer-events-none">
                <span className="font-code-badge text-[0.625rem] text-on-surface-variant font-bold uppercase tracking-wider bg-surface-container-lowest/80 px-1 rounded shadow-sm">
                  Halasuru Lake Catchment
                </span>
              </div>
              <div className="absolute top-[370px] left-8 pointer-events-none">
                <span className="font-code-badge text-[0.625rem] text-on-surface-variant font-bold uppercase tracking-wider bg-surface-container-lowest/80 px-1 rounded shadow-sm">
                  Indiranagar Metro Axis (100ft Rd)
                </span>
              </div>

              {/* USER HOME PIN */}
              <div className="absolute top-[320px] left-[330px] z-20 flex flex-col items-center group -translate-x-1/2 -translate-y-1/2">
                <div className="relative flex items-center justify-center">
                  <span className="w-8 h-8 rounded-full bg-secondary/25 animate-ping absolute"></span>
                  <div className="w-9 h-9 rounded-full bg-secondary text-on-secondary shadow-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">home_pin</span>
                  </div>
                </div>
                <div className="mt-1 px-1.5 py-0.5 bg-secondary text-on-secondary rounded text-[0.625rem] font-code-badge font-bold whitespace-nowrap shadow">
                  You (Sector 04, Ward 12)
                </div>
              </div>

              {/* MARKER 1 (ROAD DAMAGE - P1 High - ACTIVE & SELECTED) */}
              <div
                onClick={() => setSelectedPin('NS-8842')}
                className="absolute top-[230px] left-[260px] z-30 flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer"
              >
                <span className="w-10 h-10 rounded-full bg-tertiary/30 animate-ping absolute top-0"></span>
                <div className="flex items-center gap-1 px-2 py-1 bg-tertiary text-on-tertiary rounded-full shadow-lg hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-base">warning</span>
                  <span className="font-code-badge text-[0.6875rem] font-bold">P1 • 180m</span>
                </div>
                <div className="w-2.5 h-2.5 bg-tertiary rotate-45 -mt-1 shadow"></div>

                {/* Floating Preview Card on Marker 1 */}
                {selectedPin === 'NS-8842' && (
                  <div className="absolute bottom-full mb-2 w-72 bg-surface-container-lowest rounded-lg p-space-sm shadow-xl z-40 text-left">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-code-badge text-code-badge text-tertiary bg-tertiary-fixed px-1.5 py-0.5 rounded">#NS-8842</span>
                      <span className="font-code-sla text-[0.6875rem] text-secondary font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                        Crew Assigned
                      </span>
                    </div>
                    <h4 className="font-body-sm text-body-sm font-bold text-on-surface leading-tight">Severe Pothole near Pillar 42</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[0.6875rem] mt-0.5">180m away • 4 min walk • 3 Upvotes</p>
                    <div className="mt-2 pt-2 bg-surface-container-low p-1.5 rounded flex items-center justify-between text-[0.6875rem]">
                      <span className="font-code-badge text-on-surface-variant">ETA on-site: 35 min</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCurrentView('track_complaint'); }}
                        className="text-secondary font-bold hover:underline inline-flex items-center gap-0.5 font-body-sm cursor-pointer"
                      >
                        <span>Inspect Details</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* MARKER 2 (GARBAGE OVERFLOW - 320m) */}
              <div
                onClick={() => setSelectedPin('NS-7914')}
                className="absolute top-[430px] left-[420px] z-20 flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="flex items-center gap-1 px-2 py-1 bg-secondary text-on-secondary rounded-full shadow-md">
                  <span className="material-symbols-outlined text-sm">delete_outline</span>
                  <span className="font-code-badge text-[0.6875rem] font-semibold">320m</span>
                </div>
                <div className="w-2 h-2 bg-secondary rotate-45 -mt-1 shadow"></div>
              </div>

              {/* MARKER 3 (STREETLIGHT OUTAGE - 410m) */}
              <div
                onClick={() => setSelectedPin('NS-7402')}
                className="absolute top-[160px] left-[460px] z-20 flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="flex items-center gap-1 px-2 py-1 bg-primary-container text-on-primary-container rounded-full shadow-md">
                  <span className="material-symbols-outlined text-sm">lightbulb</span>
                  <span className="font-code-badge text-[0.6875rem] font-bold">410m</span>
                </div>
                <div className="w-2 h-2 bg-primary-container rotate-45 -mt-1 shadow"></div>
              </div>

              {/* MARKER 4 (WATER PIPE LEAKAGE - 260m) */}
              <div
                onClick={() => setSelectedPin('NS-8819')}
                className="absolute top-[280px] left-[520px] z-20 flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="flex items-center gap-1 px-2 py-1 bg-[#1976D2] text-white rounded-full shadow-md">
                  <span className="material-symbols-outlined text-sm">water_drop</span>
                  <span className="font-code-badge text-[0.6875rem] font-semibold">260m</span>
                </div>
                <div className="w-2 h-2 bg-[#1976D2] rotate-45 -mt-1 shadow"></div>
              </div>

              {/* MARKER 5 (TRAFFIC - 550m) */}
              <div className="absolute top-[480px] left-[210px] z-20 flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer hover:scale-105 transition-transform">
                <div className="flex items-center gap-1 px-2 py-1 bg-[#D97706] text-white rounded-full shadow-md">
                  <span className="material-symbols-outlined text-sm">traffic</span>
                  <span className="font-code-badge text-[0.6875rem] font-semibold">550m</span>
                </div>
                <div className="w-2 h-2 bg-[#D97706] rotate-45 -mt-1 shadow"></div>
              </div>
            </div>

            {/* Map Legend */}
            <div className="w-full px-space-md py-2 bg-surface-container-low flex flex-wrap items-center justify-between text-on-surface-variant font-code-badge text-[0.6875rem] gap-2">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                  <span>P1 Life Safety / High Hazard</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                  <span>P2 Standard Urban</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span>Resolved Active Check</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-0 border-b-2 border-dashed border-secondary"></span>
                  <span>500m Walk Radius</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>BBMP Cadastral v4.18</span>
                <span className="text-on-surface-variant/40">•</span>
                <span>Scale: 1:2500</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: PROXIMITY FEED & ACTIONS */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">Issues in Your Vicinity</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Sorted by proximity to your current location</p>
            </div>
            <span className="font-code-badge text-code-badge px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">
              9 within {radius}m
            </span>
          </div>

          {/* CARD 1: FEATURED HIGH-PRIORITY ROAD CAVITY */}
          <article className="bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col gap-space-sm relative border border-secondary/20">
            <div className="flex items-start justify-between gap-space-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-code-badge text-code-badge font-bold px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-container">#NS-8842</span>
                <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase rounded">Roads &amp; Potholes</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#FDF2F2] text-tertiary font-code-badge text-[0.6875rem] font-bold rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>
                  P1 High
                </span>
              </div>
              <span className="font-code-sla text-code-sla text-secondary font-bold whitespace-nowrap">180m away</span>
            </div>

            <div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface leading-snug">Severe Road Damage &amp; Pothole Subsidence</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-base text-secondary">pin_drop</span>
                <span>Opp. Gate 2, Community Park (Pillar 42 Corridor)</span>
              </p>
            </div>

            {/* Progress track */}
            <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[0.75rem]">
                <span className="font-body-sm text-body-sm font-semibold text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-secondary">engineering</span>
                  In Progress • Crew Assigned (Unit #04 on-site)
                </span>
                <span className="font-code-badge text-code-badge text-on-surface-variant">2h ago • 3 residents linked</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full w-3/5"></div>
              </div>
              <div className="flex justify-between items-center text-[0.6875rem] font-code-badge text-on-surface-variant">
                <span>Reported: 08:42 AM</span>
                <span className="text-secondary font-semibold">Triage Complete (60%)</span>
                <span>Target Resolution: 4:00 PM</span>
              </div>
            </div>

            {/* Photo preview */}
            <div className="relative w-full h-36 rounded overflow-hidden shadow-sm">
              <img
                className="w-full h-full object-cover"
                alt="Pothole cavity photo"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDS_05dGJuWMaFltzCjhP1oEctE8uLfLKQON2nd9YUSt-016fa5CFx7usWg87wYSFtgE-VOVPphvJJaDN389Pmxhnms2XhKKJy7EBEtb-mACRqvi5ybzT3K60YfucPTURs2lMgrMQDhs0UyhDJznxE5MQiB1bWDD1xh4jN2zQEXjJ6AjOHXNXwj5KDCEAlz9m9-4sJJJdnNVtR1e6Yr1ZYv3qWz1UPQPufhPeKZaYI"
              />
              <div className="absolute bottom-2 left-2 bg-surface-container-lowest/90 backdrop-blur-sm px-2 py-0.5 rounded text-[0.6875rem] font-code-badge font-semibold text-on-surface">
                Uploaded by Resident • GPS Geotagged
              </div>
            </div>

            {/* Deduplication Link Box */}
            <div className="p-space-sm bg-secondary/10 rounded-lg flex flex-col gap-space-xs">
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-lg">merge_type</span>
                <span className="font-label-caps text-label-caps uppercase font-bold text-secondary">Is This The Same Problem?</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Seeing this exact pothole? Link your report to boost municipal dispatch priority without creating duplicate tickets.
              </p>
              <div className="flex items-center gap-space-xs mt-1">
                <button
                  type="button"
                  onClick={() => handleLinkTicket('NS-8842')}
                  className={`flex-1 py-1.5 px-space-sm font-body-sm text-body-sm font-bold rounded shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    linkedTickets['NS-8842']
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-secondary text-on-secondary hover:brightness-110'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">link</span>
                  <span>{linkedTickets['NS-8842'] ? '✓ Linked (+1 Upvoted)' : 'Link My Report (+1 Upvote)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTicketId('CMP-2026-01482');
                    setCurrentView('track_complaint', { id: 'CMP-2026-01482' });
                  }}
                  className="py-1.5 px-space-md bg-surface-container-lowest text-on-surface hover:bg-surface-container font-body-sm text-body-sm font-semibold rounded shadow-sm transition-colors cursor-pointer"
                >
                  View Issue
                </button>
              </div>
            </div>
          </article>

          {/* CARD 2: WATER SUPPLY */}
          <article className="bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col gap-space-sm hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-space-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-code-badge text-code-badge font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface">#NS-8819</span>
                <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase rounded">Water Supply</span>
                <span className="px-1.5 py-0.5 bg-[#FFF0C7] text-[#7D5500] font-code-badge text-[0.6875rem] font-bold rounded">P2 Standard</span>
              </div>
              <span className="font-code-sla text-code-sla text-on-surface-variant font-semibold">260m away</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface leading-snug">Low Pressure &amp; Pipeline Seepage</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-base text-on-surface-variant">pin_drop</span>
                <span>12th Cross, Near Public Water ATM</span>
              </p>
            </div>
            <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1 font-semibold text-[#7D5500]">
                <span className="material-symbols-outlined text-sm">schedule</span>
                Under Triage • Field Engineer Assigned
              </span>
              <span className="font-code-badge text-[0.6875rem]">4h ago</span>
            </div>
            <div className="flex items-center justify-between pt-1 gap-space-xs">
              <button
                type="button"
                onClick={() => setCurrentView('track_complaint')}
                className="flex-1 py-1.5 px-space-sm bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm font-semibold rounded transition-colors text-center cursor-pointer"
              >
                View Issue
              </button>
              <button
                type="button"
                onClick={() => handleLinkTicket('NS-8819')}
                className="flex-1 py-1.5 px-space-sm bg-surface-container-lowest text-secondary hover:bg-secondary-container/40 font-body-sm text-body-sm font-bold rounded shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">thumb_up</span>
                <span>{linkedTickets['NS-8819'] ? 'Endorsed ✓' : 'I Experience This Too (Link)'}</span>
              </button>
            </div>
          </article>

          {/* CARD 3: GARBAGE & SANITATION */}
          <article className="bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col gap-space-sm hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-space-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-code-badge text-code-badge font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface">#NS-7914</span>
                <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase rounded">Garbage &amp; Sanitation</span>
                <span className="px-1.5 py-0.5 bg-[#FFF0C7] text-[#7D5500] font-code-badge text-[0.6875rem] font-bold rounded">P2 Standard</span>
              </div>
              <span className="font-code-sla text-code-sla text-on-surface-variant font-semibold">320m away</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface leading-snug">Missed Wet Waste Collection &amp; Bin Overflow</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-base text-on-surface-variant">pin_drop</span>
                <span>5th Main Community Entrance, Sector 04</span>
              </p>
            </div>
            <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1 font-semibold text-secondary">
                <span className="material-symbols-outlined text-sm">local_shipping</span>
                Scheduled • Compact Vehicle En-route (Sector 04 route)
              </span>
              <span className="font-code-badge text-[0.6875rem]">Yesterday</span>
            </div>
            <div className="flex items-center justify-between pt-1 gap-space-xs">
              <button
                type="button"
                onClick={() => setCurrentView('track_complaint')}
                className="flex-1 py-1.5 px-space-sm bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm font-semibold rounded transition-colors text-center cursor-pointer"
              >
                View Issue
              </button>
              <button
                type="button"
                onClick={() => handleLinkTicket('NS-7914')}
                className="flex-1 py-1.5 px-space-sm bg-surface-container-lowest text-secondary hover:bg-secondary-container/40 font-body-sm text-body-sm font-bold rounded shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">link</span>
                <span>{linkedTickets['NS-7914'] ? 'Linked ✓' : 'Link My Report'}</span>
              </button>
            </div>
          </article>
        </div>
      </main>

      {/* Bottom Civic Empowerment & Transparency Bar */}
      <footer className="w-full py-space-md">
        <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <div className="max-w-2xl flex items-start gap-space-md">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0 text-secondary">
              <span className="material-symbols-outlined text-2xl">device_hub</span>
            </div>
            <div>
              <h4 className="font-headline-md text-headline-md font-bold text-on-surface">Why does duplicate linking matter?</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                NagarSetu's AI cluster engine groups identical civic reports within 250m. When neighbours link issues, it prevents redundant dispatch overhead, alerts the ward supervisor of collective impact, and keeps everyone updated simultaneously.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-md shrink-0 w-full md:w-auto justify-end">
            <div className="px-space-md py-2 bg-surface-container-low rounded-lg shadow-sm text-left">
              <div className="font-headline-md text-headline-md font-bold text-secondary">412</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant">Redundant tickets consolidated in Ward 12 this month</div>
            </div>
            <button
              type="button"
              onClick={() => showToast('Cluster Protocol', 'DBSCAN spatial clustering threshold set to 250m.')}
              className="px-space-md py-2 bg-surface-container text-on-surface hover:bg-surface-container-high rounded font-body-sm text-body-sm font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Cluster Protocol Details</span>
              <span className="material-symbols-outlined text-base">open_in_new</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
