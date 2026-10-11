import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const EmergencyView: React.FC = () => {
  const { showToast, dispatchEmergencyIncident, setSelectedTicketId, setCurrentView } = useApp();

  const [selectedHazard, setSelectedHazard] = useState('Structural');
  const [hazardDetails, setHazardDetails] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedComplete, setSimulatedComplete] = useState(false);
  const [lastDispatchedTicketId, setLastDispatchedTicketId] = useState<string | null>(null);

  const emergencyTypes = [
    { name: 'Fire', sub: 'Brigade', icon: 'local_fire_department', color: 'text-tertiary' },
    { name: 'Accident', sub: 'Traffic/EMS', icon: 'car_crash', color: 'text-primary' },
    { name: 'Medical', sub: 'Ambulance', icon: 'emergency', color: 'text-tertiary' },
    { name: 'Public Safety', sub: 'Police', icon: 'shield', color: 'text-secondary' },
    { name: 'Flood Surge', sub: 'Disaster', icon: 'flood', color: 'text-secondary' },
    { name: 'Gas Leak', sub: 'HazMat', icon: 'air', color: 'text-primary' },
    { name: 'Structural', sub: 'Cave-in / Grid', icon: 'domain_disabled', color: 'text-tertiary' },
    { name: 'Other Hazard', sub: 'Triage', icon: 'help_outline', color: 'text-on-surface' },
  ];

  const handleSimulateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentLocation.trim() || !hazardDetails.trim()) {
      showToast('Incident Details Needed', 'Enter the incident location and describe the hazard.', 'error', 'error');
      return;
    }
    setIsSimulating(true);
    try {
      const incident = await dispatchEmergencyIncident({
        hazardType: selectedHazard,
        details: hazardDetails,
        location: incidentLocation.trim(),
        ward: '',
        ...(coordinates ? { coordinates } : {}),
        citizenPhone: '',
      });
      setLastDispatchedTicketId(incident.id);
      setIsSimulating(false);
      setSimulatedComplete(true);
    } catch {
      setIsSimulating(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-space-md pb-space-xl">
      {/* DIRECT EMERGENCY HOTLINES */}
      <section className="bg-surface-container-low p-space-md rounded-xl shadow-sm space-y-space-sm">
        <div className="bg-tertiary/10 p-space-md rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-tertiary flex items-center justify-center shrink-0 text-on-tertiary shadow-sm">
              <span className="material-symbols-outlined text-2xl">e911_emergency</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="font-headline-md text-headline-md font-bold text-tertiary">Direct Emergency Hotlines</span>
                <span className="bg-tertiary text-on-tertiary font-code-badge text-code-badge px-space-xs py-0.5 rounded tracking-wider">OFFICIAL NUMBERS</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant font-medium mt-0.5">
                If someone is in immediate danger, dial 112 or contact the emergency services below directly.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
          {[
            { label: 'National Emergency', num: '112', icon: 'emergency' },
            { label: 'Medical / Trauma', num: '108', icon: 'ambulance' },
            { label: 'Fire & Rescue', num: '101', icon: 'local_fire_department' },
            { label: 'City Police', num: '100', icon: 'local_police' },
          ].map((item, idx) => (
            <a
              key={idx}
              href={`tel:${item.num}`}
              onClick={() => showToast('Calling Emergency', `Dialing emergency line ${item.num}...`)}
              className="flex items-center justify-between p-space-sm bg-surface-container-lowest rounded-lg hover:bg-tertiary/5 transition-all shadow-sm group"
            >
              <div className="flex items-center gap-space-xs">
                <div className="w-8 h-8 rounded bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">{item.label}</span>
                  <span className="font-headline-md text-headline-md font-bold text-tertiary leading-none">{item.num}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-tertiary transition-colors">call</span>
            </a>
          ))}
        </div>
      </section>

      {/* HEADER & OPERATIONAL TELEMETRY */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-2">
        <div className="flex flex-col gap-space-xs">
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="bg-tertiary text-on-tertiary font-code-badge text-code-badge px-space-xs py-0.5 rounded font-bold uppercase tracking-wider">
              PRIORITY QRF DISPATCH
            </span>
            <span className="bg-secondary-container text-on-secondary-container font-code-sla text-code-sla px-space-xs py-0.5 rounded font-semibold">
              Ward 12 Incident Desk
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight mt-1">
            Report an Urgent Hazard
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Direct intake for critical urban hazards requiring priority municipal dispatch and emergency response units.
          </p>
        </div>

        <div className="flex items-center gap-space-md p-space-sm bg-surface-container rounded-xl shrink-0">
          <div className="flex flex-col text-right">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">Ward 12 Readiness</span>
            <span className="font-code-sla text-code-sla font-bold text-secondary">3 Units Standby • 04m Med ETA</span>
          </div>
          <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" title="System Operational"></div>
        </div>
      </header>

      {/* MAIN 2-COLUMN OPERATIONAL DISPATCH LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start pt-2">
        {/* LEFT COLUMN: RAPID REPORT FORM */}
        <section className="lg:col-span-7 flex flex-col gap-space-lg">
          {/* 1. SELECT EMERGENCY TYPE */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary">category</span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">1. Select Emergency Type</h2>
              </div>
              <span className="font-code-sla text-code-sla text-on-surface-variant">Instant Categorization</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-xs">
              {emergencyTypes.map((item) => {
                const isSelected = selectedHazard === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedHazard(item.name)}
                    className={`flex flex-col items-center justify-center p-space-sm rounded-lg transition-all text-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-primary-container text-on-primary-container font-bold shadow-md'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-2xl ${isSelected ? 'text-on-primary-container' : item.color}`}>
                      {item.icon}
                    </span>
                    <span className="font-body-sm text-body-sm font-semibold">{item.name}</span>
                    <span className="font-code-badge text-[0.625rem] opacity-75">{item.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. RAPID DISPATCH VERIFICATION FORM */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary">bolt</span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">2. Rapid Dispatch Verification</h2>
              </div>
              <span className="bg-primary/10 text-primary font-code-badge text-code-badge px-space-xs py-0.5 rounded font-bold">
                EST. TIME: ~30s
              </span>
            </div>

            <form onSubmit={handleSimulateDispatch} className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold flex items-center justify-between">
                  <span>Incident Cadastral Location</span>
                  <span className="text-secondary font-code-sla flex items-center gap-0.5">
                    <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span> LOCATION REQUIRED
                  </span>
                </label>
                <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-xl mt-0.5">my_location</span>
                    <div className="flex flex-col">
                      <input
                        type="text"
                        required
                        value={incidentLocation}
                        onChange={event => setIncidentLocation(event.target.value)}
                        placeholder="Enter the incident address or landmark"
                        className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none"
                      />
                      {coordinates && <span className="font-code-sla text-code-sla text-on-surface-variant">{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        showToast('Location Unavailable', 'This browser does not provide geolocation.', 'error', 'error');
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        ({ coords: position }) => setCoordinates({ lat: position.latitude, lng: position.longitude }),
                        error => showToast('Location Not Captured', error.message, 'error', 'error'),
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                      );
                    }}
                    className="shrink-0 px-space-sm py-1.5 bg-surface-container-highest hover:bg-surface-container text-on-surface font-body-sm text-body-sm font-semibold rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">pin_drop</span>
                    <span>Use GPS</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                  What is the critical hazard or immediate risk? (Concise)
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={hazardDetails}
                    onChange={(e) => setHazardDetails(e.target.value)}
                    className="w-full p-space-sm bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg focus:outline-none focus:bg-surface-container-lowest resize-none"
                    placeholder="e.g. Fallen live wire sparking across road, tree branch blocking traffic..."
                  />
                  <div className="absolute right-space-sm bottom-space-xs font-code-badge text-code-badge text-on-surface-variant">
                    {hazardDetails.length} / 300 chars
                  </div>
                </div>
              </div>

              {/* Photo Attachment preview */}
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                  Hazard Visual Evidence (Optional but High-Priority)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                  <div
                    onClick={() => showToast('Photo Attached', 'Geotagged image evidence attached.')}
                    className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-center gap-space-sm text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-2xl text-secondary">add_a_photo</span>
                    <div className="flex flex-col text-left">
                      <span className="font-body-sm text-body-sm font-bold text-on-surface">Capture or Upload Photo</span>
                      <span className="font-code-badge text-code-badge">Geotagged auto-attachment</span>
                    </div>
                  </div>

                  <div className="p-space-xs bg-surface-container rounded-lg flex items-center gap-space-sm">
                    <div className="w-14 h-14 rounded bg-surface-container-high overflow-hidden shrink-0 relative">
                      <img
                        className="w-full h-full object-cover"
                        alt="Transformer preview"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuClWHOzbWEgsTDRBkVAF_alfe3ftsoAE6fWjphfSekvbQWdX2nYgGDOY-EDif_4vwiJkZgYJxFnYWmyRsgO9jd3VDjQEoiZ-oFaSQwjjyPv0PWrCZWqT1m1FFMMJcNpYePo4Bdp4hgerM_FXgnTDV0G7Xwrc_PdwGO6J8CVUw2v9Ij7T7WJeCDan2NguY7OJl8X9fmWohmub8ZGf36qK6hb4N9mixRxowhpF03v6h4"
                      />
                      <span className="absolute bottom-0 right-0 bg-tertiary text-on-tertiary font-code-badge text-[0.55rem] px-1 font-bold">P1</span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-body-sm text-body-sm font-bold text-on-surface truncate">IMG_Transformer_W12.jpg</span>
                      <span className="font-code-sla text-code-sla text-on-surface-variant">2.4 MB • HazMat Tagged</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                    Callback Phone (For Responding Unit)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-secondary text-base">call</span>
                    <input
                      type="text"
                      readOnly
                      value="+91 98452 88210"
                      className="w-full pl-9 pr-space-sm py-2 bg-surface-container-low text-on-surface font-code-sla text-code-sla rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold">
                    Reporting Citizen (Optional)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-base">person</span>
                    <input
                      type="text"
                      defaultValue="Priya S. (Ward 12 Resident)"
                      className="w-full pl-9 pr-space-sm py-2 bg-surface-container-low text-on-surface font-body-sm text-body-sm rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-space-xs flex flex-col sm:flex-row items-center gap-space-sm">
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="w-full sm:flex-1 py-3 px-space-md bg-tertiary text-on-tertiary font-body-md text-body-md font-bold rounded shadow-md hover:bg-tertiary/90 transition-all flex items-center justify-center gap-space-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">
                    {isSimulating ? 'refresh' : 'send'}
                  </span>
                  <span>
                    {isSimulating
                      ? 'Transmitting Emergency Alert...'
                      : simulatedComplete
                      ? '✓ Emergency Alert Broadcasted'
                      : 'Dispatch Emergency Alert'}
                  </span>
                </button>
                {simulatedComplete && lastDispatchedTicketId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTicketId(lastDispatchedTicketId);
                      setCurrentView('track_complaint', { id: lastDispatchedTicketId });
                    }}
                    className="w-full sm:w-auto py-3 px-space-md bg-secondary text-on-secondary font-body-md text-body-md font-bold rounded shadow-md hover:bg-secondary/90 transition-all flex items-center justify-center gap-space-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">visibility</span>
                    <span>Track Ticket #{lastDispatchedTicketId}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setHazardDetails('');
                    setSimulatedComplete(false);
                    setLastDispatchedTicketId(null);
                    showToast('Form Reset', 'Emergency verification inputs cleared.');
                  }}
                  className="w-full sm:w-auto py-3 px-space-md bg-surface-container hover:bg-surface-container-high text-on-surface font-body-md text-body-md font-semibold rounded transition-colors cursor-pointer"
                >
                  Cancel / Clear
                </button>
              </div>

              <p className="font-code-badge text-code-badge text-on-surface-variant text-center">
                This saves a priority report in NagarSetu but does not dispatch emergency services. For immediate danger, call one of the official hotlines above.
              </p>
            </form>
          </div>
        </section>

        {/* RIGHT COLUMN: SIMULATED INCIDENT LIFECYCLE */}
        <section className="lg:col-span-5 flex flex-col gap-space-lg">
          {/* ACTIVE SIMULATED LIVE EMERGENCY CARD */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-ping"></span>
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-tertiary font-bold">Active Live Demo Incident</span>
              </div>
              <span className="font-code-badge text-code-badge bg-surface-container px-space-xs py-0.5 rounded text-on-surface font-semibold">
                #EMG-2026-089
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface leading-tight">
                Live Demo: Transformer Hazard &amp; Arc Flash
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Sector 4 Indiranagar, BBMP Zone East. Priority 1 hazard escalated via citizen telemetry.
              </p>
            </div>

            {/* Unit Dispatch Box */}
            <div className="bg-secondary/10 p-space-md rounded-lg flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs text-secondary font-bold font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-xl">local_shipping</span>
                  <span>Unit Dispatched — ETA 4 Mins</span>
                </div>
                <span className="bg-secondary text-on-secondary font-code-badge text-code-badge px-2 py-0.5 rounded">
                  EN ROUTE
                </span>
              </div>
              <div className="flex flex-col text-on-surface-variant font-code-sla text-code-sla text-xs">
                <span>Unit: Quick Response Vehicle (QRV-12)</span>
                <span>Station: Indiranagar Fire &amp; Rescue Post</span>
                <span>Responder Lead: Officer K. Venkatesh (Squad 3)</span>
              </div>
            </div>

            {/* Radar Preview */}
            <div className="relative rounded-lg overflow-hidden h-36 bg-surface-container-high flex items-center justify-center">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCQkNL2Dt6_PjHnlx_L6oia6rTKmd8ib4DErk3muft6dRIwSw-fwfNGE5VXc_l5jTNDhlcRBhmG1YPDlk3FWqEWWXmmOT_V0m11UnM8Lb6e_PkxB_M-wpaX3yfZvA7VnCbPnkRa990niwL5MmuFIecrq42FazwEt-JDPd2_h1TnkObnjXmfs6ZkLoHI3yi3chJXYpQ86nyzKCwd64lKDtCn6F4a1DglITF09kKr1Eg')`,
                }}
              ></div>
              <div className="absolute inset-0 bg-surface-dim/40 flex flex-col items-center justify-center p-space-sm text-center">
                <div className="flex items-center gap-space-xs bg-surface-container-lowest/95 backdrop-blur px-space-sm py-1 rounded-full shadow-sm">
                  <span className="material-symbols-outlined text-tertiary text-sm animate-pulse">radio_button_checked</span>
                  <span className="font-code-sla text-code-sla font-bold text-on-surface">Unit QRV-12: 1.2 km away (CMH Road)</span>
                </div>
              </div>
            </div>

            {/* 6-Stage Timeline */}
            <div className="pt-space-xs flex flex-col">
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant font-bold mb-space-sm">
                6-Stage Incident Response Lifecycle
              </span>
              <div className="relative flex flex-col gap-space-md pl-4">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-surface-container-highest"></div>

                <div className="flex items-start gap-space-sm relative">
                  <div className="w-3.5 h-3.5 rounded-full bg-secondary flex items-center justify-center shrink-0 -ml-[5px] mt-1 shadow-sm">
                    <span className="material-symbols-outlined text-[10px] text-on-secondary">check</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm font-bold text-on-surface">1. Reported</span>
                      <span className="font-code-badge text-code-badge text-on-surface-variant">14:21:05</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">Citizen call &amp; AI geocache triage initialized.</span>
                  </div>
                </div>

                <div className="flex items-start gap-space-sm relative">
                  <div className="w-3.5 h-3.5 rounded-full bg-secondary flex items-center justify-center shrink-0 -ml-[5px] mt-1 shadow-sm">
                    <span className="material-symbols-outlined text-[10px] text-on-secondary">check</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm font-bold text-on-surface">2. Verified</span>
                      <span className="font-code-badge text-code-badge text-on-surface-variant">14:22:18</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">BESCOM &amp; Fire desk confirmed live feeder hazard.</span>
                  </div>
                </div>

                <div className="flex items-start gap-space-sm relative">
                  <div className="w-3.5 h-3.5 rounded-full bg-secondary flex items-center justify-center shrink-0 -ml-[5px] mt-1 shadow-sm">
                    <span className="material-symbols-outlined text-[10px] text-on-secondary">check</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm font-bold text-on-surface">3. Response Team Assigned</span>
                      <span className="font-code-badge text-code-badge text-on-surface-variant">14:23:40</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">Assigned QRV-12 + BESCOM Line Crew 04.</span>
                  </div>
                </div>

                <div className="flex items-start gap-space-sm relative">
                  <div className="w-4 h-4 rounded-full bg-primary-container flex items-center justify-center shrink-0 -ml-[6px] mt-0.5 ring-4 ring-primary-container/20 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-on-primary-container"></span>
                  </div>
                  <div className="flex flex-col flex-1 bg-surface-container-low p-space-xs rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm font-bold text-primary">4. Dispatched (ACTIVE)</span>
                      <span className="font-code-badge text-code-badge text-secondary font-bold">14:25:02</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface font-medium text-xs">Siren navigation live. Traffic green corridor engaged.</span>
                  </div>
                </div>

                <div className="flex items-start gap-space-sm relative opacity-60">
                  <div className="w-3 h-3 rounded-full bg-surface-container-highest shrink-0 -ml-[4px] mt-1"></div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm font-semibold text-on-surface-variant">5. On Scene</span>
                      <span className="font-code-badge text-code-badge text-on-surface-variant">Pending ETA</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">Cordon safety zone &amp; power cut isolation.</span>
                  </div>
                </div>

                <div className="flex items-start gap-space-sm relative opacity-60">
                  <div className="w-3 h-3 rounded-full bg-surface-container-highest shrink-0 -ml-[4px] mt-1"></div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm font-semibold text-on-surface-variant">6. Resolved</span>
                      <span className="font-code-badge text-code-badge text-on-surface-variant">Awaiting Closure</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">Site safety cleared &amp; civic audit signed.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-space-xs flex items-center justify-between">
              <button
                type="button"
                onClick={() => showToast('Radio Audio Streaming', 'Playing simulated radio triage clip for QRV-12...')}
                className="font-body-sm text-body-sm text-secondary font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">podcasts</span>
                <span>Listen to Radio Audio Triage</span>
              </button>
              <button
                type="button"
                onClick={() => showToast('Telemetry Refreshed', 'GPS coordinates ping confirmed.')}
                className="font-code-sla text-code-sla text-on-surface-variant bg-surface-container px-space-xs py-1 rounded hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Refresh Telemetry
              </button>
            </div>
          </div>

          {/* CIVIC PROTOCOL REMINDER */}
          <div className="p-space-md bg-secondary text-on-secondary rounded-xl flex items-start gap-space-sm shadow-sm">
            <span className="material-symbols-outlined text-secondary-fixed text-2xl mt-0.5">verified_user</span>
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md font-bold text-on-secondary leading-tight">Civic Protocol Reminder</span>
              <p className="font-body-sm text-body-sm text-secondary-fixed opacity-95 mt-1">
                Do not approach fallen electric lines within 30 meters. In case of waterlogging or rain, stay clear of utility poles and street transformers.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* BOTTOM SECTION: NEARBY EMERGENCY FACILITIES DIRECTORY */}
      <section className="pt-space-lg">
        <div className="flex flex-col gap-space-md">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-xs pb-space-xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary">local_hospital</span>
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary font-bold">WARD 12 DISPATCH RADIUS</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                Nearby Emergency Facilities (DEMO DATA)
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Simulated municipal facilities roster indexed for Ward 12 rapid response and immediate public health triage.
              </p>
            </div>
            <div className="flex items-center gap-space-xs shrink-0">
              <span className="font-code-sla text-code-sla bg-surface-container px-space-sm py-1 rounded text-on-surface-variant">
                Radius: ≤ 2.5 km
              </span>
              <span className="font-code-sla text-code-sla bg-secondary-container text-on-secondary-container px-space-sm py-1 rounded font-bold">
                All 4 Units Operational
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter-desktop">
            {[
              {
                title: 'Manipal Hospital Indiranagar (Demo)',
                badge: '1.1 km • 4 MINS',
                status: '24/7 OPEN',
                desc: 'Full Trauma Care & Burn Unit • 14 ER Bays active • Blood bank on site',
                desk: '080-2502-4444',
                deskLabel: 'Emergency Desk:',
              },
              {
                title: 'Indiranagar Fire Station (Demo)',
                badge: '1.8 km • 6 MINS',
                status: 'WATER TENDER READY',
                desc: 'Karnataka State Fire & Emergency • HazMat Tender & High-Reach Snorkel #2',
                desk: '080-2297-1500',
                deskLabel: 'Dispatch Line:',
              },
              {
                title: 'Indiranagar Police Station (Demo)',
                badge: '650 m • 2 MINS',
                status: 'SECTOR PATROL ACTIVE',
                desc: 'Bengaluru City Police Zone East • Hoysala PCR Patrol #03 stationed',
                desk: '080-2294-2200',
                deskLabel: 'Duty Desk:',
              },
              {
                title: 'Ward 12 Relief Center (Demo)',
                badge: '900 m • 3 MINS',
                status: 'ACTIVE SHELTER',
                desc: 'Community Hall BDA Complex • Capacity 250 • Emergency potable water & generator',
                desk: '94808-11212',
                deskLabel: 'Camp Coordinator:',
              },
            ].map((fac, idx) => (
              <div key={idx} className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-md hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="bg-tertiary/10 text-tertiary font-code-badge text-code-badge px-space-xs py-0.5 rounded font-bold">
                      {fac.badge}
                    </span>
                    <span className="flex items-center gap-1 font-code-badge text-code-badge text-secondary font-bold">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span> {fac.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface leading-tight">
                      {fac.title}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {fac.desc}
                    </p>
                  </div>
                  <div className="bg-surface-container-low p-space-xs rounded flex items-center justify-between text-on-surface-variant font-code-sla text-code-sla">
                    <span>{fac.deskLabel}</span>
                    <span className="font-bold text-on-surface">{fac.desk}</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs pt-space-xs">
                  <button
                    type="button"
                    onClick={() => showToast('Directions', `Navigating to ${fac.title}`)}
                    className="flex-1 py-1.5 px-space-sm bg-surface-container hover:bg-surface-container-high rounded text-on-surface font-body-sm text-body-sm font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">directions</span>
                    <span>Directions</span>
                  </button>
                  <a
                    href={`tel:${fac.desk.replace(/-/g, '')}`}
                    onClick={() => showToast('Calling Facility', `Connecting to ${fac.title}...`)}
                    className="py-1.5 px-space-sm bg-secondary text-on-secondary rounded font-body-sm text-body-sm font-bold flex items-center justify-center gap-1 hover:bg-secondary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">call</span>
                    <span>Call</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
