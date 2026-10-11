/**
 * NagarSetu – Access Denied Page
 */

import React from 'react';

interface AccessDeniedPageProps {
  reason?: string;
  onGoHome: () => void;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ reason, onGoHome }) => {
  return (
    <div className="min-h-screen bg-[#F7F4EA] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#ffdad6] flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-3xl text-[#ba1a1a]" aria-hidden="true">lock</span>
      </div>
      <h1 className="text-2xl font-bold text-[#171A17] mb-2">Access Denied</h1>
      <p className="text-on-surface-variant max-w-sm mb-1">
        {reason ?? 'You do not have permission to access this page.'}
      </p>
      <p className="text-sm text-on-surface-variant/70 max-w-sm mb-6">
        If you believe this is an error, please contact your administrator.
      </p>
      <button
        type="button"
        onClick={onGoHome}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#315C4A] text-white font-bold rounded-xl hover:brightness-105 transition cursor-pointer"
      >
        <span className="material-symbols-outlined text-lg" aria-hidden="true">home</span>
        Return Home
      </button>
    </div>
  );
};
