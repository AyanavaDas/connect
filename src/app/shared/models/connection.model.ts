import { User } from './user.model';

export interface ConnectionRequest {
  id: string;
  from: User;
  to: User;
  status: ConnectionStatus;
  message?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface Connection {
  id: string;
  users: [User, User];
  initiatedBy: string;
  connectedAt: Date;
  lastActive?: Date;
}

export interface VideoCallSession {
  id: string;
  connectionId: string;
  participants: User[];
  startedAt: Date;
  endedAt?: Date;
  status: CallStatus;
}

export enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  ACTIVE = 'active',
  ENDED = 'ended',
  MISSED = 'missed',
  REJECTED = 'rejected'
}
