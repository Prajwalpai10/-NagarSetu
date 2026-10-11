import React, { useState } from 'react';

export const AdminSettingsView: React.FC = () => {
  const [settings, setSettings] = useState({
    p1SlaHours: 4,
    p2SlaHours: 12,
    p3SlaHours: 24,
    aiAutoApproveThreshold: 90,
    geoDeduplicationRadiusMeters: 250,
    autoMergeConfidence: 85,
    smsGatewayActive: true,
    whatsAppRelayActive: true,
    telemetryRefreshRateSecs: 10,
    contractorPenaltyPerHour: 2500,
    emergencyHotlineActive: true,
  });

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      {/* Header Banner */}
      <div className="bg-surface border-b border-outline-variant/30 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">tune</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">Administration & Operational Settings</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-surface-container text-on-surface font-mono">
              SYSTEM CONFIG V4.2
            </span>
          </div>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Statutory SLA threshold policies, multi-modal AI triage hyperparameters, and municipal telecommunication relays
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            title="System diagnostics are not connected"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 rounded-lg text-xs font-semibold text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm text-secondary">
              sync
            </span>
            Diagnostics unavailable
          </button>
        </div>
      </div>

      <div role="status" className="mx-6 mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        These controls are illustrative only. NagarSetu has no persisted settings API or connected gateway diagnostics;
        changes are disabled and nothing on this page configures operational services.
      </div>

      {/* Main Settings Form */}
      <form onSubmit={event => event.preventDefault()} className="p-6 max-w-5xl space-y-6">
        <fieldset disabled className="contents">
          <legend className="sr-only">Demonstration-only settings; editing is unavailable</legend>
        {/* Section 1: Statutory SLA Threshold Rules */}
        <div className="bg-surface rounded-xl border border-outline-variant/30 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/20">
            <span className="material-symbols-outlined text-secondary text-xl">timer</span>
            <div>
              <h2 className="font-headline-md text-base font-bold text-on-surface">Statutory SLA Compliance Parameters</h2>
              <p className="text-xs text-on-surface-variant">Configure legal turnaround deadlines enforced by BBMP Grievance Charter</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-on-surface mb-1">
                P1 Emergency Statutory Limit (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={settings.p1SlaHours}
                onChange={(e) => setSettings({ ...settings, p1SlaHours: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface font-mono text-on-surface outline-none focus:border-secondary"
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">Sinkholes, live power cables, major collapses</span>
            </div>

            <div>
              <label className="block font-semibold text-on-surface mb-1">
                P2 High Priority Limit (Hours)
              </label>
              <input
                type="number"
                min="2"
                max="48"
                value={settings.p2SlaHours}
                onChange={(e) => setSettings({ ...settings, p2SlaHours: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface font-mono text-on-surface outline-none focus:border-secondary"
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">Sanitation overflow, streetlight blackout</span>
            </div>

            <div>
              <label className="block font-semibold text-on-surface mb-1">
                Breach Contractor Penalty (₹ / Hour)
              </label>
              <input
                type="number"
                step="500"
                value={settings.contractorPenaltyPerHour}
                onChange={(e) => setSettings({ ...settings, contractorPenaltyPerHour: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface font-mono text-on-surface outline-none focus:border-secondary"
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">Deducted from vendor maintenance deposit</span>
            </div>
          </div>
        </div>

        {/* Section 2: AI Multi-Modal Triage Hyperparameters */}
        <div className="bg-surface rounded-xl border border-outline-variant/30 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/20">
            <span className="material-symbols-outlined text-secondary text-xl">psychology</span>
            <div>
              <h2 className="font-headline-md text-base font-bold text-on-surface">Multi-Modal AI Triage Rules</h2>
              <p className="text-xs text-on-surface-variant">Automated computer vision classification, duplicate grouping, and smart dispatch</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-on-surface mb-1">
                Auto-Approve Confidence Threshold (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="75"
                  max="99"
                  value={settings.aiAutoApproveThreshold}
                  onChange={(e) => setSettings({ ...settings, aiAutoApproveThreshold: Number(e.target.value) })}
                  className="w-full accent-secondary"
                />
                <span className="font-mono font-bold text-secondary text-sm w-12 text-right">
                  {settings.aiAutoApproveThreshold}%
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1 block">Cases above this auto-dispatch without manual officer review</span>
            </div>

            <div>
              <label className="block font-semibold text-on-surface mb-1">
                Geo-Deduplication Radius (Meters)
              </label>
              <input
                type="number"
                step="50"
                min="50"
                max="1000"
                value={settings.geoDeduplicationRadiusMeters}
                onChange={(e) => setSettings({ ...settings, geoDeduplicationRadiusMeters: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface font-mono text-on-surface outline-none focus:border-secondary"
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">Cluster radius for auto-merging duplicate citizen reports</span>
            </div>

            <div>
              <label className="block font-semibold text-on-surface mb-1">
                Telemetry GPS Refresh Frequency (Secs)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={settings.telemetryRefreshRateSecs}
                onChange={(e) => setSettings({ ...settings, telemetryRefreshRateSecs: Number(e.target.value) })}
                className="w-full p-2.5 rounded-lg border border-outline-variant/40 bg-surface font-mono text-on-surface outline-none focus:border-secondary"
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">Live field crew GPS ping frequency</span>
            </div>
          </div>
        </div>

        {/* Section 3: Telecommunications & Citizen Relays */}
        <div className="bg-surface rounded-xl border border-outline-variant/30 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/20">
            <span className="material-symbols-outlined text-secondary text-xl">cell_tower</span>
            <div>
              <h2 className="font-headline-md text-base font-bold text-on-surface">Citizen Relay & Communication Gateways</h2>
              <p className="text-xs text-on-surface-variant">Real-time SMS notifications, WhatsApp dispatch bots, and civic helpline integrations</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 cursor-pointer">
              <div>
                <div className="font-bold text-on-surface">NIC SMS Gateway Dispatch Relay</div>
                <div className="text-[11px] text-on-surface-variant">Dispatches statutory SMS tokens (#CMP-2026-...) to citizen mobile numbers</div>
              </div>
              <input
                type="checkbox"
                checked={settings.smsGatewayActive}
                onChange={(e) => setSettings({ ...settings, smsGatewayActive: e.target.checked })}
                className="w-4 h-4 accent-secondary rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 cursor-pointer">
              <div>
                <div className="font-bold text-on-surface">WhatsApp Citizen Bot & Photo Intake Webhook</div>
                <div className="text-[11px] text-on-surface-variant">Allows citizens to report potholes and track token status via official BBMP WhatsApp</div>
              </div>
              <input
                type="checkbox"
                checked={settings.whatsAppRelayActive}
                onChange={(e) => setSettings({ ...settings, whatsAppRelayActive: e.target.checked })}
                className="w-4 h-4 accent-secondary rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 cursor-pointer">
              <div>
                <div className="font-bold text-on-surface">Civic Emergency Hotline 1913 Telephony Gateway</div>
                <div className="text-[11px] text-on-surface-variant">24/7 central civic disaster response routing integration</div>
              </div>
              <input
                type="checkbox"
                checked={settings.emergencyHotlineActive}
                onChange={(e) => setSettings({ ...settings, emergencyHotlineActive: e.target.checked })}
                className="w-4 h-4 accent-secondary rounded"
              />
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-colors"
          >
            Reset to Defaults
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-bold text-xs hover:brightness-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            Save Settings
          </button>
        </div>
        </fieldset>
      </form>
    </div>
  );
};
