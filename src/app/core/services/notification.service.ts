import { Injectable, signal, computed } from '@angular/core';
import { AppNotification, NotificationType } from '../../shared/models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly notificationsSignal = signal<AppNotification[]>([]);

  readonly notifications = this.notificationsSignal.asReadonly();

  readonly unreadCount = computed(() =>
    this.notificationsSignal().filter(n => !n.read).length
  );

  readonly unreadNotifications = computed(() =>
    this.notificationsSignal().filter(n => !n.read)
  );

  addNotification(notification: AppNotification): void {
    this.notificationsSignal.update(notifications => [notification, ...notifications]);

    // Auto-show browser notification if permission granted
    if (window.Notification && window.Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  }

  markAsRead(notificationId: string): void {
    this.notificationsSignal.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }

  markAllAsRead(): void {
    this.notificationsSignal.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  }

  removeNotification(notificationId: string): void {
    this.notificationsSignal.update(notifications =>
      notifications.filter(n => n.id !== notificationId)
    );
  }

  clearAll(): void {
    this.notificationsSignal.set([]);
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (window.Notification.permission === 'granted') {
      return 'granted';
    }

    if (window.Notification.permission !== 'denied') {
      return await window.Notification.requestPermission();
    }

    return window.Notification.permission;
  }
}
