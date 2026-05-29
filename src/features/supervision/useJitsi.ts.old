import { useCallback, useEffect, useRef, useState } from "react";
import env from "@/config/env";
import { JITSI } from "@/config/constants";
import type { JitsiConfig } from "./types";

type JitsiApi = {
  dispose: () => void;
  addEventListener: (event: string, callback: (data: unknown) => void) => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
};

export default function useJitsi({
  roomName,
  displayName,
  jwt,
  containerRef,
  callbacks,
}: JitsiConfig) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const apiRef = useRef<JitsiApi | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!containerRef.current) return;

    const loadJitsi = () => {
      const options: Record<string, unknown> = {
        roomName: `${JITSI.DEFAULT_ROOM_PREFIX}-${roomName}`,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: { displayName: displayName ?? "Participante" },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [...JITSI.TOOLBAR_BUTTONS],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
      };

      if (jwt) {
        options.jwt = jwt;
      }

      try {
        // @ts-expect-error — JitsiMeetExternalAPI se carga vía script global
        const api = new window.JitsiMeetExternalAPI(
          env.JITSI_DOMAIN,
          options,
        ) as JitsiApi;
        apiRef.current = api;
        setIsLoading(false);

        // --- Eventos de Jitsi ---

        api.addEventListener("participantJoined", (data) => {
          const e = data as { id: string; displayName?: string };
          callbacksRef.current?.onParticipantJoined?.({
            id: e.id,
            displayName: e.displayName,
          });
        });

        api.addEventListener("participantLeft", (data) => {
          const e = data as { id: string; displayName?: string };
          callbacksRef.current?.onParticipantLeft?.({
            id: e.id,
            displayName: e.displayName,
          });
        });

        api.addEventListener("videoMuteStatusChanged", (data) => {
          const e = data as { id: string; muted: boolean };
          callbacksRef.current?.onCameraToggled?.(e.id, e.muted);
        });

        api.addEventListener("audioMuteStatusChanged", (data) => {
          const e = data as { id: string; muted: boolean };
          callbacksRef.current?.onMicToggled?.(e.id, e.muted);
        });

        api.addEventListener("screenSharingStatusChanged", (data) => {
          const e = data as { id: string; on: boolean };
          callbacksRef.current?.onScreenSharing?.(e.id, e.on);
        });

        api.addEventListener("readyToClose", () => {
          callbacksRef.current?.onCallEnded?.();
        });

        api.addEventListener("trackAdded", (data) => {
          const track = data as {
            getType: () => string;
            getParticipantId: () => string;
            track: MediaStreamTrack;
          };
          if (track.getType() === "video") {
            const participantId = track.getParticipantId();
            const stream = new MediaStream([track.track]);
            callbacksRef.current?.onTrackAdded?.(participantId, stream);
          }
        });
      } catch {
        setHasError(true);
        setIsLoading(false);
      }
    };

    if (window.JitsiMeetExternalAPI) {
      loadJitsi();
    } else {
      const script = document.createElement("script");
      script.src = `https://${env.JITSI_DOMAIN}/external_api.js`;
      script.async = true;
      script.onload = loadJitsi;
      script.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
      document.head.appendChild(script);
    }

    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [roomName, displayName, jwt, containerRef]);

  // --- Comandos sobre Jitsi ---

  const kickParticipant = useCallback((participantId: string) => {
    apiRef.current?.executeCommand("kickParticipant", participantId);
  }, []);

  const muteEveryone = useCallback(() => {
    apiRef.current?.executeCommand("muteEveryone");
  }, []);

  const hangup = useCallback(() => {
    apiRef.current?.executeCommand("hangup");
  }, []);

  const toggleLobby = useCallback((enabled: boolean) => {
    apiRef.current?.executeCommand("toggleLobby", enabled);
  }, []);

  return {
    isLoading,
    hasError,
    kickParticipant,
    muteEveryone,
    hangup,
    toggleLobby,
  };
}
