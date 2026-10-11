import React from 'react';
import { useApp } from '../../context/AppContext';
import { exportService } from '../../services/exportService';

export const TransparencyGalleryView: React.FC = () => {
  const { setCurrentView, showToast } = useApp();

  const galleryItems = [
    {
      title: '12th Main Road Asphalt Cavity & Subsidence',
      ward: 'Ward 12 Indiranagar',
      category: 'Roads & Infrastructure',
      ticketId: 'CMP-8710',
      completedDate: 'Oct 14, 2026',
      beforeImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1Upxs1KVciTbs7EH4MC4myyaptiYg1nI0ISqmEjeNR8HxA9shmAOBzv_LYAMeHZGPJxfpjUyzSTrzjtxvP_sCB2WZGFNiph2iPnhB7vnqOb2P1go_Eqsnx43IZEdimsekePPptFw6Bjg6m98ggsOyNg-xXJ_loVL5fZo6nXhJPwZ3V_UsAZuHeO-JhdvzbHV1_-yhQPJ4rF7wLLURUGpb1iyGIYz3WDwHAYK-fng',
      afterImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDt8YV3mgi544a9Ux1hsXObrcxS5zt101ciJE7VxuA3k7P4cI400H-jS8tVUEg6e0u6bWtxhAeA4gJoUQRYzBGkQuhgJOoIvswuhRNCG2pMacm32jaQWfXeFm3oY1G3W16ZP805p7LZmbdJ8M8N7KLne9WcJPNbHgjG9aE6QsgeFsnqz84jFk6J9HsVavcCnopF_NC4J3EQBOpX1mYWGMWPexVp8BpdkBKGWsdQp58',
      beforeNote: 'Citizen initial report: Exposed aggregate causing vehicle skids.',
      afterNote: 'Supervisor sign-off: Compacted with bitumen layer, warranty active 12 months.',
      crew: 'Municipal Response Crew #02'
    },
    {
      title: '80ft Road Streetlight Luminaire Replacement',
      ward: 'Ward 12 Sector 04',
      category: 'Power & Grid (BESCOM)',
      ticketId: 'CMP-8742',
      completedDate: 'Oct 18, 2026',
      beforeImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB813wAg08nQP9cCociYEYQq9WkAsz9vgoDUHFSLU1_22EKCv4ctf6GIBjB2iwfR-lw1vaxWO7qJqIqDAjsSQjJN4nrLn-kchOIuLd66KBJxvO4LozB4Y7ky1bj4iZMBT-UOivZ3pc-nF1KGaU8CCJ1VAiCbtotJxy9NPkFTgoHsXf0vmCbh58iIGK9xeSXtMOmMnUnveZa05o725aYAXkEkesSd8UanJ3HsyKAA1U',
      afterImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6z5omOP74fAt-EfibpQx-D_T8kuDypijZzoFIAs7uiOsh73D_sIEZ4cwilzp7ya6lkAX_dqcp6F-V2KzaR5E2InErLF1UU6Zl17IUmMVJWcO5Z5H6k39dDJ6yOkkk5hLS1TZO_JJDEleMlIsDz1pfiF08SxqxoQehiWy3Uk2Q-9SshQU7j3g7q2i3v5yYvvf75uSyH7N_b0Wo4U_TWg8H7dFKPHLD86_tLtAONfc',
      beforeNote: 'Damaged luminaire pole and flickering bulb causing dark corridor.',
      afterNote: 'Fitted 120W Philips LED fixture with smart feeder circuit.',
      crew: 'BESCOM Line Unit #08'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-space-lg pb-space-xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-space-xs text-secondary font-code-badge text-code-badge uppercase">
            <span className="material-symbols-outlined text-sm">policy</span>
            <span>Public Transparency Ledger</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            Ward Transparency Gallery
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Verified photographic evidence and before/after audits uploaded by municipal field inspection teams for closed tickets.
          </p>
        </div>
        <button
          onClick={() => {
            exportService.exportToPdf(
              'Ward12_Certified_Civic_Audit.pdf',
              'NagarSetu Civic Transparency Audit',
              'BBMP Ward 12 Indiranagar - Closed Works Photographic Verification',
              [
                'Auditor Desk: Office of the Executive Engineer (East Zone)',
                'Standard: ISO-37120 Municipal Indicators Standard',
                'Status: 100% Photographic Before/After Verification Complete',
                'Ticket #CMP-8710: 12th Main Road Asphalt Cavity - Restored by Rapid Patch Rig #04',
                'Ticket #CMP-8654: Commercial Street Luminaire Outage - Replaced with 90W LED Luminaire',
                'Citizen Sign-Off: Confirmed by Resident Working Group Ward 12',
                'Public Integrity Ledger: Signed & Hashed for Ombudsman Oversight'
              ]
            );
            showToast('Report Generated', 'Downloaded Certified Ward 12 Audit Summary PDF.');
          }}
          className="inline-flex items-center gap-space-xs px-space-md py-2 bg-secondary text-on-secondary rounded-lg font-body-sm text-body-sm font-semibold shadow-sm hover:opacity-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">download</span>
          <span>Download Certified Audit (PDF)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-space-xl">
        {galleryItems.map((item, index) => (
          <section key={index} className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">
            <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-xs border-b border-surface-container">
              <div>
                <span className="font-label-caps text-label-caps uppercase text-secondary font-bold">{item.category}</span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">{item.title}</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{item.ward} • Closed on {item.completedDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-code-badge text-code-badge bg-surface-container px-2 py-1 rounded text-on-surface font-bold">
                  #{item.ticketId}
                </span>
                <span className="font-code-badge text-code-badge bg-secondary-container text-on-secondary-container px-2 py-1 rounded font-bold">
                  ✓ VERIFIED REPAIR
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
              {/* Before */}
              <div className="flex flex-col gap-2">
                <div className="relative rounded-lg overflow-hidden h-60 bg-surface-container">
                  <img className="w-full h-full object-cover" alt="Before repair" src={item.beforeImg} />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-tertiary text-on-tertiary font-label-caps text-label-caps uppercase font-bold shadow-sm">
                    Before • Reported Issue
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low p-space-sm rounded">
                  <strong className="text-on-surface">Initial Report:</strong> {item.beforeNote}
                </p>
              </div>

              {/* After */}
              <div className="flex flex-col gap-2">
                <div className="relative rounded-lg overflow-hidden h-60 bg-surface-container">
                  <img className="w-full h-full object-cover" alt="After repair" src={item.afterImg} />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-secondary text-on-secondary font-label-caps text-label-caps uppercase font-bold shadow-sm">
                    After • Verified Resolution
                  </span>
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-on-background/80 text-on-primary font-code-badge text-[0.625rem]">
                    {item.crew}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant bg-secondary-container/30 p-space-sm rounded">
                  <strong className="text-secondary font-bold">Field Sign-Off:</strong> {item.afterNote}
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
