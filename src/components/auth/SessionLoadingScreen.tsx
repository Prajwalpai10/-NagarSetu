/**
 * NagarSetu – Session Loading Spinner
 * Shown while the app verifies the session on startup.
 */

import React from 'react';

export const SessionLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[#F7F4EA] flex flex-col items-center justify-center gap-4" aria-live="polite" aria-label="Loading">
    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center shadow-md">
      <span className="material-symbols-outlined text-3xl text-on-secondary" aria-hidden="true">account_balance</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <span className="w-6 h-6 border-3 border-secondary/30 border-t-secondary rounded-full animate-spin" aria-hidden="true" />
      <p className="text-sm font-semibold text-on-surface-variant">Verifying session…</p>
    </div>
  </div>
);
