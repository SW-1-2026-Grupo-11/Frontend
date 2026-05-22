import { useRef } from "react";
import { UI } from "@/config/constants";
import { useJitsi } from "@/features/supervision";
import type { JitsiCallbacks } from "./types";

type JitsiRoomProps = {
  sessionId: string;
  displayName?: string;
  jwt?: string;
  callbacks?: JitsiCallbacks;
};

export default function JitsiRoom({ sessionId, displayName, jwt, callbacks }: JitsiRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLoading, hasError } = useJitsi({
    roomName: sessionId,
    displayName,
    jwt,
    containerRef,
    callbacks,
  });

  if (hasError) {
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
        Error al cargar la videollamada. Verifica tu conexión.
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-muted)",
            fontSize: "var(--font-size-lg)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          {UI.LOADING_JITSI}
        </div>
      )}
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
