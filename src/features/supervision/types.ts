export type SupervisionEventType =
  | "tab_switch"
  | "camera_off"
  | "camera_on"
  | "mic_off"
  | "mic_on"
  | "participant_joined"
  | "participant_left"
  | "screen_sharing"
  | "call_ended";

export type SupervisionEvent = {
  id: string;
  sessionId: string;
  type: SupervisionEventType;
  participantId?: string;
  participantName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type JitsiParticipant = {
  id: string;
  displayName?: string;
};

export type JitsiCallbacks = {
  onParticipantJoined?: (participant: JitsiParticipant) => void;
  onParticipantLeft?: (participant: JitsiParticipant) => void;
  onCameraToggled?: (participantId: string, muted: boolean) => void;
  onMicToggled?: (participantId: string, muted: boolean) => void;
  onScreenSharing?: (participantId: string, active: boolean) => void;
  onCallEnded?: () => void;
  onTrackAdded?: (participantId: string, stream: MediaStream) => void;
};

export type JitsiConfig = {
  roomName: string;
  displayName?: string;
  jwt?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  callbacks?: JitsiCallbacks;
};

export type JitsiRoomHandle = {
  hangup: () => void;
  kickParticipant: (id: string) => void;
  getParticipantCount: () => number;
  captureScreenshot: () => Promise<{ dataURL: string }>;
};
