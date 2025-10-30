import { Component, OnInit, OnDestroy, signal, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebRTCService } from '../../../core/services/webrtc.service';
import { UserService } from '../../../core/services/user.service';
import { ConnectionService } from '../../../core/services/connection.service';
import { CallStatus } from '../../../shared/models/connection.model';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-video-chat',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-gray-900 flex flex-col">
      <!-- Top Bar -->
      <div class="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          @if (remoteUser()) {
            <img
              [src]="remoteUser()!.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + remoteUser()!.username"
              [alt]="remoteUser()!.username"
              class="h-10 w-10 rounded-full border-2 border-green-500"
            />
            <div>
              <p class="text-white font-medium">{{ remoteUser()!.username }}</p>
              <p class="text-gray-400 text-sm">{{ getCallStatusText() }}</p>
            </div>
          }
        </div>

        <div class="flex items-center space-x-2">
          @if (callState().status === 'active') {
            <div class="flex items-center space-x-2 text-white text-sm">
              <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>{{ callDuration() }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Video Container -->
      <div class="flex-1 relative">
        <!-- Remote Video (Main) -->
        <div class="w-full h-full bg-gray-800 flex items-center justify-center">
          @if (callState().remoteStream) {
            <video
              #remoteVideo
              [srcObject]="callState().remoteStream"
              autoplay
              playsinline
              class="w-full h-full object-cover"
            ></video>
          } @else {
            <div class="text-center">
              <div class="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                @if (remoteUser()?.avatar) {
                  <img
                    [src]="remoteUser()!.avatar"
                    [alt]="remoteUser()!.username"
                    class="w-full h-full rounded-full object-cover"
                  />
                } @else {
                  <svg class="h-16 w-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              </div>
              <p class="text-white text-lg">{{ getWaitingMessage() }}</p>
              <div class="mt-4">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            </div>
          }
        </div>

        <!-- Local Video (Picture-in-Picture) -->
        @if (callState().localStream) {
          <div class="absolute top-4 right-4 w-64 h-48 bg-gray-900 rounded-lg shadow-2xl overflow-hidden border-2 border-gray-600">
            <video
              #localVideo
              [srcObject]="callState().localStream"
              autoplay
              playsinline
              muted
              class="w-full h-full object-cover"
              [class.hidden]="!callState().isVideoEnabled"
            ></video>
            @if (!callState().isVideoEnabled) {
              <div class="w-full h-full flex items-center justify-center bg-gray-800">
                <svg class="h-16 w-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            }
            <div class="absolute bottom-2 left-2">
              <span class="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">You</span>
            </div>
          </div>
        }
      </div>

      <!-- Control Bar -->
      <div class="bg-gray-800 px-6 py-6">
        <div class="flex items-center justify-center space-x-4">
          <!-- Mute/Unmute Audio -->
          <button
            (click)="toggleAudio()"
            [class]="'w-14 h-14 rounded-full flex items-center justify-center transition-all ' +
              (callState().isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white')"
            title="Toggle Microphone"
          >
            @if (callState().isAudioEnabled) {
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            } @else {
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            }
          </button>

          <!-- Toggle Video -->
          <button
            (click)="toggleVideo()"
            [class]="'w-14 h-14 rounded-full flex items-center justify-center transition-all ' +
              (callState().isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white')"
            title="Toggle Camera"
          >
            @if (callState().isVideoEnabled) {
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            } @else {
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
          </button>

          <!-- End Call -->
          <button
            (click)="endCall()"
            class="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-lg"
            title="End Call"
          >
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class VideoChatComponent implements OnInit, OnDestroy {
  private readonly webrtcService = inject(WebRTCService);
  private readonly userService = inject(UserService);
  private readonly connectionService = inject(ConnectionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('localVideo') localVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo?: ElementRef<HTMLVideoElement>;

  protected readonly callState = this.webrtcService.callState;
  protected readonly remoteUser = signal<User | null>(null);
  protected readonly callDuration = signal<string>('00:00');

  private callStartTime?: number;
  private durationInterval?: number;
  private userId?: string;

  constructor() {
    // Set up video stream effect
    effect(() => {
      const state = this.callState();
      if (state.localStream && this.localVideo) {
        this.localVideo.nativeElement.srcObject = state.localStream;
      }
      if (state.remoteStream && this.remoteVideo) {
        this.remoteVideo.nativeElement.srcObject = state.remoteStream;
      }
      if (state.status === CallStatus.ACTIVE && !this.callStartTime) {
        this.startCallTimer();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    // Get user ID from route
    this.userId = this.route.snapshot.paramMap.get('userId') || undefined;

    if (!this.userId) {
      alert('Invalid user ID');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Load remote user info
    const user = this.userService.getUserById(this.userId);
    if (!user) {
      alert('User not found');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.remoteUser.set(user);

    // Check if connected
    if (!this.connectionService.isConnectedWith(this.userId)) {
      alert('You must be connected with this user to start a call');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Initiate call
    await this.initiateCall();
  }

  ngOnDestroy(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }
    this.webrtcService.endCall();
  }

  private async initiateCall(): Promise<void> {
    const user = this.remoteUser();
    if (!user) return;

    const result = await this.webrtcService.initiateCall(user);

    if (!result.success) {
      alert(result.error || 'Failed to initiate call');
      this.router.navigate(['/dashboard']);
      return;
    }

    // In a real app, you would send the signal to the remote user via WebSocket/SignalR
    // For this demo, we'll simulate the connection
    console.log('Call signal:', result.signal);

    // Simulate receiving answer after 2 seconds
    setTimeout(() => {
      this.simulateCallAnswer();
    }, 2000);
  }

  private simulateCallAnswer(): void {
    // In a real app, this would come from the remote user
    // For demo purposes, we'll just mark the call as active
    console.log('Simulating call answer...');
  }

  private startCallTimer(): void {
    this.callStartTime = Date.now();
    this.durationInterval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.callStartTime!) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      this.callDuration.set(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);
  }

  toggleAudio(): void {
    this.webrtcService.toggleAudio();
  }

  toggleVideo(): void {
    this.webrtcService.toggleVideo();
  }

  endCall(): void {
    this.webrtcService.endCall();
    this.router.navigate(['/dashboard']);
  }

  getCallStatusText(): string {
    switch (this.callState().status) {
      case CallStatus.INITIATED:
        return 'Calling...';
      case CallStatus.RINGING:
        return 'Ringing...';
      case CallStatus.ACTIVE:
        return 'Connected';
      default:
        return 'Connecting...';
    }
  }

  getWaitingMessage(): string {
    const status = this.callState().status;
    if (status === CallStatus.INITIATED) {
      return 'Initiating call...';
    }
    if (status === CallStatus.RINGING) {
      return 'Waiting for answer...';
    }
    return 'Connecting...';
  }
}
