import React from 'react';
import { useApp } from '../../context/AppContext';

const resourceLinks = [
  {
    title: 'Reports & Analytics',
    description: 'Open the existing illustrative analytics dossier. Its sample counts and charts are not connected to operational records.',
    view: 'analytics' as const,
    label: 'Open demonstration report',
  },
  {
    title: 'Administration Settings',
    description: 'Review the configuration concepts currently shown in the settings screen. Changes and diagnostics are not connected to persisted system settings.',
    view: 'admin_settings' as const,
    label: 'Review settings availability',
  },
];

export const AdminResourcesView: React.FC = () => {
  const { setCurrentView } = useApp();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 pb-12 sm:p-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-secondary">Admin Portal</p>
        <h1 className="mt-1 text-2xl font-bold text-on-surface sm:text-3xl">Reports &amp; Settings</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Access the existing report and configuration surfaces with their current data limitations made explicit.</p>
      </header>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {resourceLinks.map(link => (
          <article key={link.view} className="rounded-xl border border-surface-container bg-surface-container-lowest p-5">
            <h2 className="text-lg font-bold text-on-surface">{link.title}</h2>
            <p className="mt-2 min-h-12 text-sm text-on-surface-variant">{link.description}</p>
            <button
              type="button"
              onClick={() => setCurrentView(link.view)}
              className="mt-4 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary"
            >
              {link.label}
            </button>
          </article>
        ))}
      </section>
      <aside className="rounded-xl border border-surface-container bg-surface-container-low p-5">
        <h2 className="font-bold text-on-surface">Secondary admin tools</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          The Operations Map, Department Performance, Hotspots, User Management, and My Profile remain available under “More admin tools.”
          Map, hotspot, and performance figures are demonstrations unless an existing view explicitly identifies API-backed data.
        </p>
      </aside>
    </main>
  );
};
