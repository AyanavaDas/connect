import { Injectable, signal, computed } from '@angular/core';
import { ConnectionRequest, ConnectionStatus, Connection } from '../../shared/models/connection.model';
import { User } from '../../shared/models/user.model';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { NotificationType } from '../../shared/models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private readonly connectionRequestsSignal = signal<ConnectionRequest[]>([]);
  private readonly connectionsSignal = signal<Connection[]>([]);
  private readonly isLoadingSignal = signal<boolean>(false);

  readonly connectionRequests = this.connectionRequestsSignal.asReadonly();
  readonly connections = this.connectionsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  // Computed signals for filtered data
  readonly pendingRequests = computed(() =>
    this.connectionRequestsSignal().filter(req => req.status === ConnectionStatus.PENDING)
  );

  readonly incomingRequests = computed(() => {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return [];

    return this.connectionRequestsSignal().filter(
      req => req.to.id === currentUser.id && req.status === ConnectionStatus.PENDING
    );
  });

  readonly outgoingRequests = computed(() => {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return [];

    return this.connectionRequestsSignal().filter(
      req => req.from.id === currentUser.id && req.status === ConnectionStatus.PENDING
    );
  });

  readonly activeConnections = computed(() => this.connectionsSignal());

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  async sendConnectionRequest(
    toUser: User,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    this.isLoadingSignal.set(true);

    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        return { success: false, error: 'You must be logged in' };
      }

      // Check if request already exists
      const existingRequest = this.connectionRequestsSignal().find(
        req => req.from.id === currentUser.id && req.to.id === toUser.id &&
        req.status === ConnectionStatus.PENDING
      );

      if (existingRequest) {
        return { success: false, error: 'Connection request already sent' };
      }

      // Check if already connected
      const existingConnection = this.connectionsSignal().find(
        conn => conn.users.some(u => u.id === currentUser.id) &&
                conn.users.some(u => u.id === toUser.id)
      );

      if (existingConnection) {
        return { success: false, error: 'Already connected with this user' };
      }

      // Simulate API call
      await this.delay(500);

      const request: ConnectionRequest = {
        id: this.generateId(),
        from: currentUser,
        to: toUser,
        status: ConnectionStatus.PENDING,
        message,
        createdAt: new Date()
      };

      this.connectionRequestsSignal.update(requests => [...requests, request]);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to send connection request' };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async acceptConnectionRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    this.isLoadingSignal.set(true);

    try {
      const request = this.connectionRequestsSignal().find(req => req.id === requestId);
      if (!request) {
        return { success: false, error: 'Request not found' };
      }

      // Simulate API call
      await this.delay(500);

      // Update request status
      this.connectionRequestsSignal.update(requests =>
        requests.map(req =>
          req.id === requestId
            ? { ...req, status: ConnectionStatus.ACCEPTED, updatedAt: new Date() }
            : req
        )
      );

      // Create connection
      const connection: Connection = {
        id: this.generateId(),
        users: [request.from, request.to],
        initiatedBy: request.from.id,
        connectedAt: new Date()
      };

      this.connectionsSignal.update(connections => [...connections, connection]);

      // Send notification to the requester
      this.notificationService.addNotification({
        id: this.generateId(),
        type: NotificationType.CONNECTION_ACCEPTED,
        title: 'Connection Accepted',
        message: `${request.to.username} accepted your connection request`,
        read: false,
        createdAt: new Date(),
        data: { connectionId: connection.id }
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to accept connection request' };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async rejectConnectionRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    this.isLoadingSignal.set(true);

    try {
      const request = this.connectionRequestsSignal().find(req => req.id === requestId);
      if (!request) {
        return { success: false, error: 'Request not found' };
      }

      // Simulate API call
      await this.delay(500);

      // Update request status
      this.connectionRequestsSignal.update(requests =>
        requests.map(req =>
          req.id === requestId
            ? { ...req, status: ConnectionStatus.REJECTED, updatedAt: new Date() }
            : req
        )
      );

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to reject connection request' };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async cancelConnectionRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    this.isLoadingSignal.set(true);

    try {
      // Simulate API call
      await this.delay(500);

      this.connectionRequestsSignal.update(requests =>
        requests.map(req =>
          req.id === requestId
            ? { ...req, status: ConnectionStatus.CANCELLED, updatedAt: new Date() }
            : req
        )
      );

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to cancel connection request' };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  isConnectedWith(userId: string): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;

    return this.connectionsSignal().some(
      conn => conn.users.some(u => u.id === currentUser.id) &&
              conn.users.some(u => u.id === userId)
    );
  }

  hasPendingRequestWith(userId: string): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;

    return this.connectionRequestsSignal().some(
      req => ((req.from.id === currentUser.id && req.to.id === userId) ||
              (req.from.id === userId && req.to.id === currentUser.id)) &&
             req.status === ConnectionStatus.PENDING
    );
  }

  getConnectionWithUser(userId: string): Connection | undefined {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return undefined;

    return this.connectionsSignal().find(
      conn => conn.users.some(u => u.id === currentUser.id) &&
              conn.users.some(u => u.id === userId)
    );
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
