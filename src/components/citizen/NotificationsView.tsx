import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NotificationItem } from '../../types';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    dismissNotification,
    setCurrentView,
    setSelectedTicketId,
    showToast
  } = useApp();

  const [currentFilter, setCurrentFilter] = useState<'all' | 'complaints' | 'updates' | 'emergency' | 'system'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(item => {
    const matchesCategory = currentFilter === 'all' || item.category === currentFilter;
    const matchesUnread = !unreadOnly || !item.read;
    return matchesCategory && matchesUnread;
  });

  const handleAction = (item: NotificationItem) => {
    markNotificationAsRead(item.id);
    if (item.actionTicketId) {
      setSelectedTicketId(item.actionTicketId.replace('#', ''));
    }
    if (item.actionView) {
      setCurrentView(item.actionView);
    } else {
      showToast('Notification Checked', item.title);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-space-lg pb-space-xl">
      {/* Top Municipal Operational Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-xs">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-code-badge text-code-badge">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              DISPATCH STREAM ACTIVE
            </span>
            <span className="font-code-sla text-code-sla text-on-surface-variant">BBMP Central Ward 12 Feed</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">Notifications</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Real-time municipal dispatch updates, automated AI triage findings, and ward alerts.
          </p>
        </div>

        <div className="flex items-center gap-space-xs flex-wrap">
          <button
            type="button"
            onClick={markAllNotificationsAsRead}
            className="inline-flex items-center gap-1.5 px-space-md py-2 bg-surface-container-lowest text-secondary font-body-sm text-body-sm font-semibold rounded shadow-sm hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">done_all</span>
            <span>Mark All as Read</span>
          </button>
          <button
            type="button"
            onClick={clearAllNotifications}
            className="inline-flex items-center gap-1.5 px-space-md py-2 bg-surface-container-lowest text-on-surface-variant font-body-sm text-body-sm hover:text-error hover:bg-surface-container-low transition-colors rounded shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">delete_sweep</span>
            <span>Clear All</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPreferencesOpen(true)}
            className="p-2 bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors rounded shadow-sm cursor-pointer"
            title="Notification Preferences"
          >
            <span className="material-symbols-outlined text-xl">tune</span>
          </button>
        </div>
      </div>

      {/* Live Telemetry KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">Active Incidents</span>
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface mt-0.5">04</span>
            <span className="font-code-sla text-code-sla text-secondary mt-1">Ward 12 Triage Live</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-xl">engineering</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">Unread Alerts</span>
            <span className="font-headline-lg text-headline-lg font-bold text-primary mt-0.5">{unreadCount}</span>
            <span className="font-code-sla text-code-sla text-on-surface-variant mt-1">1 Requires Resident Action</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
            <span className="material-symbols-outlined text-xl">notifications_active</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">Avg Ward Response</span>
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface mt-0.5">38m</span>
            <span className="font-code-sla text-code-sla text-secondary mt-1">Within SLA Target &lt; 2h</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-xl">timer</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">Emergency Status</span>
            <span className="font-headline-lg text-headline-lg font-bold text-tertiary mt-0.5">P1 Alert</span>
            <span className="font-code-sla text-code-sla text-tertiary mt-1">Cold-mix crew on-site</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
            <span className="material-symbols-outlined text-xl">warning</span>
          </div>
        </div>
      </div>

      {/* Filter Pills Bar & Unread Toggle */}
      <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'complaints', label: 'Complaints', count: notifications.filter(n => n.category === 'complaints').length },
            { key: 'updates', label: 'Updates', count: notifications.filter(n => n.category === 'updates').length },
            { key: 'emergency', label: 'Emergency', count: notifications.filter(n => n.category === 'emergency').length, hasDot: true },
            { key: 'system', label: 'System', count: notifications.filter(n => n.category === 'system').length },
          ].map((tab) => {
            const isActive = currentFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCurrentFilter(tab.key as any)}
                className={`px-space-md py-1.5 rounded-lg font-body-sm text-body-sm font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-secondary text-on-secondary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {tab.hasDot && <span className="w-2 h-2 rounded-full bg-tertiary"></span>}
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-[0.6875rem] font-code-badge ${isActive ? 'bg-on-secondary-fixed-variant text-secondary-fixed' : 'bg-surface-container-high text-on-surface'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Unread Only Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-space-sm pl-space-sm">
          <label className="font-body-sm text-body-sm font-medium text-on-surface-variant cursor-pointer select-none">
            Unread only ({unreadCount})
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={unreadOnly}
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${unreadOnly ? 'bg-secondary' : 'bg-surface-container-highest'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-surface-container-lowest shadow-sm transition duration-200 ease-in-out mt-1 ${unreadOnly ? 'translate-x-6' : 'translate-x-1'}`}
            ></span>
          </button>
        </div>
      </div>

      {/* Notification Feed List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm text-center flex flex-col items-center justify-center gap-space-sm py-16">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-space-xs">
            <span className="material-symbols-outlined text-3xl">notifications_off</span>
          </div>
          <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">No notifications in this category</h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            You are completely caught up! New dispatch alerts, AI cluster detections, and resolution updates will appear here automatically.
          </p>
          <button
            type="button"
            onClick={() => { setCurrentFilter('all'); setUnreadOnly(false); }}
            className="mt-space-sm px-space-md py-2 bg-secondary text-on-secondary font-body-sm text-body-sm font-semibold rounded hover:bg-secondary/90 transition-colors shadow-sm cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-space-md">
          {filteredNotifications.map((item) => (
            <article
              key={item.id}
              className={`group relative p-space-md rounded-xl shadow-sm transition-all hover:shadow-md ${
                item.read ? 'bg-surface-container-lowest/80' : 'bg-surface-container-lowest border-l-4 border-secondary'
              }`}
            >
              <div className="flex items-start gap-space-md">
                <div className="relative flex-shrink-0 pt-0.5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.category === 'emergency'
                      ? 'bg-tertiary-container text-on-tertiary-container'
                      : item.category === 'updates'
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container text-primary'
                  }`}>
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </div>
                  {!item.read && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-tertiary ring-2 ring-surface-container-lowest"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between gap-space-xs flex-wrap">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="font-headline-md text-headline-md text-on-surface font-semibold">{item.title}</span>
                      {item.priorityBadge && (
                        <span className={`font-code-badge text-code-badge px-space-xs py-0.5 rounded font-bold tracking-tight ${
                          item.priorityBadge.includes('Urgent') || item.priorityBadge.includes('P1')
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : 'bg-secondary-fixed text-on-secondary-fixed-variant'
                        }`}>
                          {item.priorityBadge}
                        </span>
                      )}
                      {item.ticketId && (
                        <span className="font-code-sla text-code-sla text-primary font-bold">{item.ticketId}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-code-badge text-code-badge text-on-surface-variant">{item.timeAgo}</span>
                      <button
                        type="button"
                        onClick={() => dismissNotification(item.id)}
                        className="text-on-surface-variant hover:text-error p-1 rounded transition-colors cursor-pointer"
                        title="Dismiss notification"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  </div>

                  <p className="font-body-md text-body-md text-on-surface">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between gap-space-md pt-space-xs flex-wrap">
                    <div className="flex items-center gap-space-sm">
                      {item.actionLabel && (
                        <button
                          type="button"
                          onClick={() => handleAction(item)}
                          className="inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold text-secondary hover:underline cursor-pointer"
                        >
                          <span>{item.actionLabel}</span>
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </button>
                      )}
                      {!item.read && (
                        <button
                          type="button"
                          onClick={() => markNotificationAsRead(item.id)}
                          className="text-on-surface-variant hover:text-on-surface font-body-sm text-xs cursor-pointer"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                    {item.ticketId && (
                      <span className="font-code-sla text-code-sla text-on-surface-variant text-xs">
                        Ward 12 Indiranagar Registry
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Notification Channels & Dispatch Relays */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
        <div className="flex items-start gap-space-md">
          <div className="w-10 h-10 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-xl">phonelink_ring</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-xs flex-wrap">
              <span className="font-headline-md text-body-lg font-bold text-on-surface">Notification Channels &amp; Dispatch Relays</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-code-badge text-code-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                All Relays Active
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Push notifications active • SMS alerts linked to registered mobile (<span className="font-code-sla">+91 98••• ••210</span>) • WhatsApp alerts enabled
            </p>
          </div>
        </div>
        <div className="flex items-center gap-space-xs w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsPreferencesOpen(true)}
            className="inline-flex items-center gap-1.5 px-space-md py-2 bg-surface-container-low text-on-surface font-body-sm text-body-sm font-semibold rounded hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            <span>Manage Preferences</span>
          </button>
        </div>
      </div>

      {/* PREFERENCES MODAL */}
      {isPreferencesOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-space-lg shadow-xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-2xl">tune</span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Notification Preferences</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPreferencesOpen(false)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-space-md font-body-sm text-body-sm">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-on-surface">Emergency &amp; Hazard Alerts (P1)</span>
                  <span className="text-on-surface-variant text-body-sm">Urgent traffic and life-safety escalations in Ward 12.</span>
                </div>
                <input type="checkbox" defaultChecked disabled className="accent-secondary w-4 h-4 cursor-not-allowed" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-on-surface">WhatsApp Dispatch Alerts</span>
                  <span className="text-on-surface-variant text-body-sm">Instant photo verification when crew completes task.</span>
                </div>
                <input type="checkbox" defaultChecked className="accent-secondary w-4 h-4 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-on-surface">SMS Critical Updates</span>
                  <span className="text-on-surface-variant text-body-sm">Relay directly to +91 98••• ••210 when offline.</span>
                </div>
                <input type="checkbox" defaultChecked className="accent-secondary w-4 h-4 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-on-surface">AI Cluster Detection Notices</span>
                  <span className="text-on-surface-variant text-body-sm">Notify when neighbor tickets are combined.</span>
                </div>
                <input type="checkbox" defaultChecked className="accent-secondary w-4 h-4 cursor-pointer" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-space-xs pt-space-xs border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setIsPreferencesOpen(false)}
                className="px-space-md py-1.5 text-on-surface-variant font-semibold hover:text-on-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPreferencesOpen(false);
                  showToast('Preferences Saved', 'Updated alert preferences for Ward 12.');
                }}
                className="px-space-md py-1.5 bg-secondary text-on-secondary rounded font-semibold hover:bg-secondary/90 cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
