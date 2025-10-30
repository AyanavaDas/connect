import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserStatus } from '../../shared/models/user.model';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  template: `
    <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Brand -->
          <div class="flex items-center space-x-3">
            <div class="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900">Connect</h1>
              <p class="text-xs text-gray-500">Video Chat Platform</p>
            </div>
          </div>

          <!-- Right Section -->
          <div class="flex items-center space-x-4">
            <!-- Notifications -->
            <button
              (click)="toggleNotifications()"
              class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              @if (unreadCount() > 0) {
                <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {{ unreadCount() }}
                </span>
              }
            </button>

            <!-- Status Dropdown -->
            <div class="relative">
              <button
                (click)="toggleStatusMenu()"
                class="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div class="relative">
                  <div [class]="'w-3 h-3 rounded-full ' + getStatusColor(currentUser()?.status)"></div>
                </div>
                <span class="text-sm font-medium text-gray-700 capitalize">{{ currentUser()?.status }}</span>
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              @if (showStatusMenu()) {
                <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    (click)="setStatus('online')"
                    class="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div class="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Online</span>
                  </button>
                  <button
                    (click)="setStatus('away')"
                    class="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Away</span>
                  </button>
                  <button
                    (click)="setStatus('busy')"
                    class="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div class="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Busy</span>
                  </button>
                </div>
              }
            </div>

            <!-- User Menu -->
            <div class="relative">
              <button
                (click)="toggleUserMenu()"
                class="flex items-center space-x-3 focus:outline-none"
              >
                <img
                  [src]="currentUser()?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'"
                  [alt]="currentUser()?.username"
                  class="h-10 w-10 rounded-full border-2 border-blue-500 shadow-sm"
                />
              </button>

              @if (showUserMenu()) {
                <div class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div class="px-4 py-3 border-b border-gray-200">
                    <p class="text-sm font-medium text-gray-900">{{ currentUser()?.username }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ currentUser()?.email }}</p>
                  </div>
                  <button
                    (click)="logout()"
                    class="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Panel -->
      @if (showNotifications()) {
        <div class="absolute right-4 top-16 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div class="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
            @if (unreadCount() > 0) {
              <button
                (click)="markAllAsRead()"
                class="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
            }
          </div>
          <div class="divide-y divide-gray-200">
            @if (notifications().length === 0) {
              <div class="p-8 text-center text-gray-500">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p class="mt-2">No notifications yet</p>
              </div>
            } @else {
              @for (notification of notifications(); track notification.id) {
                <div [class]="'p-4 ' + (!notification.read ? 'bg-blue-50' : 'hover:bg-gray-50')">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
                      <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
                      <p class="text-xs text-gray-400 mt-1">
                        {{ formatDate(notification.createdAt) }}
                      </p>
                    </div>
                    @if (!notification.read) {
                      <div class="w-2 h-2 rounded-full bg-blue-600 mt-1 ml-2"></div>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }
    </header>
  `,
  styles: []
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly notifications = this.notificationService.notifications;
  protected readonly unreadCount = this.notificationService.unreadCount;

  protected readonly showUserMenu = signal(false);
  protected readonly showStatusMenu = signal(false);
  protected readonly showNotifications = signal(false);

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
    this.showStatusMenu.set(false);
    this.showNotifications.set(false);
  }

  toggleStatusMenu(): void {
    this.showStatusMenu.update(v => !v);
    this.showUserMenu.set(false);
    this.showNotifications.set(false);
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
    this.showUserMenu.set(false);
    this.showStatusMenu.set(false);
  }

  setStatus(status: string): void {
    this.authService.updateUserStatus(status as UserStatus);
    this.showStatusMenu.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }
}
