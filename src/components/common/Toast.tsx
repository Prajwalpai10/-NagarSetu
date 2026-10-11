import React from 'react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useApp();

  if (!toast) return null;

  const typeStyles = {
    success: 'bg-on-secondary-fixed text-secondary-fixed',
    warning: 'bg-primary-container text-on-primary-container',
    error: 'bg-tertiary text-on-tertiary',
    info: 'bg-surface-container-highest text-on-surface'
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-space-sm px-space-lg py-space-md rounded-xl shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${typeStyles[toast.type || 'success']}`}
    >
      <span className="material-symbols-outlined text-2xl" aria-hidden="true">
        {toast.icon || 'check_circle'}
      </span>
      <div className="flex flex-col min-w-0 pr-2">
        <span className="font-headline-md text-body-md font-bold leading-tight">
          {toast.title}
        </span>
        <span className="font-body-sm text-body-sm opacity-90 mt-0.5">
          {toast.description}
        </span>
      </div>
      <button
        onClick={hideToast}
        className="p-1 rounded hover:bg-black/10 transition-colors ml-auto cursor-pointer"
        aria-label="Close notification"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );
};
