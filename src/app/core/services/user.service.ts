import { Injectable, signal, computed } from '@angular/core';
import { User, UserStatus } from '../../shared/models/user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly usersSignal = signal<User[]>([]);
  private readonly isLoadingSignal = signal<boolean>(false);

  readonly users = this.usersSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  // Computed signal for online users only
  readonly onlineUsers = computed(() =>
    this.usersSignal().filter(user => user.status === UserStatus.ONLINE)
  );

  constructor(private authService: AuthService) {
    // Initialize with mock users
    this.loadMockUsers();
  }

  private loadMockUsers(): void {
    // Mock users - in production, fetch from backend
    const mockUsers: User[] = [
      {
        id: 'user_001',
        username: 'alice_wonder',
        email: 'alice@example.com',
        status: UserStatus.ONLINE,
        createdAt: new Date('2024-01-15'),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'
      },
      {
        id: 'user_002',
        username: 'bob_builder',
        email: 'bob@example.com',
        status: UserStatus.ONLINE,
        createdAt: new Date('2024-02-20'),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'
      },
      {
        id: 'user_003',
        username: 'charlie_brown',
        email: 'charlie@example.com',
        status: UserStatus.AWAY,
        createdAt: new Date('2024-03-10'),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie'
      },
      {
        id: 'user_004',
        username: 'diana_prince',
        email: 'diana@example.com',
        status: UserStatus.ONLINE,
        createdAt: new Date('2024-03-25'),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana'
      },
      {
        id: 'user_005',
        username: 'eve_online',
        email: 'eve@example.com',
        status: UserStatus.BUSY,
        createdAt: new Date('2024-04-01'),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve'
      },
      {
        id: 'user_006',
        username: 'frank_ocean',
        email: 'frank@example.com',
        status: UserStatus.ONLINE,
        createdAt: new Date('2024-04-15'),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank'
      }
    ];

    this.usersSignal.set(mockUsers);
  }

  async fetchUsers(): Promise<void> {
    this.isLoadingSignal.set(true);
    try {
      // Simulate API call
      await this.delay(500);
      // In production, fetch from backend
      // const users = await this.http.get<User[]>('/api/users').toPromise();
      // this.usersSignal.set(users);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  getUserById(userId: string): User | undefined {
    return this.usersSignal().find(user => user.id === userId);
  }

  searchUsers(query: string): User[] {
    if (!query.trim()) {
      return this.usersSignal();
    }

    const lowercaseQuery = query.toLowerCase();
    return this.usersSignal().filter(user =>
      user.username.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery)
    );
  }

  filterByStatus(status: UserStatus): User[] {
    return this.usersSignal().filter(user => user.status === status);
  }

  // Filter out current user from the list
  getOtherUsers(): User[] {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return this.usersSignal();

    return this.usersSignal().filter(user => user.id !== currentUser.id);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
