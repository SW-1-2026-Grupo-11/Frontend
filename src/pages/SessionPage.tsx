import { useRef, useState } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { UI } from "@/config/constants";
import { JitsiRoom } from "@/features/supervision";
import type { JitsiRoomHandle } from "@/features/supervision";
import { alertasService } from "@/features/alertas";
import { useGenerarReporte } from "@/features/reportes";
import { useProctoring } from "@/features/proctoring";
import { useCurrentUser } from "@/features/auth";
import { useGetSesionPorEntrevista, useGetSesionDetalle } from "@/features/sesiones";

function calcNivelRiesgo(puntaje: number): string {
  if (puntaje >= 15) return "alto";
  if (puntaje >= 6) return "medio";
  return "bajo";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SessionPage() {
  const { sessionId } = useParams({ from: "/session/$sessionId" });
  const { entrevistaId, participanteId } = useSearch({ from: "/session/$sessionId" });
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const generarReporte = useGenerarReporte();
  const jitsiRef = useRef<JitsiRoomHandle>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState<Record<number, boolean>>({});
  const [copiadoTodos, setCopiadoTodos] = useState(false);
  const [copiadoSupervisor, setCopiadoSupervisor] = useState(false);

  const proctoring = useProctoring({
    entrevistaId: entrevistaId ?? 0,
    participanteId: participanteId ?? 1,
    sessionId: sessionId,
    enabled: Boolean(entrevistaId),
  });

  const { data: sesion } = useGetSesionPorEntrevista(entrevistaId ?? 0);
  const { data: sesionDetalle } = useGetSesionDetalle(sesion?.id ?? 0);

  const loading = generarReporte.isPending;

  const handleLeave = () => {
    navigate({ to: "/supervision" });
  };

  const handleCopiarLinkInvitado = (id: number, link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiadoLink((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiadoLink((prev) => ({ ...prev, [id]: false })), 2000);
    });
  };

  const handleCopiarTodos = () => {
    const invitados = sesionDetalle?.invitados ?? [];
    const lines = invitados
      .filter((inv) => inv.link_invitacion)
      .map((inv) => `${inv.nombre} <${inv.email}>: ${inv.link_invitacion}`)
      .join("\n");
    const texto = `=== Links de evaluación ===\n${lines}\n==========================`;
    navigator.clipboard.writeText(texto).then(() => {
      setCopiadoTodos(true);
      setTimeout(() => setCopiadoTodos(false), 2000);
    });
  };

  const handleCopiarSupervisor = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiadoSupervisor(true);
      setTimeout(() => setCopiadoSupervisor(false), 2000);
    });
  };

  const handleFinalizar = async () => {
    setStatusMsg("Obteniendo alertas...");
    try {
      const alertas = await alertasService.getAlertas();

      const alertasEntrevista = entrevistaId
        ? alertas.filter((a) => Number(a.entrevista) === entrevistaId)
        : alertas;

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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", position: "relative" }}>
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
            onClick={() => setShowInfoPanel((p) => !p)}
            style={{
              padding: "var(--space-sm) var(--space-md)",
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-medium)",
              color: showInfoPanel ? "#2563eb" : "var(--color-text-muted)",
              backgroundColor: showInfoPanel ? "rgba(37,99,235,0.08)" : "transparent",
              border: `1px solid ${showInfoPanel ? "#2563eb" : "var(--color-border)"}`,
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            ℹ️ Info de la sala
          </button>

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
          ref={jitsiRef}
          roomName={sessionId}
          displayName={user?.username ?? "Supervisor"}
          isModerator={true}
          onVideoMuteChanged={(muted) => proctoring.onCameraToggled("local", muted)}
          onScreenShareChanged={(active) => proctoring.onScreenSharing("local", active)}
          onParticipantLeft={(id) => proctoring.onParticipantLeft({ id })}
        />
      </main>

      {showInfoPanel && (
        <div
          onClick={() => setShowInfoPanel(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "var(--header-height)",
              right: 0,
              width: 380,
              height: "calc(100vh - var(--header-height))",
              backgroundColor: "var(--color-surface)",
              borderLeft: "1px solid var(--color-border)",
              overflowY: "auto",
              padding: "var(--space-lg)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-lg)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2
                style={{
                  fontSize: "var(--font-size-base)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--color-text)",
                  margin: 0,
                }}
              >
                Info de la sala
              </h2>
              <button
                onClick={() => setShowInfoPanel(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 20,
                  color: "var(--color-text-muted)",
                  lineHeight: 1,
                  padding: "0 4px",
                }}
              >
                ×
              </button>
            </div>

            {!sesionDetalle && (
              <div
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "var(--font-size-sm)",
                  textAlign: "center",
                  padding: "var(--space-lg) 0",
                }}
              >
                Cargando información de la sesión...
              </div>
            )}

            {sesionDetalle && (
              <section>
                <h3
                  style={{
                    fontSize: "var(--font-size-xs)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "var(--space-sm)",
                  }}
                >
                  Datos de la sesión
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Título: </span>
                    {sesionDetalle.titulo_entrevista}
                  </div>
                  {sesionDetalle.evaluador_nombre && (
                    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>Evaluador: </span>
                      {sesionDetalle.evaluador_nombre}
                    </div>
                  )}
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Duración: </span>
                    {sesionDetalle.duracion_minutos} min
                  </div>
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Estado: </span>
                    <span
                      style={{
                        color:
                          sesionDetalle.estado === "activa"
                            ? "#10b981"
                            : sesionDetalle.estado === "iniciada"
                              ? "#f59e0b"
                              : "var(--color-text-muted)",
                      }}
                    >
                      {sesionDetalle.estado}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {sesionDetalle && sesionDetalle.invitados.length > 0 && (
              <section>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "var(--space-sm)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "var(--font-size-xs)",
                      fontWeight: "var(--font-weight-semibold)",
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      margin: 0,
                    }}
                  >
                    Links de acceso
                  </h3>
                  <button
                    onClick={handleCopiarTodos}
                    style={{
                      fontSize: "var(--font-size-xs)",
                      padding: "2px var(--space-sm)",
                      color: copiadoTodos ? "#10b981" : "var(--color-text-muted)",
                      backgroundColor: "transparent",
                      border: `1px solid ${copiadoTodos ? "#10b981" : "var(--color-border)"}`,
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {copiadoTodos ? "¡Copiados!" : "Copiar todos"}
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                  {sesionDetalle.invitados.map((inv) => (
                    <div key={inv.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            backgroundColor: "#2563eb",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "var(--font-size-xs)",
                            fontWeight: "var(--font-weight-semibold)",
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(inv.nombre)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "var(--font-size-sm)",
                              fontWeight: "var(--font-weight-medium)",
                              color: "var(--color-text)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {inv.nombre}
                          </div>
                          <div
                            style={{
                              fontSize: "var(--font-size-xs)",
                              color: "var(--color-text-muted)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {inv.email}
                          </div>
                        </div>
                      </div>
                      {inv.link_invitacion ? (
                        <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
                          <input
                            readOnly
                            value={inv.link_invitacion}
                            onFocus={(e) => e.target.select()}
                            style={{
                              flex: 1,
                              fontSize: "var(--font-size-xs)",
                              padding: "4px var(--space-sm)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--radius-sm)",
                              backgroundColor: "var(--color-surface-hover)",
                              color: "var(--color-text-muted)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              minWidth: 0,
                              fontFamily: "inherit",
                            }}
                          />
                          <button
                            onClick={() => handleCopiarLinkInvitado(inv.id, inv.link_invitacion!)}
                            style={{
                              flexShrink: 0,
                              fontSize: "var(--font-size-xs)",
                              padding: "4px var(--space-sm)",
                              color: copiadoLink[inv.id] ? "#10b981" : "var(--color-text-muted)",
                              backgroundColor: "transparent",
                              border: `1px solid ${copiadoLink[inv.id] ? "#10b981" : "var(--color-border)"}`,
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {copiadoLink[inv.id] ? "¡Copiado!" : "Copiar"}
                          </button>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: "var(--font-size-xs)",
                            color: "var(--color-text-muted)",
                            fontStyle: "italic",
                          }}
                        >
                          Link no disponible
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {sesionDetalle?.link_supervisor && (
              <section>
                <h3
                  style={{
                    fontSize: "var(--font-size-xs)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "var(--space-sm)",
                  }}
                >
                  Tu link de supervisor
                </h3>
                <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
                  <input
                    readOnly
                    value={sesionDetalle.link_supervisor}
                    onFocus={(e) => e.target.select()}
                    style={{
                      flex: 1,
                      fontSize: "var(--font-size-xs)",
                      padding: "4px var(--space-sm)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--color-surface-hover)",
                      color: "var(--color-text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      minWidth: 0,
                      fontFamily: "inherit",
                    }}
                  />
                  <button
                    onClick={() => handleCopiarSupervisor(sesionDetalle.link_supervisor!)}
                    style={{
                      flexShrink: 0,
                      fontSize: "var(--font-size-xs)",
                      padding: "4px var(--space-sm)",
                      color: copiadoSupervisor ? "#10b981" : "var(--color-text-muted)",
                      backgroundColor: "transparent",
                      border: `1px solid ${copiadoSupervisor ? "#10b981" : "var(--color-border)"}`,
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {copiadoSupervisor ? "¡Copiado!" : "Copiar mi link"}
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
