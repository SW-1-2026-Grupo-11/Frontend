interface JitsiOptions {
  roomName: string;
  parentNode: HTMLElement | null;
  width?: string | number;
  height?: string | number;
  userInfo?: {
    displayName?: string;
    email?: string;
  };
  jwt?: string;
  configOverwrite?: {
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    disableDeepLinking?: boolean;
    prejoinPageEnabled?: boolean;
    enableNoisyMicDetection?: boolean;
    startAsSilentAuditor?: boolean;
    [key: string]: unknown;
  };
  interfaceConfigOverwrite?: {
    TOOLBAR_BUTTONS?: string[];
    SHOW_JITSI_WATERMARK?: boolean;
    SHOW_WATERMARK_FOR_GUESTS?: boolean;
    DISABLE_JOIN_LEAVE_NOTIFICATIONS?: boolean;
    MOBILE_APP_PROMO?: boolean;
    [key: string]: unknown;
  };
}

interface JitsiAPI {
  dispose: () => void;
  addListener: (event: string, callback: (data: unknown) => void) => void;
  removeListener: (event: string, callback: (data: unknown) => void) => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  getNumberOfParticipants: () => number;
  getRoomsInfo: () => Promise<unknown>;
  captureLargeVideoScreenshot: () => Promise<{ dataURL: string }>;
}

interface Window {
  JitsiMeetExternalAPI: new (domain: string, options: JitsiOptions) => JitsiAPI;
}
