export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: UserStatus;
  createdAt: Date;
}

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  AWAY = 'away'
}

export interface AuthUser extends User {
  token?: string;
}
