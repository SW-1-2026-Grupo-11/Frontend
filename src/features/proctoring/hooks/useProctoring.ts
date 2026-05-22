import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PROCTORING } from "@/config/constants";
import { proctoringService } from "../services/proctoringService";
import { captureFrameFromVideo } from "../utils/captureFrame";

type DetectionKey = keyof typeof PROCTORING.DETECTION_LABELS;

function labelForAlert(tipo?: string): string {
  if (!tipo) return "Alerta detectada";
  const key = tipo as DetectionKey;
  return PROCTORING.DETECTION_LABELS[key] ?? tipo.replaceAll("_", " ");
}

type Options = {
  entrevistaId: number;
  participanteId: number;
  sessionId?: string;
  enabled?: boolean;
};

function nowIso(): string {
  return new Date().toISOString();
}

export function useProctoring({ entrevistaId, participanteId, sessionId, enabled = true }: Options) {
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzingRef = useRef(false);
  const frameCountRef = useRef(0);
  const [status, setStatus] = useState<"idle" | "starting" | "active" | "error">("idle");
  const [lastMessage, setLastMessage] = useState("");
  const [alertsDetected, setAlertsDetected] = useState(0);

  const isEnabled = enabled && entrevistaId > 0;
  const entrevistaIdStr = String(entrevistaId);
  const participanteIdStr = String(participanteId);

  const invalidateAlertas = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["alertas"] });
  }, [queryClient]);

  const reportJitsiEvent = useCallback(
    async (tipo_evento: string, valor: string) => {
      if (!isEnabled) return;
      try {
        const res = await proctoringService.reportJitsiEvent({
          entrevista_id: entrevistaIdStr,
          participante_id: participanteIdStr,
          tipo_evento,
          valor,
          timestamp: nowIso(),
          session_id: sessionId,
        });
        if (res.alerta) {
          setAlertsDetected((n) => n + 1);
          setLastMessage(res.mensaje ?? labelForAlert(res.tipo_alerta ?? tipo_evento));
          invalidateAlertas();
        }
      } catch {
        // Eventos Jitsi opcionales: no marcar error global si fallan
      }
    },
    [entrevistaIdStr, participanteIdStr, sessionId, invalidateAlertas, isEnabled],
  );

  const analyzeCurrentFrame = useCallback(async () => {
    if (!isEnabled || analyzingRef.current) return;
    const video = videoRef.current;
    if (!video) return;

    // Verificar que el video tiene datos reales antes de capturar
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setLastMessage("Cámara iniciando — esperando datos de video...");
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setLastMessage("Cámara sin resolución válida — verifica permisos del navegador.");
      return;
    }

    const frame = captureFrameFromVideo(video);
    if (!frame) {
      setLastMessage("No se pudo capturar frame de la cámara.");
      return;
    }

    frameCountRef.current += 1;
    analyzingRef.current = true;
    try {
      const res = await proctoringService.analyzeFrame({
        entrevista_id: entrevistaIdStr,
        participante_id: participanteIdStr,
        frame,
        timestamp: nowIso(),
        session_id: sessionId,
      });
      if (res.alerta) {
        setAlertsDetected((n) => n + 1);
        setLastMessage(res.mensaje ?? labelForAlert(res.tipo_alerta));
        invalidateAlertas();
      } else {
        setLastMessage(`IA activa — frame #${frameCountRef.current} analizado sin incidencias`);
      }
      // Recuperar del estado de error si el servicio responde bien
      setStatus((prev) => (prev === "error" ? "active" : prev));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Distinguir error de red vs error del servidor
      if (msg.includes("Network Error") || msg.includes("ECONNREFUSED") || msg.includes("Failed to fetch")) {
        setStatus("error");
        setLastMessage("❌ Servicio IA no responde en :9000 — verifica que uvicorn está corriendo.");
      } else {
        setStatus("error");
        setLastMessage(`❌ Error del servicio IA: ${msg}`);
      }
    } finally {
      analyzingRef.current = false;
    }
  }, [entrevistaIdStr, participanteIdStr, sessionId, invalidateAlertas, isEnabled]);

  // ─── Iniciar cámara oculta ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isEnabled) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("starting");
    setLastMessage("Solicitando acceso a la cámara...");

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: PROCTORING.CAPTURE_WIDTH },
            height: { ideal: PROCTORING.CAPTURE_HEIGHT },
            facingMode: "user",
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const video = document.createElement("video");
        video.setAttribute("playsinline", "true");
        video.muted = true;
        // Oculto pero presente en el DOM para que funcione en todos los navegadores
        video.style.position = "fixed";
        video.style.width = "1px";
        video.style.height = "1px";
        video.style.opacity = "0";
        video.style.pointerEvents = "none";
        video.style.left = "-9999px";
        video.style.top = "-9999px";
        document.body.appendChild(video);
        video.srcObject = stream;

        // Esperar a que el video tenga datos reales
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Timeout cargando video")), 8000);
          video.oncanplay = () => {
            clearTimeout(timeout);
            resolve();
          };
          video.onerror = () => {
            clearTimeout(timeout);
            reject(new Error("Error cargando video"));
          };
        });

        await video.play();

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          video.parentNode?.removeChild(video);
          return;
        }

        videoRef.current = video;
        streamRef.current = stream;
        frameCountRef.current = 0;
        setStatus("active");
        setLastMessage(
          `✅ IA activa (${video.videoWidth}×${video.videoHeight}) — detectando: teléfono · rostros · mirada`,
        );
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Error desconocido";
        setStatus("error");
        if (msg.includes("NotAllowed") || msg.includes("Permission denied")) {
          setLastMessage("❌ Acceso a cámara denegado — habilita los permisos en el navegador.");
        } else if (msg.includes("NotFound") || msg.includes("DevicesNotFound")) {
          setLastMessage("❌ No se encontró ninguna cámara en este dispositivo.");
        } else {
          setLastMessage(`❌ No se pudo acceder a la cámara: ${msg}`);
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current?.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
      }
      videoRef.current = null;
    };
  }, [isEnabled]);

  // ─── Loop de análisis de frames ────────────────────────────────────────────
  useEffect(() => {
    if (!isEnabled || status !== "active") return;

    const id = window.setInterval(() => {
      void analyzeCurrentFrame();
    }, PROCTORING.FRAME_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [isEnabled, status, analyzeCurrentFrame]);

  // ─── Detección de cambio de ventana ────────────────────────────────────────
  useEffect(() => {
    if (!isEnabled) return;

    const onVisibility = () => {
      if (document.hidden) {
        void proctoringService
          .reportWindowChange({
            entrevista_id: entrevistaIdStr,
            participante_id: participanteIdStr,
            evento: "cambio_ventana",
            timestamp: nowIso(),
            session_id: sessionId,
          })
          .then((res) => {
            if (res.alerta) {
              setAlertsDetected((n) => n + 1);
              setLastMessage(res.mensaje ?? "⚠️ Cambio de ventana detectado");
              invalidateAlertas();
            }
          })
          .catch(() => undefined);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [entrevistaIdStr, participanteIdStr, sessionId, invalidateAlertas, isEnabled]);

  // ─── Callbacks para eventos de Jitsi ───────────────────────────────────────

  const onCameraToggled = useCallback(
    (_participantId: string, muted: boolean) => {
      if (muted) void reportJitsiEvent("camara_apagada", "true");
    },
    [reportJitsiEvent],
  );

  const onScreenSharing = useCallback(
    (_participantId: string, active: boolean) => {
      if (active) void reportJitsiEvent("pantalla_compartida", "true");
    },
    [reportJitsiEvent],
  );

  const onParticipantLeft = useCallback(
    (participant: { id: string }) => {
      void reportJitsiEvent("participante_salio", participant.id);
    },
    [reportJitsiEvent],
  );

  return {
    status,
    lastMessage,
    alertsDetected,
    framesAnalyzed: frameCountRef.current,
    isActive: status === "active",
    onCameraToggled,
    onScreenSharing,
    onParticipantLeft,
  };
}
