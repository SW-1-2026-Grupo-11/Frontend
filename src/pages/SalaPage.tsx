import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useGetSesionDetalle, useActualizarEstadoSesion, sesionesService } from "@/features/sesiones";
import type { InvitadoSesion } from "@/features/sesiones";
import { useAlertas } from "@/features/alertas";
import type { Alerta, Severidad } from "@/features/alertas";
import { useGenerarReporte } from "@/features/reportes";
import { ALERTAS } from "@/config/constants";
import { JitsiRoom } from "@/features/supervision";
import env from "@/config/env";

const SELF_HOSTED_JITSI = env.JITSI_DOMAIN !== "meet.jit.si";

// ─── Types ───────────────────────────────────────────────────────────────────
// 1 sesión = 1 candidato (Sesion.invitacion es FK única en el backend). Esta
// pantalla muestra a ESE candidato, no un grid de participantes.

type CandidatoMetrics = {
  id: number;
  nombre: string;
  email: string;
  alertCount: number;
  severity: Severidad | null;
  gazeOk: boolean;
  integridad: number;
  mirada: number;
  tiempoSeg: number;
  tabCount: number;
  sinRostro: number;
  celular: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const CSS_ANIMATIONS = `
@keyframes sala-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.sala-card-danger { animation: sala-pulse 2s ease-in-out infinite; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeMetrics(inv: InvitadoSesion, alertas: Alerta[], fechaInicio: string): CandidatoMetrics {
  const altaCount = alertas.filter((a) => a.severidad === "alta").length;
  const mediaCount = alertas.filter((a) => a.severidad === "media").length;
  const integridad = Math.max(0, 100 - altaCount * 10 - mediaCount * 5);

  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
  const mirada = alertas.filter(
    (a) => a.tipo_alerta === "mirada_fuera_pantalla" && new Date(a.timestamp_alerta) > twoMinAgo,
  ).length;

  const severity: Severidad | null =
    altaCount > 0 ? "alta" : mediaCount > 0 ? "media" : alertas.some((a) => a.severidad === "baja") ? "baja" : null;

  return {
    id: inv.id,
    nombre: inv.nombre,
    email: inv.email,
    alertCount: alertas.length,
    severity,
    gazeOk: mirada === 0,
    integridad,
    mirada,
    tiempoSeg: Math.floor((Date.now() - new Date(fechaInicio).getTime()) / 1000),
    tabCount: alertas.filter((a) => a.tipo_alerta === "cambio_ventana").length,
    sinRostro: alertas.filter((a) => a.tipo_alerta === "sin_rostro").length,
    celular: alertas.filter(
      (a) => a.tipo_alerta === "uso_de_celular" || a.tipo_alerta === "posible_celular_o_lectura",
    ).length,
  };
}

function scoreColor(n: number): string {
  if (n < 70) return "var(--color-danger)";
  if (n < 85) return "#f97316";
  return "var(--color-success)";
}

// Reemplaza la antigua "emoción" inventada: usa la severidad real (backend),
// no una heurística sobre tipos de alerta.
function riskInfo(severity: Severidad | null): { label: string; color: string } {
  if (severity === "alta") return { label: "Riesgo alto", color: "var(--color-danger)" };
  if (severity === "media") return { label: "Riesgo medio", color: "#f97316" };
  if (severity === "baja") return { label: "Riesgo bajo", color: "#eab308" };
  return { label: "Sin alertas", color: "var(--color-success)" };
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function initials(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = ["#1d4ed8", "#7c3aed", "#0891b2", "#be185d", "#15803d", "#b45309"];
function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 10,
        color,
        background: `${color}18`,
        padding: "1px 6px",
        borderRadius: 10,
        fontWeight: "var(--font-weight-medium)",
      }}
    >
      {children}
    </span>
  );
}

// ─── CandidatoPanel ───────────────────────────────────────────────────────────

function CandidatoPanel({
  data,
  jitsiJwt,
  onGenerarReporte,
  generarPending,
}: {
  jitsiJwt?: string;
  data: CandidatoMetrics;
  onGenerarReporte: () => void;
  generarPending: boolean;
}) {
  const risk = riskInfo(data.severity);

  return (
    <div
      className={data.severity === "alta" ? "sala-card-danger" : undefined}
      style={{
        background: "var(--color-surface)",
        border: `1px solid ${data.severity === "alta" ? "var(--color-danger)" : "var(--color-border)"}`,
        borderRadius: 10,
        overflow: "hidden",
        width: "100%",
        maxWidth: 560,
      }}
    >
      <div
        style={{
          aspectRatio: "16/9",
          background: "#1e293b",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {SELF_HOSTED_JITSI && !jitsiJwt ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: avatarColor(data.id),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: "var(--font-weight-bold)",
                fontSize: "var(--font-size-lg)",
              }}
            >
              {initials(data.nombre)}
            </div>
            <span style={{ fontSize: "var(--font-size-xs)", color: "rgba(255,255,255,0.5)" }}>
              Conectando a la sala…
            </span>
          </div>
        ) : (
          <JitsiRoom
            roomName={`inv-${data.id}`}
            displayName={data.nombre}
            email={data.email}
            isModerator
            jwt={jitsiJwt}
          />
        )}
        {!data.gazeOk && (
          <span
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              fontSize: 10,
              background: "#eab30888",
              color: "#713f12",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            Mirada desviada
          </span>
        )}
      </div>

      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontWeight: "var(--font-weight-semibold)",
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {data.nombre}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>{data.email}</p>
          </div>
          <Tag color={risk.color}>{risk.label}</Tag>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>Integridad</span>
            <span style={{ fontSize: 11, fontWeight: "var(--font-weight-semibold)", color: scoreColor(data.integridad) }}>
              {data.integridad}%
            </span>
          </div>
          <div style={{ height: 4, background: "var(--color-border)", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${data.integridad}%`,
                background: scoreColor(data.integridad),
                borderRadius: 2,
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 12px", marginBottom: 14 }}>
          {[
            { label: "Alertas totales", value: data.alertCount },
            { label: "Mirada desviada", value: data.mirada },
            { label: "Cambios de tab", value: data.tabCount },
            { label: "Celular detectado", value: data.celular },
            { label: "Sin rostro", value: data.sinRostro },
            { label: "Tiempo en sala", value: formatTime(data.tiempoSeg) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-muted)" }}>{label}</p>
              <p style={{ margin: 0, fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onGenerarReporte}
          disabled={generarPending}
          style={{
            width: "100%",
            padding: "8px",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: "var(--font-size-xs)",
            fontWeight: "var(--font-weight-semibold)",
            opacity: generarPending ? 0.6 : 1,
          }}
        >
          {generarPending ? "Generando…" : "Generar informe"}
        </button>
      </div>
    </div>
  );
}

// ─── AlertasFeed (sidebar) ────────────────────────────────────────────────────

function AlertasFeed({ alertas }: { alertas: Alerta[] }) {
  return (
    <>
      <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 10,
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Historial de alertas
        </p>
      </div>
      <div style={{ width: "100%", height: 1, background: "var(--color-border)", flexShrink: 0 }} />
      <div style={{ flex: 1, overflow: "auto", padding: "10px 12px" }}>
        {alertas.length === 0 ? (
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", padding: "16px 0" }}>
            Sin alertas registradas
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {alertas.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: "6px 8px",
                  background: "var(--color-background)",
                  borderRadius: 6,
                  borderLeft: `3px solid ${a.severidad === "alta" ? "var(--color-danger)" : a.severidad === "media" ? "#f97316" : "#6b7280"}`,
                }}
              >
                <p style={{ margin: 0, fontSize: 10, fontWeight: "var(--font-weight-medium)", color: "var(--color-text)", lineHeight: 1.3 }}>
                  {(ALERTAS.TIPOS as Record<string, string>)[a.tipo_alerta] ?? a.tipo_alerta}
                </p>
                <span style={{ fontSize: 9, color: "var(--color-text-muted)" }}>{relativeTime(a.timestamp_alerta)}</span>
                {a.descripcion && (
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--color-text-muted)" }}>{a.descripcion}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── SalaPage (main) ──────────────────────────────────────────────────────────

export default function SalaPage() {
  const { sesionId: sesionIdStr } = useParams({ strict: false }) as { sesionId?: string };
  const sesionId = Number(sesionIdStr ?? 0);
  const navigate = useNavigate();

  const { data: sesionDetalle, isLoading } = useGetSesionDetalle(sesionId);
  const { data: alertasData = [] } = useAlertas(sesionId > 0 ? { sesion: sesionId } : undefined);
  const actualizarEstado = useActualizarEstadoSesion();
  const generarReporte = useGenerarReporte();

  const [elapsed, setElapsed] = useState(0);
  const cssInjectedRef = useRef(false);

  useEffect(() => {
    if (cssInjectedRef.current) return;
    cssInjectedRef.current = true;
    const style = document.createElement("style");
    style.textContent = CSS_ANIMATIONS;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (!sesionDetalle?.fecha_inicio) return;
    const tick = () => {
      setElapsed(Math.floor((Date.now() - new Date(sesionDetalle.fecha_inicio).getTime()) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sesionDetalle?.fecha_inicio]);

  // El candidato dueño de ESTA sesión (no "invitados", que son los de toda la convocatoria).
  const candidato = sesionDetalle?.invitados.find((inv) => inv.id === sesionDetalle.invitacion);
  const metrics =
    candidato && sesionDetalle ? computeMetrics(candidato, alertasData, sesionDetalle.fecha_inicio) : null;

  // JWT de Jitsi self-hosted (en meet.jit.si público no se usa). Se pide a
  // demanda: 1) JWT app de moderador (autenticado) → 2) JWT de Jitsi para
  // la sala del candidato.
  const [jitsiJwt, setJitsiJwt] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!SELF_HOSTED_JITSI || !candidato || sesionId <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        const appToken = await sesionesService.getSupervisorToken(sesionId);
        const res = await fetch(`${env.API_URL}/sesiones/jitsi-token/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: appToken, watch: candidato.id }),
        });
        if (!res.ok) return;
        const d = (await res.json()) as { jwt?: string };
        if (!cancelled && d.jwt) setJitsiJwt(d.jwt);
      } catch {
        /* sin video: queda el placeholder de "conectando" */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sesionId, candidato?.id]);

  const recentAlertas = [...alertasData]
    .sort((a, b) => new Date(b.timestamp_alerta).getTime() - new Date(a.timestamp_alerta).getTime())
    .slice(0, 20);

  function handleFinalizar() {
    if (!sesionDetalle) return;
    actualizarEstado.mutate(
      { sesionId, dto: { nuevo_estado: "finalizada" } },
      { onSuccess: () => void navigate({ to: `/sesiones/${sesionId}/detalle` as never }) },
    );
  }

  function handleGenerarReporte() {
    if (!sesionDetalle) return;
    generarReporte.mutate(sesionId);
  }

  if (isLoading || !sesionDetalle) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--color-background)",
        }}
      >
        <span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
          Cargando sala…
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--color-background)",
        overflow: "hidden",
      }}
    >
      {/* ── Topbar ── */}
      <header
        style={{
          height: 52,
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 16px",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => void navigate({ to: "/sesiones" as never })}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: "var(--font-size-xs)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            whiteSpace: "nowrap",
          }}
        >
          ← Volver
        </button>

        <div style={{ width: 1, height: 20, background: "var(--color-border)", flexShrink: 0 }} />

        <span
          style={{
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-text)",
            fontSize: "var(--font-size-sm)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {sesionDetalle.titulo_entrevista}
        </span>

        <span
          style={{
            fontFamily: "monospace",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-muted)",
            minWidth: 70,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {formatTime(elapsed)}
        </span>

        <button
          onClick={handleFinalizar}
          disabled={actualizarEstado.isPending}
          style={{
            padding: "6px 14px",
            background: "var(--color-danger)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: "var(--font-size-xs)",
            fontWeight: "var(--font-weight-semibold)",
            opacity: actualizarEstado.isPending ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          {actualizarEstado.isPending ? "Finalizando…" : "Finalizar sesión"}
        </button>
      </header>

      {/* ── Body: 1 candidato + alertas al costado ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", justifyContent: "center" }}>
          {metrics ? (
            <CandidatoPanel
              data={metrics}
              jitsiJwt={jitsiJwt}
              onGenerarReporte={handleGenerarReporte}
              generarPending={generarReporte.isPending}
            />
          ) : (
            <div
              style={{
                alignSelf: "center",
                textAlign: "center",
                padding: "64px 0",
                color: "var(--color-text-muted)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              Sin candidato asociado a esta sesión
            </div>
          )}
        </div>

        <aside
          style={{
            width: 260,
            background: "var(--color-surface)",
            borderLeft: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <AlertasFeed alertas={recentAlertas} />
        </aside>
      </div>
    </div>
  );
}
