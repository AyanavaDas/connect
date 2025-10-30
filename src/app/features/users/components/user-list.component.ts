import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ConnectionService } from '../../../core/services/connection.service';
import { WebRTCService } from '../../../core/services/webrtc.service';
import { User, UserStatus } from '../../../shared/models/user.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
        <h2 class="text-xl font-bold text-white">Discover Users</h2>
        <p class="text-blue-100 text-sm mt-1">Connect with others for video chat</p>
      </div>

      <!-- Search and Filter -->
      <div class="p-4 border-b border-gray-200 space-y-3">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (input)="onSearch()"
          placeholder="Search users..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div class="flex space-x-2">
          <button
            (click)="filterStatus = null; applyFilter()"
            [class]="'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ' +
              (!filterStatus ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')"
          >
            All
          </button>
          <button
            (click)="filterStatus = 'online'; applyFilter()"
            [class]="'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ' +
              (filterStatus === 'online' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')"
          >
            Online
          </button>
          <button
            (click)="filterStatus = 'away'; applyFilter()"
            [class]="'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ' +
              (filterStatus === 'away' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')"
          >
            Away
          </button>
          <button
            (click)="filterStatus = 'busy'; applyFilter()"
            [class]="'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ' +
              (filterStatus === 'busy' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')"
          >
            Busy
          </button>
        </div>
      </div>

      <!-- User List -->
      <div class="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        @if (isLoading()) {
          <div class="p-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="text-gray-500 mt-2">Loading users...</p>
          </div>
        } @else if (filteredUsers().length === 0) {
          <div class="p-8 text-center text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p class="mt-2">No users found</p>
          </div>
        } @else {
          @for (user of filteredUsers(); track user.id) {
            <div class="p-4 hover:bg-gray-50 transition-colors">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3 flex-1">
                  <div class="relative">
                    <img
                      [src]="user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username"
                      [alt]="user.username"
                      class="h-12 w-12 rounded-full border-2 border-gray-200"
                    />
                    <div [class]="'absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ' + getStatusColor(user.status)"></div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ user.username }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
                    <div class="flex items-center space-x-1 mt-1">
                      <div [class]="'w-2 h-2 rounded-full ' + getStatusColor(user.status)"></div>
                      <span class="text-xs text-gray-600 capitalize">{{ user.status }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex space-x-2">
                  @if (isConnected(user.id)) {
                    <button
                      (click)="startVideoCall(user)"
                      [disabled]="user.status !== 'online'"
                      class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Call</span>
                    </button>
                  } @else if (hasPendingRequest(user.id)) {
                    <button
                      disabled
                      class="px-4 py-2 bg-gray-300 text-gray-600 text-sm font-medium rounded-lg cursor-not-allowed"
                    >
                      Pending
                    </button>
                  } @else {
                    <button
                      (click)="sendConnectionRequest(user)"
                      [disabled]="processingUserId() === user.id"
                      class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                    >
                      @if (processingUserId() === user.id) {
                        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      } @else {
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      }
                      <span>Connect</span>
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: []
})
export class UserListComponent {
  private readonly userService = inject(UserService);
  private readonly connectionService = inject(ConnectionService);
  private readonly webrtcService = inject(WebRTCService);
  private readonly router = inject(Router);

  protected readonly users = this.userService.users;
  protected readonly isLoading = this.userService.isLoading;

  protected searchQuery = '';
  protected filterStatus: string | null = null;
  protected readonly processingUserId = signal<string | null>(null);

  protected readonly filteredUsers = computed(() => {
    let users = this.userService.getOtherUsers();

    // Apply search filter
    if (this.searchQuery.trim()) {
      users = this.userService.searchUsers(this.searchQuery);
    }

    // Apply status filter
    if (this.filterStatus) {
      users = users.filter(u => u.status === this.filterStatus);
    }

    return users;
  });

  onSearch(): void {
    // Trigger re-computation
  }

  applyFilter(): void {
    // Trigger re-computation
  }

  isConnected(userId: string): boolean {
    return this.connectionService.isConnectedWith(userId);
  }

  hasPendingRequest(userId: string): boolean {
    return this.connectionService.hasPendingRequestWith(userId);
  }

  async sendConnectionRequest(user: User): Promise<void> {
    this.processingUserId.set(user.id);
    const result = await this.connectionService.sendConnectionRequest(user, 'Hi! Let\'s connect!');
    this.processingUserId.set(null);

    if (result.success) {
      // Show success feedback
      console.log('Connection request sent successfully');
    } else {
      alert(result.error);
    }
  }

  async startVideoCall(user: User): Promise<void> {
    // Navigate to video chat with this user
    this.router.navigate(['/video-chat', user.id]);
  }

  getStatusColor(status: UserStatus): string {
    switch (status) {
      case UserStatus.ONLINE: return 'bg-green-500';
      case UserStatus.AWAY: return 'bg-yellow-500';
      case UserStatus.BUSY: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }
}
