import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { MainLayout } from "@/shared/components/layout";
import { useCurrentUser, useLogout } from "@/features/auth";
import { useGetSesionDetalle, useActualizarObservaciones, CalificacionSesion, useGetAuditoria } from "@/features/sesiones";
import type { InvitadoSesion } from "@/features/sesiones";
import { useAlertas } from "@/features/alertas";
import type { Alerta } from "@/features/alertas";
import { useGenerarReporte, useGetReportes, useGenerarReporteIA } from "@/features/reportes";
import type { Reporte } from "@/features/reportes";
import { getEntrevistaId } from "@/features/reportes";
import { SESIONES, ALERTAS } from "@/config/constants";

// ─── Local types ──────────────────────────────────────────────────────────────

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#1d4ed8", "#7c3aed", "#0891b2", "#be185d", "#15803d", "#b45309"];

const NIVEL_RIESGO_COLOR: Record<string, string> = {
  bajo: "var(--color-success)",
  medio: "#f97316",
  alto: "var(--color-danger)",
};

const INVITADO_ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  aceptado: "Aceptado",
  rechazado: "Rechazado",
  completado: "Completado",
};

const INVITADO_ESTADO_COLOR: Record<string, string> = {
  pendiente: "var(--color-text-muted)",
  aceptado: "var(--color-primary)",
  rechazado: "var(--color-danger)",
  completado: "var(--color-success)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcularIntegridad(alertas: Alerta[]): number {
  const alta = alertas.filter((a) => a.severidad === "alta").length;
  const media = alertas.filter((a) => a.severidad === "media").length;
  return Math.max(0, 100 - alta * 10 - media * 5);
}

function formatDuracion(minutos: number): string {
  if (minutos <= 0) return "—";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} minutos`;
  return m === 0 ? `${h}h` : `${h}h ${m} minutos`;
}

function formatTipoAlerta(tipo: string): string {
  return (ALERTAS.TIPOS as Record<string, string>)[tipo] ?? tipo.replaceAll("_", " ");
}

function icolor(v: number): string {
  if (v < 70) return "var(--color-danger)";
  if (v < 85) return "#f97316";
  return "var(--color-success)";
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function calcDurMinutes(start: string, end: string | null): number {
  if (!end) return 0;
  return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function cleanResumen(text: string): string {
  return text.replace(/\nSessionID:\s*[a-f0-9-]{36}/i, "").trim();
}

// ─── SesionDetallePage ────────────────────────────────────────────────────────

export default function SesionDetallePage() {
  const { sesionId: sesionIdStr } = useParams({ strict: false }) as { sesionId?: string };
  const sesionId = Number(sesionIdStr ?? 0);
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  // ── Queries ──
  const { data: sesionDetalle, isLoading: sesionLoading, isError: sesionError } =
    useGetSesionDetalle(sesionId);

  const { data: auditoria = [] } = useGetAuditoria(sesionId);

  const entrevistaId = sesionDetalle?.entrevista ?? 0;

  const { data: alertas = [] } = useAlertas(
    entrevistaId ? { entrevista: entrevistaId } : undefined,
  );

  const { data: todosReportes = [] } = useGetReportes();
  const reportesFiltrados = todosReportes
    .filter((r) => getEntrevistaId(r) === entrevistaId)
    .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
  const ultimoReporte = reportesFiltrados[0] ?? null;

  const actualizarObs = useActualizarObservaciones();
  const generarReporteMutation = useGenerarReporte();
  const generarIAMutation = useGenerarReporteIA();

  // ── State ──
  const [observaciones, setObservaciones] = useState("");
  const [obsSaved, setObsSaved] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [copiadoSupervisor, setCopiadoSupervisor] = useState(false);
  const [copiadoInvitado, setCopiadoInvitado] = useState<Record<number, boolean>>({});
  const [copiadoTodos, setCopiadoTodos] = useState(false);
  const [reporteModal, setReporteModal] = useState<{
    open: boolean;
    reporte: Reporte | null;
    integridad: number;
  }>({ open: false, reporte: null, integridad: 100 });
  const [generandoReporte, setGenerandoReporte] = useState<Record<string, boolean>>({});
  const [mostrarMas, setMostrarMas] = useState<Record<number, boolean>>({});
  const obsInitRef = useRef(false);

  // Init observaciones once when sesionDetalle loads
  useEffect(() => {
    if (obsInitRef.current || !sesionDetalle) return;
    obsInitRef.current = true;
    setObservaciones(sesionDetalle.observaciones_internas ?? "");
  }, [sesionDetalle]);

  // Auto-dismiss "guardado" badge
  useEffect(() => {
    if (!obsSaved) return;
    const t = setTimeout(() => setObsSaved(false), 2500);
    return () => clearTimeout(t);
  }, [obsSaved]);

  // ── Event handlers ──
  function handleGuardarObs() {
    actualizarObs.mutate(
      { sesionId, dto: { observaciones } },
      { onSuccess: () => setObsSaved(true) },
    );
  }

  function handleCopiarLink(link: string) {
    void navigator.clipboard.writeText(link).then(() => {
      setCopiadoLink(true);
      setTimeout(() => setCopiadoLink(false), 2000);
    });
  }

  function handleCopiarSupervisor(link: string) {
    void navigator.clipboard.writeText(link).then(() => {
      setCopiadoSupervisor(true);
      setTimeout(() => setCopiadoSupervisor(false), 2000);
    });
  }

  function handleCopiarLinkInvitado(invId: number, link: string) {
    void navigator.clipboard.writeText(link).then(() => {
      setCopiadoInvitado((prev) => ({ ...prev, [invId]: true }));
      setTimeout(() => setCopiadoInvitado((prev) => ({ ...prev, [invId]: false })), 2000);
    });
  }

  function handleCopiarTodos() {
    if (!sesionDetalle) return;
    const invLines = sesionDetalle.invitados
      .filter((inv) => inv.link_invitacion)
      .map((inv) => `${inv.nombre}: ${inv.link_invitacion ?? ""}`)
      .join("\n");
    const supervisorLine = sesionDetalle.link_supervisor
      ? `\nTu link como supervisor: ${sesionDetalle.link_supervisor}`
      : "";
    const text = `Links de evaluación — ${sesionDetalle.titulo_entrevista}\n\n${invLines}${supervisorLine}`;
    void navigator.clipboard.writeText(text).then(() => {
      setCopiadoTodos(true);
      setTimeout(() => setCopiadoTodos(false), 2000);
    });
  }

  async function handleGenerarReporteParticipante(inv: InvitadoSesion) {
    if (!sesionDetalle) return;
    const partAlertas = alertas.filter((a) => a.participante_nombre === inv.nombre);
    const integridad = calcularIntegridad(partAlertas);
    const key = String(inv.id);
    setGenerandoReporte((prev) => ({ ...prev, [key]: true }));
    try {
      const reporte = await generarReporteMutation.mutateAsync({
        entrevista_id: String(entrevistaId),
        participante_id: String(inv.id),
        puntaje_total: integridad,
        total_alertas: partAlertas.length,
        nivel_riesgo: integridad < 70 ? "alto" : integridad < 85 ? "medio" : "bajo",
      });
      setReporteModal({ open: true, reporte, integridad });
    } finally {
      setGenerandoReporte((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function handleGenerarReporteIA() {
    if (!entrevistaId) return;
    const integridad = calcularIntegridad(alertas);
    try {
      const reporte = await generarIAMutation.mutateAsync(entrevistaId);
      setReporteModal({ open: true, reporte, integridad });
    } catch {
      // error silenciado — mutation state lo expone
    }
  }

  // ── Guards ──
  if (sesionLoading) {
    return (
      <MainLayout userName={user?.username} onLogout={logout}>
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", padding: 20 }}>
          Cargando detalle de sesión…
        </p>
      </MainLayout>
    );
  }

  if (sesionError || !sesionDetalle) {
    return (
      <MainLayout userName={user?.username} onLogout={logout}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
          <p style={{ color: "var(--color-danger)", fontSize: "var(--font-size-sm)" }}>
            No se pudo cargar la sesión #{sesionId}.
          </p>
        </div>
      </MainLayout>
    );
  }

  // ── Derived values ──
  const durMinutes = calcDurMinutes(sesionDetalle.fecha_inicio, sesionDetalle.fecha_fin);
  const primerInvitado = sesionDetalle.invitados[0];
  const linkInvitacion = primerInvitado?.link_invitacion ?? null;
  const estadoColor =
    sesionDetalle.estado === "activa"
      ? "var(--color-primary)"
      : sesionDetalle.estado === "iniciada"
        ? "#f59e0b"
        : "var(--color-success)";

  return (
    <MainLayout userName={user?.username} onLogout={logout}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── SECCIÓN 1: Header ──────────────────────────────────────────────── */}
        <div style={card}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ margin: "0 0 2px", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontWeight: "var(--font-weight-medium)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Metadata de la Entrevista
            </p>
            <h1 style={{ margin: 0, fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)", lineHeight: 1.25 }}>
              {sesionDetalle.titulo_entrevista}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{
              display: "inline-block",
              padding: "3px 10px",
              borderRadius: 12,
              fontSize: "var(--font-size-xs)",
              fontWeight: "var(--font-weight-semibold)",
              background: `${estadoColor}18`,
              color: estadoColor,
            }}>
              {SESIONES.ESTADO_LABELS[sesionDetalle.estado] ?? sesionDetalle.estado}
            </span>
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
              Log generado el: {fmtDateTime(sesionDetalle.fecha_fin ?? sesionDetalle.fecha_inicio)}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {sesionDetalle.estado !== "finalizada" && (
              <button
                onClick={() => void navigate({ to: `/sesiones/${sesionId}/sala` as never })}
                style={btnPrimary}
              >
                Ir a sala de monitoreo
              </button>
            )}
            <button
              onClick={() => void navigate({ to: "/dashboard" as never })}
              style={btnSecondary}
            >
              Volver al dashboard
            </button>
          </div>

          {sesionDetalle.link_supervisor && (
            <div style={{
              marginTop: 12,
              padding: "8px 12px",
              background: "var(--color-background)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🔗</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Mi link de supervisor
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {sesionDetalle.link_supervisor}
                </p>
              </div>
              <button
                onClick={() => handleCopiarSupervisor(sesionDetalle.link_supervisor!)}
                style={{ ...btnSecondary, padding: "3px 10px", fontSize: 11, flexShrink: 0 }}
              >
                {copiadoSupervisor ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
          )}
        </div>

        {/* ── SECCIÓN 2: Resumen general ─────────────────────────────────────── */}
        <div style={card}>
          <h2 style={cardTitle}>Resumen General del Evento</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>

            {/* Duración */}
            <div>
              <p style={metaLabel}>DURACIÓN TOTAL</p>
              <p style={{ ...metaValue, fontSize: "var(--font-size-lg)" }}>
                {durMinutes > 0 ? formatDuracion(durMinutes) : (sesionDetalle.duracion_minutos ? formatDuracion(sesionDetalle.duracion_minutos) : "En curso")}
              </p>
              <p style={metaSubtext}>
                {fmtTime(sesionDetalle.fecha_inicio)} – {fmtTime(sesionDetalle.fecha_fin)}
              </p>
            </div>

            {/* Evaluador */}
            <div>
              <p style={metaLabel}>EVALUADOR PRINCIPAL</p>
              {sesionDetalle.evaluador_nombre ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: "var(--font-weight-bold)",
                    flexShrink: 0,
                  }}>
                    {getInitials(sesionDetalle.evaluador_nombre)}
                  </div>
                  <div>
                    <p style={{ ...metaValue, marginBottom: 1 }}>{sesionDetalle.evaluador_nombre}</p>
                    <p style={metaSubtext}>{sesionDetalle.evaluador_email ?? ""}</p>
                  </div>
                </div>
              ) : (
                <p style={metaSubtext}>Sin evaluador asignado</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <p style={metaLabel}>DESCRIPCIÓN</p>
              <p style={metaSubtext}>{sesionDetalle.descripcion_entrevista ?? "—"}</p>
            </div>

            {/* Link de invitación */}
            <div>
              <p style={metaLabel}>LINK DE INVITACIÓN</p>
              {linkInvitacion ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {linkInvitacion.length > 30 ? `${linkInvitacion.slice(0, 30)}…` : linkInvitacion}
                  </span>
                  <button
                    onClick={() => handleCopiarLink(linkInvitacion)}
                    style={{ ...btnSecondary, padding: "3px 8px", fontSize: 11, flexShrink: 0 }}
                  >
                    {copiadoLink ? "¡Copiado!" : "Copiar Link"}
                  </button>
                </div>
              ) : (
                <p style={metaSubtext}>Sin link generado</p>
              )}
              <p style={{ ...metaSubtext, marginTop: 6 }}>
                Número de entrevistados: {sesionDetalle.invitados.length}
              </p>
              {sesionDetalle.invitados.length > 0 && (
                <div style={{ display: "flex", gap: -4, marginTop: 6, flexDirection: "row" }}>
                  {sesionDetalle.invitados.slice(0, 3).map((inv, i) => (
                    <div
                      key={inv.id}
                      title={inv.nombre}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                        border: "2px solid var(--color-surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: "var(--font-weight-bold)",
                        marginLeft: i > 0 ? -8 : 0,
                        zIndex: 10 - i,
                        position: "relative",
                      }}
                    >
                      {getInitials(inv.nombre)}
                    </div>
                  ))}
                  {sesionDetalle.invitados.length > 3 && (
                    <div style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "var(--color-border)",
                      border: "2px solid var(--color-surface)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-text-muted)",
                      fontSize: 10,
                      fontWeight: "var(--font-weight-bold)",
                      marginLeft: -8,
                      position: "relative",
                    }}>
                      +{sesionDetalle.invitados.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Jitsi snapshot */}
            <div>
              <p style={metaLabel}>JITSI MEETING SNAPSHOT</p>
              <div style={{
                marginTop: 6,
                height: 80,
                background: "#1e293b",
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M16 10l4-2v8l-4-2v-4z" />
                </svg>
                <span style={{ fontSize: 10, color: "#64748b" }}>Grabación disponible</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECCIÓN 4: Participantes ───────────────────────────────────────── */}
        {/* ── Desempeño en la prueba (Capa 4) ── */}
        <div style={card}>
          <h2 style={cardTitle}>Desempeño en la prueba</h2>
          <CalificacionSesion
            sesionId={sesionId}
            notaInicial={sesionDetalle.nota_final}
            estadoInicial={sesionDetalle.estado_correccion}
          />
        </div>

        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ ...cardTitle, marginBottom: 0 }}>Participantes y su evaluación</h2>
            {sesionDetalle.invitados.some((inv) => inv.link_invitacion) && (
              <button
                onClick={handleCopiarTodos}
                style={{ ...btnSecondary, padding: "5px 12px", fontSize: 12 }}
              >
                {copiadoTodos ? "✓ Copiado" : "Copiar todos los links"}
              </button>
            )}
          </div>
          {sesionDetalle.invitados.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
              Sin participantes en esta sesión.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              {sesionDetalle.invitados.map((inv, idx) => {
                const partAlertas = alertas.filter((a) => a.participante_nombre === inv.nombre);
                const integridad = calcularIntegridad(partAlertas);
                const sortedAlertas = [...partAlertas].sort(
                  (a, b) => new Date(b.timestamp_alerta).getTime() - new Date(a.timestamp_alerta).getTime(),
                );
                const showAll = mostrarMas[inv.id] ?? false;
                const visibleAlertas = showAll ? sortedAlertas : sortedAlertas.slice(0, 5);
                const isGenerating = generandoReporte[String(inv.id)] ?? false;

                return (
                  <div key={inv.id} style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "var(--color-background)",
                  }}>
                    {/* Participant header */}
                    <div style={{ padding: "12px 14px", background: "var(--color-surface)", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "var(--font-size-xs)",
                        fontWeight: "var(--font-weight-bold)",
                        flexShrink: 0,
                      }}>
                        {getInitials(inv.nombre)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: "var(--font-weight-semibold)", fontSize: "var(--font-size-sm)", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {inv.nombre}
                        </p>
                        <p style={{ margin: 0, fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {inv.email}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: "var(--font-weight-semibold)",
                        color: INVITADO_ESTADO_COLOR[inv.estado] ?? "var(--color-text-muted)",
                        background: `${INVITADO_ESTADO_COLOR[inv.estado] ?? "#6b7280"}18`,
                        padding: "2px 8px",
                        borderRadius: 10,
                        flexShrink: 0,
                      }}>
                        {INVITADO_ESTADO_LABEL[inv.estado] ?? inv.estado}
                      </span>
                    </div>

                    {/* Link invitación */}
                    <div style={{ padding: "6px 14px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
                      {inv.link_invitacion ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, flexShrink: 0 }}>🔗</span>
                          <span style={{ flex: 1, fontSize: 11, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {inv.link_invitacion.length > 45 ? `${inv.link_invitacion.slice(0, 45)}…` : inv.link_invitacion}
                          </span>
                          <button
                            onClick={() => handleCopiarLinkInvitado(inv.id, inv.link_invitacion!)}
                            style={{ ...btnSecondary, padding: "2px 8px", fontSize: 10, flexShrink: 0 }}
                          >
                            {copiadoInvitado[inv.id] ? "✓ Copiado" : "Copiar"}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Link no disponible</span>
                      )}
                    </div>

                    {/* Integridad */}
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                          Score de integridad
                        </span>
                        <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-bold)", color: icolor(integridad) }}>
                          {integridad}/100
                        </span>
                      </div>
                      <div style={{ height: 6, background: "var(--color-border)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${integridad}%`,
                          background: icolor(integridad),
                          borderRadius: 3,
                          transition: "width 0.4s",
                        }} />
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--color-text-muted)" }}>
                        {partAlertas.length} alerta(s) total
                      </p>
                    </div>

                    {/* Alert list */}
                    <div style={{ padding: "10px 14px" }}>
                      {sortedAlertas.length === 0 ? (
                        <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                          Sin alertas registradas
                        </p>
                      ) : (
                        <>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 }}>
                            {visibleAlertas.map((a) => (
                              <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                <span style={{
                                  marginTop: 4,
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: a.severidad === "alta" ? "var(--color-danger)" : a.severidad === "media" ? "#f97316" : "#6b7280",
                                  flexShrink: 0,
                                }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text)" }}>
                                    {formatTipoAlerta(a.tipo_alerta)}
                                  </span>
                                  <span style={{ fontSize: 10, color: "var(--color-text-muted)", marginLeft: 6 }}>
                                    {new Date(a.timestamp_alerta).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {sortedAlertas.length > 5 && (
                            <button
                              onClick={() => setMostrarMas((prev) => ({ ...prev, [inv.id]: !showAll }))}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--color-primary)", padding: 0 }}
                            >
                              {showAll ? "Ver menos" : `Ver ${sortedAlertas.length - 5} más`}
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Generate report button */}
                    <div style={{ padding: "0 14px 12px" }}>
                      <button
                        onClick={() => void handleGenerarReporteParticipante(inv)}
                        disabled={isGenerating}
                        style={{
                          ...btnPrimary,
                          width: "100%",
                          opacity: isGenerating ? 0.6 : 1,
                          justifyContent: "center",
                          display: "flex",
                        }}
                      >
                        {isGenerating ? "Analizando comportamientos…" : "Generar reporte individual"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SECCIÓN 5: Notas generales ─────────────────────────────────────── */}
        <div style={card}>
          <h2 style={cardTitle}>Notas generales del evaluador</h2>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={5}
            placeholder="Escribe observaciones internas sobre la sesión…"
            style={{
              width: "100%",
              padding: 10,
              background: "var(--color-background)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text)",
              resize: "vertical",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleGuardarObs}
              disabled={actualizarObs.isPending}
              style={{
                ...btnPrimary,
                background: obsSaved ? "var(--color-success)" : "var(--color-primary)",
                opacity: actualizarObs.isPending ? 0.6 : 1,
              }}
            >
              {actualizarObs.isPending ? "Guardando…" : obsSaved ? "¡Guardado!" : SESIONES.BTN_GUARDAR_OBS}
            </button>
          </div>
        </div>

        {/* ── SECCIÓN 6: Feedback consolidado ───────────────────────────────── */}
        {/* ── Registro de auditoría (Capa 4c) ── */}
        <div style={card}>
          <h2 style={cardTitle}>Registro de auditoría</h2>
          {auditoria.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", margin: 0 }}>
              Sin eventos registrados.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {auditoria.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: "var(--font-size-xs)",
                    paddingBottom: 6,
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ color: "var(--color-text-muted)", fontFamily: "monospace", flexShrink: 0 }}>
                    {fmtDateTime(ev.timestamp)}
                  </span>
                  <span style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-text)" }}>
                    {ev.accion}
                  </span>
                  <span style={{ color: "var(--color-text-muted)", marginLeft: "auto" }}>{ev.actor}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={card}>
          <h2 style={cardTitle}>Feedback consolidado</h2>

          {ultimoReporte ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Risk badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  Nivel de riesgo:
                </span>
                {ultimoReporte.nivel_riesgo && (
                  <span style={{
                    padding: "3px 12px",
                    borderRadius: 12,
                    fontSize: "var(--font-size-xs)",
                    fontWeight: "var(--font-weight-bold)",
                    background: `${NIVEL_RIESGO_COLOR[ultimoReporte.nivel_riesgo] ?? "#6b7280"}20`,
                    color: NIVEL_RIESGO_COLOR[ultimoReporte.nivel_riesgo] ?? "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    {ultimoReporte.nivel_riesgo}
                  </span>
                )}
                <span style={{ fontSize: 10, color: "var(--color-text-muted)", marginLeft: "auto" }}>
                  Generado: {fmtDateTime(ultimoReporte.fecha_creacion)}
                </span>
              </div>

              {/* Summary */}
              <div style={{ background: "var(--color-background)", borderRadius: 8, padding: "12px 14px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Resumen general
                </p>
                <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text)", lineHeight: 1.6 }}>
                  {cleanResumen(ultimoReporte.resumen_general)}
                </p>
              </div>

              {/* Recommendations */}
              {ultimoReporte.recomendaciones && (
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Recomendaciones
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                    {ultimoReporte.recomendaciones.split("\n").filter(Boolean).map((rec, i) => (
                      <li key={i} style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text)", lineHeight: 1.5 }}>
                        {rec.replace(/^[-•*]\s*/, "")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => setReporteModal({ open: true, reporte: ultimoReporte, integridad: 100 - (ultimoReporte.nivel_riesgo === "alto" ? 60 : ultimoReporte.nivel_riesgo === "medio" ? 30 : 5) })}
                  style={btnSecondary}
                >
                  Ver reporte completo
                </button>
                <button
                  onClick={() => void handleGenerarReporteIA()}
                  disabled={generarIAMutation.isPending}
                  style={{ ...btnPrimary, opacity: generarIAMutation.isPending ? 0.6 : 1 }}
                >
                  {generarIAMutation.isPending ? "Analizando con IA…" : "Regenerar con IA"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", marginBottom: 16 }}>
                No hay reportes generados para esta sesión.
              </p>
              <button
                onClick={() => void handleGenerarReporteIA()}
                disabled={generarIAMutation.isPending}
                style={{ ...btnPrimary, opacity: generarIAMutation.isPending ? 0.6 : 1 }}
              >
                {generarIAMutation.isPending ? "Analizando con IA…" : "Generar reporte con IA"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL DE REPORTE ──────────────────────────────────────────────────── */}
      {reporteModal.open && reporteModal.reporte && (
        <div
          onClick={() => setReporteModal((prev) => ({ ...prev, open: false }))}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 9000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)",
              borderRadius: 12,
              width: "100%",
              maxWidth: 520,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Modal header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)" }}>
                Reporte individual
              </h3>
              <button
                onClick={() => setReporteModal((prev) => ({ ...prev, open: false }))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: 20, lineHeight: 1, padding: "0 4px" }}
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
              {(() => {
                const { reporte, integridad } = reporteModal;
                const sospecha = Math.max(0, 100 - integridad);
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Nivel de riesgo */}
                    {reporte.nivel_riesgo && (
                      <div style={{ textAlign: "center", paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "6px 20px",
                          borderRadius: 20,
                          fontSize: "var(--font-size-base)",
                          fontWeight: "var(--font-weight-bold)",
                          background: `${NIVEL_RIESGO_COLOR[reporte.nivel_riesgo] ?? "#6b7280"}20`,
                          color: NIVEL_RIESGO_COLOR[reporte.nivel_riesgo] ?? "var(--color-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}>
                          Riesgo {reporte.nivel_riesgo}
                        </span>
                      </div>
                    )}

                    {/* Puntaje atención */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Puntaje atención</span>
                        <span style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", color: icolor(integridad) }}>
                          {integridad}/100
                        </span>
                      </div>
                      <div style={{ height: 8, background: "var(--color-border)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${integridad}%`, background: icolor(integridad), borderRadius: 4 }} />
                      </div>
                    </div>

                    {/* Puntaje sospecha */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Puntaje sospecha</span>
                        <span style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", color: "var(--color-danger)" }}>
                          {sospecha}/100
                        </span>
                      </div>
                      <div style={{ height: 8, background: "var(--color-border)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${sospecha}%`, background: "var(--color-danger)", borderRadius: 4 }} />
                      </div>
                    </div>

                    {/* Resumen general */}
                    <div style={{ background: "var(--color-background)", borderRadius: 8, padding: "12px 14px" }}>
                      <p style={{ margin: "0 0 6px", fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Resumen general
                      </p>
                      <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {cleanResumen(reporte.resumen_general)}
                      </p>
                    </div>

                    {/* Resumen participante */}
                    {reporte.resumen_participante && (
                      <div style={{ background: "var(--color-background)", borderRadius: 8, padding: "12px 14px" }}>
                        <p style={{ margin: "0 0 6px", fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Resumen del participante
                        </p>
                        <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {reporte.resumen_participante}
                        </p>
                      </div>
                    )}

                    {/* Recomendaciones */}
                    {reporte.recomendaciones && (
                      <div>
                        <p style={{ margin: "0 0 8px", fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Recomendaciones
                        </p>
                        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                          {reporte.recomendaciones.split("\n").filter(Boolean).map((rec, i) => (
                            <li key={i} style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text)", lineHeight: 1.5 }}>
                              {rec.replace(/^[-•*]\s*/, "")}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal footer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)" }}>
              <button
                onClick={() => setReporteModal((prev) => ({ ...prev, open: false }))}
                style={{ ...btnSecondary, width: "100%" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

// ─── Shared style objects ──────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
  boxShadow: "var(--shadow-sm)",
};

const cardTitle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: "var(--font-size-base)",
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--color-text)",
};

const metaLabel: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: 10,
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--color-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const metaValue: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--font-size-sm)",
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--color-text)",
};

const metaSubtext: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  color: "var(--color-text-muted)",
};

const btnPrimary: React.CSSProperties = {
  padding: "8px 16px",
  background: "var(--color-primary)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  fontSize: "var(--font-size-sm)",
  fontWeight: "var(--font-weight-semibold)",
  fontFamily: "inherit",
  transition: "opacity 0.15s",
};

const btnSecondary: React.CSSProperties = {
  padding: "8px 16px",
  background: "transparent",
  color: "var(--color-text-muted)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  fontSize: "var(--font-size-sm)",
  fontWeight: "var(--font-weight-medium)",
  fontFamily: "inherit",
};
