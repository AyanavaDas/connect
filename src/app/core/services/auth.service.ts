import { Injectable, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser, User, UserStatus } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = Router;

  // Signals for auth state
  private readonly currentUserSignal = signal<AuthUser | null>(null);
  private readonly isAuthenticatedSignal = signal<boolean>(false);
  private readonly isLoadingSignal = signal<boolean>(false);

  // Public computed signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  constructor() {
    // Load user from localStorage on init
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as AuthUser;
        this.currentUserSignal.set(user);
        this.isAuthenticatedSignal.set(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this.isLoadingSignal.set(true);

    try {
      // Simulate API call - replace with actual backend call
      await this.delay(1000);

      // Mock validation
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      // Mock user data - in production, this comes from backend
      const user: AuthUser = {
        id: this.generateId(),
        username: email.split('@')[0],
        email,
        status: UserStatus.ONLINE,
        createdAt: new Date(),
        token: this.generateToken(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };

      this.currentUserSignal.set(user);
      this.isAuthenticatedSignal.set(true);
      localStorage.setItem('currentUser', JSON.stringify(user));

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async register(username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this.isLoadingSignal.set(true);

    try {
      // Simulate API call
      await this.delay(1000);

      // Mock validation
      if (!username || !email || !password) {
        return { success: false, error: 'All fields are required' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Mock user creation
      const user: AuthUser = {
        id: this.generateId(),
        username,
        email,
        status: UserStatus.ONLINE,
        createdAt: new Date(),
        token: this.generateToken(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };

      this.currentUserSignal.set(user);
      this.isAuthenticatedSignal.set(true);
      localStorage.setItem('currentUser', JSON.stringify(user));

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    localStorage.removeItem('currentUser');
  }

  updateUserStatus(status: UserStatus): void {
    const user = this.currentUserSignal();
    if (user) {
      const updatedUser = { ...user, status };
      this.currentUserSignal.set(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  }

  // Utility methods
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
