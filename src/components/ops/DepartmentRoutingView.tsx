import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportService } from '../../services/exportService';
import { apiClient, type DepartmentRecord } from '../../services/apiClient';

export const DepartmentRoutingView: React.FC = () => {
  const { showToast, bulkReassignComplaints } = useApp();

  const [activeFilter, setActiveFilter] = useState('all');
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState('');
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    let mounted = true;
    setDepartmentsLoading(true);
    void apiClient.getOperationalDepartments().then(result => {
      if (!mounted) return;
      if (result.error || !result.data) {
        setDepartmentsError(result.error ?? 'Unable to load active departments.');
        return;
      }
      setDepartments(result.data.departments);
      setDepartmentsError('');
    }).finally(() => {
      if (mounted) setDepartmentsLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const pendingQueue = [
    {
      id: 'CMP-2026-01522',
      title: 'Commercial Garbage Dumping Blocking Stormwater Drain',
      dept: 'Waste Management (BBMP SWM)',
      officer: 'Marshal Div 2',
      match: '98.1% Match',
      matchColor: 'bg-secondary-fixed text-on-secondary-fixed'
    },
    {
      id: 'CMP-2026-01519',
      title: 'Exposed 11kV Cable Hanging Over School Pedestrian Crossing',
      dept: 'Electricity & Power (BESCOM)',
      officer: 'Feeder Eng. C. Patil',
      match: '99.4% Match',
      matchColor: 'bg-primary-fixed text-on-primary-fixed',
      isEmergency: true
    },
    {
      id: 'CMP-2026-01515',
      title: 'Fallen Heritage Tree Bough Obstructing Bus Rapid Transit Lane',
      dept: 'Parks & Env (Joint Traffic)',
      officer: 'Hort. Off. V. Nayak',
      match: '89.5% Match',
      matchColor: 'bg-surface-container-highest text-on-surface-variant'
    },
    {
      id: 'CMP-2026-01508',
      title: 'Traffic Signal Controller Short-Circuit at Major 4-Way Junction',
      dept: 'Traffic Management (BTP)',
      officer: 'Signal Eng #14',
      match: '93.7% Match',
      matchColor: 'bg-secondary-fixed text-on-secondary-fixed'
    }
  ];

  const handleConfirmReassign = () => {
    setIsReassignOpen(false);
    void bulkReassignComplaints(selectedDept);
  };

  return (
    <div className="w-full space-y-space-lg pb-space-xl">
      {/* 5-STAGE HORIZONTAL PIPELINE */}
      <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-md mb-space-md">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></span>
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary font-bold">
              Demonstration Workflow
            </span>
            <span className="bg-surface-container text-on-surface-variant font-code-badge text-code-badge px-space-xs rounded">
              Sakala Act Mandate §4.1
            </span>
          </div>
          <div className="flex items-center gap-space-md">
            <span className="font-code-sla text-code-sla text-on-surface-variant">
              Intake-to-dispatch timing: <strong className="text-on-surface font-bold">not connected</strong>
            </span>
            <span className="bg-secondary-fixed text-on-secondary-fixed font-code-badge text-code-badge px-space-sm py-0.5 rounded font-semibold">
              Compliance status not integrated
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-space-sm">
          <div className="flex flex-col gap-1 p-space-sm rounded-lg bg-surface-container-low">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary font-code-badge text-code-badge flex items-center justify-center font-bold">1</span>
              <span className="material-symbols-outlined text-secondary text-base">input</span>
            </div>
            <span className="font-label-caps text-label-caps uppercase text-secondary font-bold mt-1">Ingestion Engine</span>
            <span className="font-body-sm text-body-sm text-on-surface font-semibold truncate">Citizen Intake &amp; Geo</span>
            <span className="font-code-sla text-code-sla text-on-surface-variant text-[11px]">Omni-channel (1913/App)</span>
          </div>

          <div className="flex flex-col gap-1 p-space-sm rounded-lg bg-surface-container-low">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary font-code-badge text-code-badge flex items-center justify-center font-bold">2</span>
              <span className="material-symbols-outlined text-secondary text-base">psychology</span>
            </div>
            <span className="font-label-caps text-label-caps uppercase text-secondary font-bold mt-1">Multi-Modal AI</span>
            <span className="font-body-sm text-body-sm text-on-surface font-semibold truncate">Vision-LLM + K-GIS</span>
            <span className="font-code-sla text-code-sla text-on-surface-variant text-[11px]">Orthophoto &amp; NLP parsing</span>
          </div>

          <div className="flex flex-col gap-1 p-space-sm rounded-lg bg-secondary text-on-secondary shadow-md transform scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container font-code-badge text-code-badge flex items-center justify-center font-bold">3</span>
              <span className="material-symbols-outlined text-primary-container text-base">account_tree</span>
            </div>
            <span className="font-label-caps text-label-caps uppercase text-secondary-fixed font-bold mt-1">Jurisdiction Map</span>
            <span className="font-body-sm text-body-sm text-on-secondary font-bold truncate">Dept Recommendation</span>
            <span className="font-code-sla text-code-sla text-secondary-fixed-dim text-[11px]">Dual Primary Allocation</span>
          </div>

          <div className="flex flex-col gap-1 p-space-sm rounded-lg bg-surface-container-low">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant font-code-badge text-code-badge flex items-center justify-center font-bold">4</span>
              <span className="material-symbols-outlined text-on-surface-variant text-base">engineering</span>
            </div>
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold mt-1">Engineering Proof</span>
            <span className="font-body-sm text-body-sm text-on-surface font-semibold truncate">Plain-Language Rationale</span>
            <span className="font-code-sla text-code-sla text-on-surface-variant text-[11px]">Audit-trailed reasoning</span>
          </div>

          <div className="flex flex-col gap-1 p-space-sm rounded-lg bg-surface-container-low">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant font-code-badge text-code-badge flex items-center justify-center font-bold">5</span>
              <span className="material-symbols-outlined text-on-surface-variant text-base">local_shipping</span>
            </div>
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold mt-1">Officer Dispatch</span>
            <span className="font-body-sm text-body-sm text-on-surface font-semibold truncate">Crew &amp; Work Order</span>
            <span className="font-code-sla text-code-sla text-on-surface-variant text-[11px]">AEE Signature Required</span>
          </div>
        </div>
      </section>

      {/* TOP HEADER & BATCH CONTROLS */}
      <section className="flex flex-col gap-space-md">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-space-sm">
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                Department Routing &amp; Automated Dispatch
              </h1>
              <span className="bg-secondary-fixed text-on-secondary-fixed font-code-badge text-code-badge px-space-sm py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                Demonstration queue
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              The queue below is not persisted or dispatched. Department reassignment applies only to API-backed complaints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            <button
              type="button"
              disabled
              title="Automated dispatch is not connected"
              className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container text-on-surface-variant font-body-sm text-body-sm font-bold shadow-sm opacity-70 cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">auto_mode</span>
              <span>Automated dispatch unavailable</span>
            </button>
            <button
              onClick={() => {
                const headers = ['Case ID', 'Grievance Description', 'Suggested Jurisdiction', 'Assigned Officer', 'Confidence Match'];
                const rows = pendingQueue.map(q => [q.id, q.title, q.dept, q.officer, q.match]);
                exportService.exportToCsv('Department_Routing_Log.csv', headers, rows);
                showToast('Log Exported', 'Routing audit trail exported to CSV.');
              }}
              className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm font-semibold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span>Export Routing Log</span>
            </button>
          </div>
        </div>

        {/* Department filter pills */}
        <div className="flex items-center gap-space-xs overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Queued', count: 28 },
            { id: 'bbmp', label: 'Roads & Infra (BBMP)', count: 8 },
            { id: 'bwssb', label: 'Water & Sewerage (BWSSB)', count: 6 },
            { id: 'bescom', label: 'Electricity (BESCOM)', count: 4 },
            { id: 'swm', label: 'Waste Mgmt (SWM)', count: 4 },
            { id: 'btp', label: 'Traffic (BTP)', count: 3 },
            { id: '112', label: 'Emergency (112)', count: 2 },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-full font-label-caps text-label-caps uppercase whitespace-nowrap transition-all shadow-sm cursor-pointer ${
                activeFilter === pill.id
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span>{pill.label}</span>
              <span className="bg-surface-container text-on-surface-variant px-1.5 rounded-full font-code-badge text-code-badge text-[10px]">
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* MASTER-DETAIL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop">
        {/* Left 7 cols: Active Case Dossier */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          <article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-tertiary via-primary-container to-secondary"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-1">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="font-code-badge text-code-badge px-space-sm py-1 bg-surface-container text-on-surface rounded font-bold">
                  #CMP-2026-01518
                </span>
                <span className="bg-tertiary-fixed text-on-tertiary-fixed font-code-badge text-code-badge px-space-xs py-0.5 rounded flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>
                  P1 • Critical Infrastructure
                </span>
                <span className="font-code-sla text-code-sla text-on-surface-variant">Ingested 14 mins ago</span>
              </div>
              <span className="bg-surface-container-low px-space-sm py-0.5 rounded text-on-surface-variant font-code-sla text-code-sla">
                SLA Response: <strong>46m remaining</strong>
              </span>
            </div>

            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                High-Pressure Pipeline Burst Creating Asphalt Sinkhole &amp; Traffic Backlog
              </h2>
              <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm mt-1">
                <span className="material-symbols-outlined text-sm text-tertiary">location_on</span>
                <span className="font-medium text-on-surface">80ft Road, Sector 3, HSR Layout / Ward 12 Border</span>
                <span className="text-outline-variant">•</span>
                <span className="font-code-sla text-code-sla">Lat: 12.9116° N, Lng: 77.6389° E</span>
              </div>
            </div>

            {/* Evidence & K-GIS Overlay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="relative rounded-lg overflow-hidden bg-surface-container h-48">
                <img
                  className="w-full h-full object-cover"
                  alt="Pipeline burst"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBj7uV7nh5w4qfdK63sw40pdtvfhig9YSpNbVO4g0YwiT3dD1awq8q4kvHyFch-gsZms9yhC13wDjK6hIxhmBQQnRboOr78Y118HCRuv8Zwwhp_dgc__kPe7Y2yM_QfYTKz5l7_q_eXQG_r8NYDVYWFivltM_dNZZU0y6a5qF1TsiQ2Dugy8fJG3r_GYbfy9HhL83RHExbb9Zuv56EDYH6N8PHpzPbGaV_r7PgFJdM"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-inverse-surface/90 to-transparent p-space-sm flex items-center justify-between text-on-primary">
                  <span className="font-label-caps text-label-caps uppercase flex items-center gap-1 font-bold">
                    Citizen Mobile Upload (Verified EXIF)
                  </span>
                  <span className="font-code-badge text-code-badge bg-inverse-surface/60 px-1 rounded">2.4 MB RAW</span>
                </div>
              </div>

              <div className="relative rounded-lg overflow-hidden bg-surface-container h-48 flex items-center justify-center bg-[#2e312e] text-white">
                <div className="absolute top-2 left-2 bg-on-secondary-fixed/90 text-secondary-fixed px-space-sm py-1 rounded text-[11px] font-code-badge font-mono">
                  K-GIS LAYER: #BW-8820 (BWSSB Potable 250mm Feeder)
                </div>
                <div className="absolute bottom-2 right-2 bg-surface-container-lowest/95 text-on-surface px-space-sm py-1 rounded text-[11px] font-code-badge flex items-center gap-1 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                  Road Cavity: ~3.8m dia
                </div>
              </div>
            </div>

            {/* Autonomous Recommendation Box */}
            <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container">
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">hub</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-caps text-label-caps uppercase text-secondary font-bold">Autonomous Recommendation</span>
                    <span className="font-body-md text-body-md font-bold text-on-surface">Dual-Jurisdictional Joint Allocation</span>
                  </div>
                </div>

                <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-1.5 rounded-lg shadow-sm">
                  <span className="font-code-badge text-code-badge font-bold text-secondary">96.2% Confidence</span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">High Certainty Match</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                <div className="p-space-sm rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-base">water_drop</span>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-[10px] uppercase font-bold text-secondary">Joint Primary (Lead)</span>
                      <span className="font-body-sm text-body-sm font-bold">Water &amp; Sewerage (BWSSB)</span>
                    </div>
                  </div>
                  <span className="font-code-badge text-code-badge bg-secondary text-on-secondary px-1.5 py-0.5 rounded">Action 1</span>
                </div>

                <div className="p-space-sm rounded-lg bg-surface-container-highest text-on-surface flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary text-base">construction</span>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-[10px] uppercase font-bold text-on-surface-variant">Joint Secondary (Post-Repair)</span>
                      <span className="font-body-sm text-body-sm font-bold">Roads &amp; Infra (BBMP)</span>
                    </div>
                  </div>
                  <span className="font-code-badge text-code-badge bg-outline text-surface-container-lowest px-1.5 py-0.5 rounded">Action 2</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-lg flex flex-col gap-1 shadow-sm">
                <div className="flex items-center gap-space-xs text-primary font-label-caps text-label-caps uppercase font-bold">
                  <span className="material-symbols-outlined text-base">psychology_alt</span>
                  <span>Civic Engineering Reasoning Proof</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                  &quot;Citizen images show continuous bubbling artesian upwelling alongside sediment discoloration. Cross-referencing K-GIS Cadastral utility map confirms a <strong>250mm cast-iron BWSSB potable feeder main directly under the crack</strong>. Secondary dispatch to BBMP Roads is required for structural backfilling once BWSSB valve is isolated.&quot;
                </p>
              </div>
            </div>

            {/* Officer Assignment */}
            <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold font-headline-md">
                  RK
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">Suggested Lead Officer</span>
                  <span className="font-body-md text-body-md font-bold text-on-surface">Er. Ramesh K.</span>
                  <span className="font-code-sla text-code-sla text-secondary">Asst. Executive Engineer, BWSSB Ward 12 Division</span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm bg-surface-container px-space-sm py-1 rounded">
                <span className="material-symbols-outlined text-sm text-primary">support_agent</span>
                <span>Secondary Liaison: <strong>Insp. M. Suresh (Traffic East)</strong></span>
              </div>
            </div>

            {/* Command Trigger Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setIsReassignOpen(true)}
                className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm font-semibold transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">swap_horiz</span>
                <span>Reassign Department</span>
              </button>

              <button
                type="button"
                disabled
                title="Real dispatch integration is not connected"
                className="flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface-container text-on-surface-variant font-body-sm text-body-sm font-bold shadow-md opacity-70 cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span>Dispatch unavailable</span>
              </button>
            </div>
          </article>
        </div>

        {/* Right 5 cols: Pending Routing Queue */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-xl">move_to_inbox</span>
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Pending Routing Triage</h3>
              </div>
              <span className="bg-surface-container text-on-surface-variant font-code-badge text-code-badge px-space-sm py-0.5 rounded">
                {pendingQueue.length} Priority Records
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Multi-department complaints requiring officer verification or jurisdictional sign-off.
            </p>

            <div className="flex flex-col gap-space-md">
              {pendingQueue.map((item) => (
                <article key={item.id} className="p-space-md rounded-lg bg-surface-container-low hover:bg-surface-container transition-all flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-code-badge text-code-badge text-on-surface font-bold">#{item.id}</span>
                    <span className={`font-code-badge text-code-badge px-space-xs rounded ${item.matchColor}`}>
                      {item.match}
                    </span>
                  </div>
                  <h4 className="font-body-md text-body-md text-on-surface font-bold">{item.title}</h4>
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-code-sla text-code-sla">
                    <span className="material-symbols-outlined text-sm text-secondary">domain</span>
                    <span>Dept: <strong>{item.dept}</strong></span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{item.officer}</span>
                    <div className="flex items-center gap-space-xs">
                      <button
                        type="button"
                        disabled
                        title="Sample queue records cannot be reassigned"
                        className="px-space-sm py-1 rounded bg-surface-container-highest text-on-surface-variant font-code-badge text-code-badge opacity-70 cursor-not-allowed"
                      >
                        Reassign
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Sample queue records cannot be dispatched"
                        className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant font-code-badge text-code-badge font-bold opacity-70 cursor-not-allowed"
                      >
                        Sample only
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* REASSIGN MODAL */}
      {isReassignOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-xl p-space-lg shadow-xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-sm">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-2xl">published_with_changes</span>
                <div className="flex flex-col">
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Manual Jurisdictional Reassignment</h3>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Overriding AI recommendation requires statutory reason</span>
                </div>
              </div>
              <button onClick={() => setIsReassignOpen(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-space-sm">
              <label className="font-label-caps text-label-caps uppercase text-on-surface font-bold">Select Destination Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-surface-container-low p-space-sm rounded-lg font-body-md text-body-md text-on-surface focus:outline-none"
                disabled={departmentsLoading || departments.length === 0}
              >
                <option value="">{departmentsLoading ? 'Loading departments…' : 'Select a department'}</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
              {departmentsError && <p role="alert" className="text-error text-body-sm">{departmentsError}</p>}
              {!departmentsLoading && !departmentsError && departments.length === 0
                && <p className="text-on-surface-variant text-body-sm">No active departments are configured.</p>}
            </div>

            <div className="flex flex-col gap-space-sm">
              <label className="font-label-caps text-label-caps uppercase text-on-surface font-bold">Superintendent Override Reason (Audit Trail)</label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Ground inspection indicates storm overflow rather than potable mains burst..."
                className="w-full bg-surface-container-low p-space-sm rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setIsReassignOpen(false)}
                className="px-space-md py-space-sm rounded-lg bg-surface-container text-on-surface font-body-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                disabled={!selectedDept}
                className="px-space-md py-space-sm rounded-lg bg-secondary text-on-secondary font-body-sm font-bold shadow-sm"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
