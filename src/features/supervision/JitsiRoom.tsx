import { forwardRef, useImperativeHandle, useRef } from "react";
import Spinner from "@/shared/components/ui/Spinner";
import useJitsiIframe from "./useJitsiIframe";
import type { JitsiCallbacksIframe } from "./useJitsiIframe";
import type { JitsiRoomHandle } from "./types";

type JitsiRoomProps = {
  roomName: string;
  displayName: string;
  email?: string;
  isModerator: boolean;
  onParticipantJoined?: (id: string, displayName: string) => void;
  onParticipantLeft?: (id: string) => void;
  onVideoMuteChanged?: (muted: boolean) => void;
  onScreenShareChanged?: (on: boolean) => void;
  onReadyToClose?: () => void;
  onConferenceJoined?: () => void;
  className?: string;
};

const JitsiRoom = forwardRef<JitsiRoomHandle, JitsiRoomProps>(function JitsiRoom(
  {
    roomName,
    displayName,
    email,
    isModerator,
    onParticipantJoined,
    onParticipantLeft,
    onVideoMuteChanged,
    onScreenShareChanged,
    onReadyToClose,
    onConferenceJoined,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const callbacks: JitsiCallbacksIframe = {
    onParticipantJoined,
    onParticipantLeft,
    onVideoMuteChanged,
    onScreenShareChanged,
    onReadyToClose,
    onConferenceJoined,
  };

  const { isLoaded, isError, hangup, kickParticipant, getParticipantCount, captureScreenshot } =
    useJitsiIframe({ containerRef, roomName, displayName, email, isModerator, callbacks });

  useImperativeHandle(ref, () => ({
    hangup,
    kickParticipant,
    getParticipantCount,
    captureScreenshot,
  }));

  if (isError) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-danger)",
          fontSize: "var(--font-size-lg)",
        }}
      >
        Error al cargar la videollamada. Verifica tu conexión a Jitsi.
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {!isLoaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--color-surface)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <Spinner size="lg" />
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
});

export default JitsiRoom;
