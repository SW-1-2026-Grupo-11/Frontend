import { useCallback, useEffect, useRef, useState } from "react";
import env from "@/config/env";

export type JitsiCallbacksIframe = {
  onParticipantJoined?: (id: string, displayName: string) => void;
  onParticipantLeft?: (id: string) => void;
  onVideoMuteChanged?: (muted: boolean) => void;
  onAudioMuteChanged?: (muted: boolean) => void;
  onScreenShareChanged?: (on: boolean) => void;
  onReadyToClose?: () => void;
  onConferenceJoined?: () => void;
};

type UseJitsiIframeParams = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  roomName: string;
  displayName: string;
  email?: string;
  isModerator: boolean;
  callbacks?: JitsiCallbacksIframe;
};

export default function useJitsiIframe({
  containerRef,
  roomName,
  displayName,
  email,
  isModerator,
  callbacks,
}: UseJitsiIframeParams) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const apiRef = useRef<JitsiAPI | null>(null);
  // Ref para callbacks: evita stale closures sin necesidad de declarar callbacks en deps
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    const initJitsi = () => {
      // Evitar inicializar si el componente se desmontó mientras cargaba el script
      if (cancelled || !containerRef.current) return;

      try {
        const configOverwrite: JitsiOptions["configOverwrite"] = {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          prejoinPageEnabled: true,
          enableNoisyMicDetection: false,
        };

        if (isModerator) {
          configOverwrite.startAsSilentAuditor = false;
        }

        const api = new window.JitsiMeetExternalAPI(env.JITSI_DOMAIN, {
          roomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName, email },
          configOverwrite,
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "hangup",
              "desktop",
              "chat",
              "tileview",
              "participants-pane",
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            MOBILE_APP_PROMO: false,
          },
        });

        apiRef.current = api;
        setIsLoaded(true);

        api.addListener("videoConferenceJoined", () => {
          callbacksRef.current?.onConferenceJoined?.();
        });

        api.addListener("participantJoined", (data) => {
          const e = data as { id: string; displayName?: string };
          callbacksRef.current?.onParticipantJoined?.(e.id, e.displayName ?? "");
        });

        api.addListener("participantLeft", (data) => {
          const e = data as { id: string };
          callbacksRef.current?.onParticipantLeft?.(e.id);
        });

        api.addListener("videoMuteStatusChanged", (data) => {
          const e = data as { muted: boolean };
          callbacksRef.current?.onVideoMuteChanged?.(e.muted);
        });

        api.addListener("audioMuteStatusChanged", (data) => {
          const e = data as { muted: boolean };
          callbacksRef.current?.onAudioMuteChanged?.(e.muted);
        });

        api.addListener("screenSharingStatusChanged", (data) => {
          const e = data as { on: boolean };
          callbacksRef.current?.onScreenShareChanged?.(e.on);
        });

        api.addListener("readyToClose", () => {
          callbacksRef.current?.onReadyToClose?.();
        });
      } catch {
        if (!cancelled) setIsError(true);
      }
    };

    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      // Verificar si otro componente ya insertó el script para no duplicarlo
      const existingScript = document.querySelector(
        `script[src*="${env.JITSI_DOMAIN}/external_api.js"]`,
      );
      if (existingScript) {
        existingScript.addEventListener("load", initJitsi);
        existingScript.addEventListener("error", () => {
          if (!cancelled) setIsError(true);
        });
      } else {
        const script = document.createElement("script");
        script.src = `https://${env.JITSI_DOMAIN}/external_api.js`;
        script.async = true;
        script.onload = initJitsi;
        script.onerror = () => {
          if (!cancelled) setIsError(true);
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [roomName, displayName, email, isModerator, containerRef]);

  const hangup = useCallback(() => {
    apiRef.current?.executeCommand("hangup");
  }, []);

  const toggleAudio = useCallback(() => {
    apiRef.current?.executeCommand("toggleAudio");
  }, []);

  const toggleVideo = useCallback(() => {
    apiRef.current?.executeCommand("toggleVideo");
  }, []);

  const kickParticipant = useCallback((id: string) => {
    apiRef.current?.executeCommand("kickParticipant", id);
  }, []);

  const getParticipantCount = useCallback(() => {
    return apiRef.current?.getNumberOfParticipants() ?? 0;
  }, []);

  const captureScreenshot = useCallback(
    () =>
      apiRef.current?.captureLargeVideoScreenshot() ??
      Promise.resolve({ dataURL: "" }),
    [],
  );

  return {
    isLoaded,
    isError,
    hangup,
    toggleAudio,
    toggleVideo,
    kickParticipant,
    getParticipantCount,
    captureScreenshot,
  };
}
