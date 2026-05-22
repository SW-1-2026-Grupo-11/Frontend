import { useState } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { UI } from "@/config/constants";
import { JitsiRoom } from "@/features/supervision";
import { alertasService } from "@/features/alertas";
import { useGenerarReporte } from "@/features/reportes";
import { useProctoring } from "@/features/proctoring";

function calcNivelRiesgo(puntaje: number): string {
  if (puntaje >= 15) return "alto";
  if (puntaje >= 6) return "medio";
  return "bajo";
}

export default function SessionPage() {
  const { sessionId } = useParams({ from: "/session/$sessionId" });
  const { entrevistaId, participanteId } = useSearch({ from: "/session/$sessionId" });
  const navigate = useNavigate();
  const generarReporte = useGenerarReporte();
  const [statusMsg, setStatusMsg] = useState("");
  const proctoring = useProctoring({
    entrevistaId: entrevistaId ?? 0,
    participanteId: participanteId ?? 1,
    sessionId: sessionId,
    enabled: Boolean(entrevistaId),
  });

  const loading = generarReporte.isPending;

  const handleLeave = () => {
    navigate({ to: "/supervision" });
  };

  const handleFinalizar = async () => {
    setStatusMsg("Obteniendo alertas...");
    try {
      const alertas = await alertasService.getAlertas();

      // Filter to only alerts for this interview
      const alertasEntrevista = entrevistaId
        ? alertas.filter((a) => Number(a.entrevista) === entrevistaId)
        : alertas;

      // Further narrow down to only THIS session's alerts (via evidencia_json.session_id)
      const alertasSesion = alertasEntrevista.filter((a) => {
        if (!sessionId) return true;
        const ej = a.evidencia_json as Record<string, unknown> | undefined;
        return ej?.session_id === sessionId;
      });

      const SEV_SCORE: Record<string, number> = { alta: 3, media: 2, baja: 1 };
      const puntaje_total = alertasSesion.reduce(
        (sum, a) => sum + (SEV_SCORE[a.severidad] ?? 1),
        0,
      );
      const nivel_riesgo = calcNivelRiesgo(puntaje_total);

      setStatusMsg("Generando reporte con IA...");
      await generarReporte.mutateAsync({
        entrevista_id: String(entrevistaId || 0),
        participante_id: String(participanteId || 1),
        puntaje_total,
        total_alertas: alertasSesion.length,
        nivel_riesgo,
        session_id: sessionId,
      });

      setStatusMsg(
        alertasSesion.length > 0
          ? `¡Reporte generado con ${alertasSesion.length} alerta(s) de esta sesión!`
          : "¡Reporte generado (sin alertas registradas en esta sesión)!",
      );
      setTimeout(() => navigate({ to: "/reportes" }), 1200);
    } catch {
      setStatusMsg("Error al guardar el informe en el servidor. Revisa Django en :8000.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-sm) var(--space-lg)",
          height: "var(--header-height)",
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          zIndex: 10,
          position: "relative",
          gap: "var(--space-md)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "var(--font-size-lg)",
              fontWeight: "var(--font-weight-medium)",
              color: "var(--color-text)",
            }}
          >
            {UI.SESSION_TITLE}
            {entrevistaId ? ` — Entrevista #${entrevistaId}` : ""}
          </h1>
          <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
            ID: {sessionId.slice(0, 8)}
          </span>
        </div>

        <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center", flexWrap: "wrap" }}>
          {entrevistaId > 0 && (
            <span
              id="proctoring-status-badge"
              style={{
                fontSize: "var(--font-size-sm)",
                color: proctoring.isActive
                  ? "#10b981"
                  : proctoring.status === "error"
                    ? "var(--color-danger)"
                    : proctoring.status === "starting"
                      ? "#f59e0b"
                      : "var(--color-text-muted)",
                backgroundColor: "var(--color-surface-hover)",
                borderRadius: "var(--radius-full)",
                padding: "2px var(--space-sm)",
                border: `1px solid ${
                  proctoring.isActive
                    ? "#10b981"
                    : proctoring.status === "error"
                      ? "var(--color-danger)"
                      : "var(--color-border)"
                }`,
                maxWidth: 480,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "help",
              }}
              title={proctoring.lastMessage}
            >
              {proctoring.isActive
                ? `● IA activa · ${proctoring.framesAnalyzed} frames`
                : proctoring.status === "error"
                  ? "● IA error"
                  : proctoring.status === "starting"
                    ? "◌ IA iniciando..."
                    : "○ IA inactiva"}
              {proctoring.alertsDetected > 0 ? ` · ⚠️ ${proctoring.alertsDetected} alerta(s)` : ""}
            </span>
          )}
          {statusMsg && (
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
              {statusMsg}
            </span>
          )}
          <button
            id="btn-finalizar-reporte"
            onClick={handleFinalizar}
            disabled={loading}
            style={{
              padding: "var(--space-sm) var(--space-lg)",
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-medium)",
              color: "#fff",
              backgroundColor: loading ? "#6b7280" : "#dc2626",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "opacity var(--transition-fast)",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Generando..." : "Finalizar y Generar Reporte"}
          </button>

          <button
            onClick={handleLeave}
            style={{
              padding: "var(--space-sm) var(--space-md)",
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-medium)",
              color: "var(--color-text-muted)",
              backgroundColor: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {UI.LEAVE_BUTTON}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <JitsiRoom
          sessionId={sessionId}
          callbacks={{
            onCameraToggled: proctoring.onCameraToggled,
            onScreenSharing: proctoring.onScreenSharing,
            onParticipantLeft: proctoring.onParticipantLeft,
          }}
        />
      </main>
    </div>
  );
}
