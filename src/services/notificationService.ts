import { NotificationItem } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/initialData';
import { storageService } from './storageService';

const NOTIFICATIONS_KEY = 'notifications';

export const notificationService = {
  getAll: (): NotificationItem[] => {
    return storageService.get<NotificationItem[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
  },

  saveAll: (items: NotificationItem[]): void => {
    storageService.set(NOTIFICATIONS_KEY, items);
  },

  markAsRead: (id: string): NotificationItem[] => {
    const list = notificationService.getAll();
    const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
    notificationService.saveAll(updated);
    return updated;
  },

  markAllAsRead: (): NotificationItem[] => {
    const list = notificationService.getAll();
    const updated = list.map(n => ({ ...n, read: true }));
    notificationService.saveAll(updated);
    return updated;
  },

  dismiss: (id: string): NotificationItem[] => {
    const list = notificationService.getAll();
    const updated = list.filter(n => n.id !== id);
    notificationService.saveAll(updated);
    return updated;
  },

  clearAll: (): NotificationItem[] => {
    notificationService.saveAll([]);
    return [];
  },

  addNotification: (item: Partial<NotificationItem>): NotificationItem => {
    const list = notificationService.getAll();
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: item.title || 'Ward Notification',
      message: item.message || '',
      category: item.category || 'updates',
      priorityBadge: item.priorityBadge || 'Municipal Alert',
      ticketId: item.ticketId,
      timeAgo: 'Just now',
      read: false,
      icon: item.icon || 'notifications',
      actionLabel: item.actionLabel,
      actionView: item.actionView,
      actionTicketId: item.actionTicketId,
    };

    const updated = [newNotif, ...list];
    notificationService.saveAll(updated);
    return newNotif;
  }
};
