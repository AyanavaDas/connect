import { Injectable, signal } from '@angular/core';
import SimplePeer from 'simple-peer';
import { User } from '../../shared/models/user.model';
import { CallStatus } from '../../shared/models/connection.model';

export interface CallState {
  status: CallStatus;
  peer: SimplePeer.Instance | null;
  remoteUser: User | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebRTCService {
  private readonly callStateSignal = signal<CallState>({
    status: CallStatus.ENDED,
    peer: null,
    remoteUser: null,
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true
  });

  readonly callState = this.callStateSignal.asReadonly();

  private readonly ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  async initiateCall(remoteUser: User): Promise<{ success: boolean; signal?: any; error?: string }> {
    try {
      // Get local media stream
      const stream = await this.getUserMedia();

      this.callStateSignal.update(state => ({
        ...state,
        status: CallStatus.INITIATED,
        localStream: stream,
        remoteUser
      }));

      // Create peer connection as initiator
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream,
        config: this.ICE_SERVERS
      });

      // Store peer instance
      this.callStateSignal.update(state => ({ ...state, peer }));

      // Return promise that resolves with signal data
      return new Promise((resolve, reject) => {
        peer.on('signal', (signalData: SimplePeer.SignalData) => {
          resolve({ success: true, signal: signalData });
        });

        peer.on('error', (err: Error) => {
          console.error('Peer error:', err);
          reject({ success: false, error: err.message });
        });

        // Setup other event handlers
        this.setupPeerHandlers(peer);
      });
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to initiate call' };
    }
  }

  async answerCall(
    remoteUser: User,
    incomingSignal: any
  ): Promise<{ success: boolean; signal?: any; error?: string }> {
    try {
      // Get local media stream
      const stream = await this.getUserMedia();

      this.callStateSignal.update(state => ({
        ...state,
        status: CallStatus.ACTIVE,
        localStream: stream,
        remoteUser
      }));

      // Create peer connection as receiver
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream,
        config: this.ICE_SERVERS
      });

      // Store peer instance
      this.callStateSignal.update(state => ({ ...state, peer }));

      // Return promise that resolves with signal data
      return new Promise((resolve, reject) => {
        peer.on('signal', (signalData: SimplePeer.SignalData) => {
          resolve({ success: true, signal: signalData });
        });

        peer.on('error', (err: Error) => {
          console.error('Peer error:', err);
          reject({ success: false, error: err.message });
        });

        // Setup other event handlers
        this.setupPeerHandlers(peer);

        // Signal to the peer
        peer.signal(incomingSignal);
      });
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to answer call' };
    }
  }

  completeConnection(answerSignal: any): void {
    const peer = this.callStateSignal().peer;
    if (peer) {
      peer.signal(answerSignal);
      this.callStateSignal.update(state => ({
        ...state,
        status: CallStatus.ACTIVE
      }));
    }
  }

  private setupPeerHandlers(peer: SimplePeer.Instance): void {
    peer.on('stream', (remoteStream: MediaStream) => {
      console.log('Received remote stream');
      this.callStateSignal.update(state => ({
        ...state,
        remoteStream,
        status: CallStatus.ACTIVE
      }));
    });

    peer.on('close', () => {
      console.log('Connection closed');
      this.endCall();
    });

    peer.on('error', (err: Error) => {
      console.error('Peer connection error:', err);
      this.endCall();
    });
  }

  toggleVideo(): void {
    const state = this.callStateSignal();
    if (state.localStream) {
      const videoTrack = state.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !state.isVideoEnabled;
        this.callStateSignal.update(s => ({
          ...s,
          isVideoEnabled: !s.isVideoEnabled
        }));
      }
    }
  }

  toggleAudio(): void {
    const state = this.callStateSignal();
    if (state.localStream) {
      const audioTrack = state.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !state.isAudioEnabled;
        this.callStateSignal.update(s => ({
          ...s,
          isAudioEnabled: !s.isAudioEnabled
        }));
      }
    }
  }

  endCall(): void {
    const state = this.callStateSignal();

    // Stop all media tracks
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (state.peer) {
      state.peer.destroy();
    }

    // Reset state
    this.callStateSignal.set({
      status: CallStatus.ENDED,
      peer: null,
      remoteUser: null,
      localStream: null,
      remoteStream: null,
      isVideoEnabled: true,
      isAudioEnabled: true
    });
  }

  private async getUserMedia(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Failed to access camera/microphone. Please check permissions.');
    }
  }

  async checkMediaPermissions(): Promise<boolean> {
    try {
      const stream = await this.getUserMedia();
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }
}
