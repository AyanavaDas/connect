import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionService } from '../../../core/services/connection.service';
import { ConnectionRequest } from '../../../shared/models/connection.model';

@Component({
  selector: 'app-connection-requests',
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
        <h2 class="text-xl font-bold text-white">Connection Requests</h2>
        <p class="text-purple-100 text-sm mt-1">Manage your pending connections</p>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <div class="flex">
          <button
            (click)="activeTab = 'incoming'"
            [class]="'flex-1 px-4 py-3 text-sm font-medium transition-colors ' +
              (activeTab === 'incoming' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')"
          >
            Incoming
            @if (incomingRequests().length > 0) {
              <span class="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {{ incomingRequests().length }}
              </span>
            }
          </button>
          <button
            (click)="activeTab = 'outgoing'"
            [class]="'flex-1 px-4 py-3 text-sm font-medium transition-colors ' +
              (activeTab === 'outgoing' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')"
          >
            Outgoing
            @if (outgoingRequests().length > 0) {
              <span class="ml-2 px-2 py-0.5 bg-gray-600 text-white text-xs rounded-full">
                {{ outgoingRequests().length }}
              </span>
            }
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="max-h-96 overflow-y-auto">
        @if (activeTab === 'incoming') {
          <div class="divide-y divide-gray-200">
            @if (incomingRequests().length === 0) {
              <div class="p-8 text-center text-gray-500">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p class="mt-2">No incoming requests</p>
              </div>
            } @else {
              @for (request of incomingRequests(); track request.id) {
                <div class="p-4 hover:bg-gray-50 transition-colors">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 flex-1">
                      <img
                        [src]="request.from.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + request.from.username"
                        [alt]="request.from.username"
                        class="h-12 w-12 rounded-full border-2 border-blue-200"
                      />
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ request.from.username }}</p>
                        <p class="text-xs text-gray-500">{{ request.from.email }}</p>
                        @if (request.message) {
                          <p class="text-xs text-gray-600 mt-1 italic">"{{ request.message }}"</p>
                        }
                        <p class="text-xs text-gray-400 mt-1">
                          {{ formatDate(request.createdAt) }}
                        </p>
                      </div>
                    </div>
                    <div class="flex space-x-2">
                      <button
                        (click)="acceptRequest(request)"
                        class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        (click)="rejectRequest(request)"
                        class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              }
            }
          </div>
        } @else {
          <div class="divide-y divide-gray-200">
            @if (outgoingRequests().length === 0) {
              <div class="p-8 text-center text-gray-500">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p class="mt-2">No outgoing requests</p>
              </div>
            } @else {
              @for (request of outgoingRequests(); track request.id) {
                <div class="p-4 hover:bg-gray-50 transition-colors">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 flex-1">
                      <img
                        [src]="request.to.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + request.to.username"
                        [alt]="request.to.username"
                        class="h-12 w-12 rounded-full border-2 border-gray-200"
                      />
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ request.to.username }}</p>
                        <p class="text-xs text-gray-500">{{ request.to.email }}</p>
                        <div class="flex items-center space-x-2 mt-1">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            <svg class="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                            </svg>
                            Pending
                          </span>
                          <span class="text-xs text-gray-400">
                            {{ formatDate(request.createdAt) }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      (click)="cancelRequest(request)"
                      class="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              }
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class ConnectionRequestsComponent {
  private readonly connectionService = inject(ConnectionService);

  protected readonly incomingRequests = this.connectionService.incomingRequests;
  protected readonly outgoingRequests = this.connectionService.outgoingRequests;

  protected activeTab: 'incoming' | 'outgoing' = 'incoming';

  async acceptRequest(request: ConnectionRequest): Promise<void> {
    const result = await this.connectionService.acceptConnectionRequest(request.id);
    if (!result.success) {
      alert(result.error);
    }
  }

  async rejectRequest(request: ConnectionRequest): Promise<void> {
    const result = await this.connectionService.rejectConnectionRequest(request.id);
    if (!result.success) {
      alert(result.error);
    }
  }

  async cancelRequest(request: ConnectionRequest): Promise<void> {
    const result = await this.connectionService.cancelConnectionRequest(request.id);
    if (!result.success) {
      alert(result.error);
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
