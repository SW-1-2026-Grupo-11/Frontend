import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useGetSesionDetalle, useActualizarEstadoSesion } from "@/features/sesiones";
import type { InvitadoSesion } from "@/features/sesiones";
import { useAlertas } from "@/features/alertas";
import type { Alerta, Severidad } from "@/features/alertas";
import { useGenerarReporte } from "@/features/reportes";
import { ALERTAS } from "@/config/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

type ParticipantData = {
  id: number;
  nombre: string;
  email: string;
  alertCount: number;
  severity: Severidad | null;
  emotion: string;
  gazeOk: boolean;
  integridad: number;
  mirada: number;
  tiempoSeg: number;
  tabCount: number;
  sinRostro: number;
  celular: number;
  alertas: Alerta[];
};

type TabView = "camaras" | "pantallas" | "ambas";

// ─── Constants ───────────────────────────────────────────────────────────────

const EMOTION_COLORS: Record<string, string> = {
  Neutral: "var(--color-success)",
  Nervioso: "#eab308",
  Estresado: "var(--color-danger)",
  Confiado: "var(--color-primary)",
};

const CSS_ANIMATIONS = `
@keyframes sala-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
@keyframes sala-slidein {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.sala-card-danger { animation: sala-pulse 2s ease-in-out infinite; }
.sala-detail-panel { animation: sala-slidein 0.2s ease-out; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inferEmotion(alertas: Alerta[]): string {
  if (!alertas.length) return "Neutral";
  const last = alertas[alertas.length - 1];
  const t = last.tipo_alerta;
  if (t === "uso_de_celular" || t === "multiples_rostros" || t === "pantalla_compartida") return "Estresado";
  if (t === "sin_rostro" || t === "cambio_ventana" || t === "mirada_fuera_pantalla" || t === "posible_celular_o_lectura") return "Nervioso";
  return "Neutral";
}

function computeMetrics(inv: InvitadoSesion, all: Alerta[], fechaInicio: string): ParticipantData {
  const alertas = all.filter((a) => a.participante === inv.id);
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
    emotion: inferEmotion(alertas),
    gazeOk: mirada === 0,
    integridad,
    mirada,
    tiempoSeg: Math.floor((Date.now() - new Date(fechaInicio).getTime()) / 1000),
    tabCount: alertas.filter((a) => a.tipo_alerta === "cambio_ventana").length,
    sinRostro: alertas.filter((a) => a.tipo_alerta === "sin_rostro").length,
    celular: alertas.filter(
      (a) => a.tipo_alerta === "uso_de_celular" || a.tipo_alerta === "posible_celular_o_lectura",
    ).length,
    alertas,
  };
}

function scoreColor(n: number): string {
  if (n < 70) return "var(--color-danger)";
  if (n < 85) return "#f97316";
  return "var(--color-success)";
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

// ─── ParticipantCard ──────────────────────────────────────────────────────────

function ParticipantCard({
  data,
  tab,
  selected,
  onClick,
}: {
  data: ParticipantData;
  tab: TabView;
  selected: boolean;
  onClick: () => void;
}) {
  const isDanger = data.severity === "alta";
  const showCamera = tab === "camaras" || tab === "ambas";
  const showScreen = tab === "pantallas" || tab === "ambas";

  return (
    <div
      className={isDanger ? "sala-card-danger" : undefined}
      onClick={onClick}
      style={{
        background: "var(--color-surface)",
        border: `2px solid ${selected ? "var(--color-primary)" : isDanger ? "var(--color-danger)" : "var(--color-border)"}`,
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: selected ? "0 0 0 3px rgba(99,102,241,0.18)" : "none",
      }}
    >
      {/* Video placeholder area */}
      <div style={{ display: "flex", gap: 0 }}>
        {showCamera && (
          <div style={{
            flex: 1,
            aspectRatio: "16/9",
            background: `linear-gradient(135deg, ${avatarColor(data.id)}22, ${avatarColor(data.id)}44)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            borderRight: showScreen ? "1px solid var(--color-border)" : undefined,
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: avatarColor(data.id),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "var(--font-weight-bold)",
              fontSize: "var(--font-size-base)",
            }}>
              {initials(data.nombre)}
            </div>
            <span style={{
              position: "absolute",
              top: 6,
              left: 6,
              fontSize: 10,
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              padding: "2px 5px",
              borderRadius: 4,
            }}>
              CAM
            </span>
            {!data.gazeOk && (
              <span style={{
                position: "absolute",
                bottom: 6,
                left: 6,
                fontSize: 10,
                background: "#eab30888",
                color: "#713f12",
                padding: "2px 5px",
                borderRadius: 4,
              }}>
                Mirada desviada
              </span>
            )}
          </div>
        )}
        {showScreen && (
          <div style={{
            flex: 1,
            aspectRatio: "16/9",
            background: "#1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={1.5}>
              <rect x="2" y="4" width="20" height="14" rx="2" />
              <path d="M8 20h8M12 18v2" />
            </svg>
            <span style={{
              position: "absolute",
              top: 6,
              left: 6,
              fontSize: 10,
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              padding: "2px 5px",
              borderRadius: 4,
            }}>
              PANTALLA
            </span>
            {data.tabCount > 0 && (
              <span style={{
                position: "absolute",
                bottom: 6,
                left: 6,
                fontSize: 10,
                background: "#f9731644",
                color: "#c2410c",
                padding: "2px 5px",
                borderRadius: 4,
              }}>
                {data.tabCount} cambios
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info row */}
      <div style={{ padding: "8px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{
            fontSize: "var(--font-size-xs)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "60%",
          }}>
            {data.nombre}
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: "var(--font-weight-semibold)",
            color: EMOTION_COLORS[data.emotion] ?? "var(--color-text-muted)",
            background: `${EMOTION_COLORS[data.emotion] ?? "#6b7280"}18`,
            padding: "2px 7px",
            borderRadius: 12,
          }}>
            {data.emotion}
          </span>
        </div>

        {/* Integridad bar */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>Integridad</span>
            <span style={{ fontSize: 11, fontWeight: "var(--font-weight-semibold)", color: scoreColor(data.integridad) }}>
              {data.integridad}%
            </span>
          </div>
          <div style={{ height: 4, background: "var(--color-border)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${data.integridad}%`,
              background: scoreColor(data.integridad),
              borderRadius: 2,
              transition: "width 0.3s",
            }} />
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {data.sinRostro > 0 && (
            <Tag color="var(--color-danger)">{data.sinRostro} sin rostro</Tag>
          )}
          {data.celular > 0 && (
            <Tag color="#f97316">{data.celular} celular</Tag>
          )}
          {data.tabCount > 0 && (
            <Tag color="#eab308">{data.tabCount} tabs</Tag>
          )}
          {data.alertCount === 0 && (
            <Tag color="var(--color-success)">Sin alertas</Tag>
          )}
        </div>
      </div>
    </div>
  );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10,
      color,
      background: `${color}18`,
      padding: "1px 6px",
      borderRadius: 10,
      fontWeight: "var(--font-weight-medium)",
    }}>
      {children}
    </span>
  );
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────

function DetailPanel({
  participant,
  onClose,
  onGenerarReporte,
  generarPending,
}: {
  participant: ParticipantData;
  onClose: () => void;
  onGenerarReporte: (p: ParticipantData) => void;
  generarPending: boolean;
}) {
  const sorted = [...participant.alertas].sort(
    (a, b) => new Date(b.timestamp_alerta).getTime() - new Date(a.timestamp_alerta).getTime(),
  );

  return (
    <>
      {/* Header */}
      <div style={{
        padding: "12px 14px",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: avatarColor(participant.id),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: "var(--font-weight-bold)",
          fontSize: "var(--font-size-xs)",
          flexShrink: 0,
        }}>
          {initials(participant.nombre)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: "var(--font-weight-semibold)", fontSize: "var(--font-size-xs)", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {participant.nombre}
          </p>
          <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {participant.email}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 2, fontSize: 16, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Score + stats */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 32, fontWeight: "var(--font-weight-bold)", color: scoreColor(participant.integridad) }}>
            {participant.integridad}
          </span>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>/100</span>
          <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--color-text-muted)" }}>Índice de integridad</p>
        </div>
        <div style={{ height: 6, background: "var(--color-border)", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
          <div style={{
            height: "100%",
            width: `${participant.integridad}%`,
            background: scoreColor(participant.integridad),
            borderRadius: 3,
          }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
          {[
            { label: "Alertas totales", value: participant.alertCount },
            { label: "Mirada desviada", value: participant.mirada },
            { label: "Cambios de tab", value: participant.tabCount },
            { label: "Celular detectado", value: participant.celular },
            { label: "Sin rostro", value: participant.sinRostro },
            { label: "Tiempo en sala", value: formatTime(participant.tiempoSeg) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-muted)" }}>{label}</p>
              <p style={{ margin: 0, fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Alert list */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 14px" }}>
        <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Historial de alertas
        </p>
        {sorted.length === 0 ? (
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textAlign: "center", padding: "16px 0" }}>
            Sin alertas registradas
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sorted.map((a) => (
              <div key={a.id} style={{
                padding: "6px 8px",
                background: "var(--color-background)",
                borderRadius: 6,
                borderLeft: `3px solid ${a.severidad === "alta" ? "var(--color-danger)" : a.severidad === "media" ? "#f97316" : "var(--color-text-muted)"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, color: "var(--color-text)", fontWeight: "var(--font-weight-medium)" }}>
                    {(ALERTAS.TIPOS as Record<string, string>)[a.tipo_alerta] ?? a.tipo_alerta}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--color-text-muted)", flexShrink: 0, marginLeft: 6 }}>
                    {relativeTime(a.timestamp_alerta)}
                  </span>
                </div>
                {a.descripcion && (
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--color-text-muted)" }}>
                    {a.descripcion}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer action */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--color-border)", flexShrink: 0 }}>
        <button
          onClick={() => onGenerarReporte(participant)}
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
          {generarPending ? "Generando…" : "Generar reporte IA"}
        </button>
      </div>
    </>
  );
}

// ─── RightSidebar ─────────────────────────────────────────────────────────────

function RightSidebar({
  alertas,
  participants,
}: {
  alertas: Alerta[];
  participants: ParticipantData[];
}) {
  const nameById = Object.fromEntries(participants.map((p) => [p.id, p.nombre]));

  const highRisk = participants.filter((p) => p.integridad < 70).length;
  const medRisk = participants.filter((p) => p.integridad >= 70 && p.integridad < 85).length;
  const okCount = participants.filter((p) => p.integridad >= 85).length;

  return (
    <>
      {/* Summary chips */}
      <div style={{ padding: "12px 12px 0", flexShrink: 0 }}>
        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Resumen
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          <SummaryChip color="var(--color-success)" label="OK" value={okCount} />
          <SummaryChip color="#f97316" label="Medio" value={medRisk} />
          <SummaryChip color="var(--color-danger)" label="Alto riesgo" value={highRisk} />
        </div>
      </div>

      <div style={{ width: "100%", height: 1, background: "var(--color-border)", flexShrink: 0 }} />

      {/* Alert feed */}
      <div style={{ flex: 1, overflow: "auto", padding: "10px 12px" }}>
        <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Alertas recientes
        </p>
        {alertas.length === 0 ? (
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", padding: "16px 0" }}>
            Sin alertas
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {alertas.map((a) => (
              <div key={a.id} style={{
                padding: "6px 8px",
                background: "var(--color-background)",
                borderRadius: 6,
                borderLeft: `3px solid ${a.severidad === "alta" ? "var(--color-danger)" : a.severidad === "media" ? "#f97316" : "#6b7280"}`,
              }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: "var(--font-weight-medium)", color: "var(--color-text)", lineHeight: 1.3 }}>
                  {(ALERTAS.TIPOS as Record<string, string>)[a.tipo_alerta] ?? a.tipo_alerta}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                  <span style={{ fontSize: 9, color: "var(--color-text-muted)" }}>
                    {nameById[a.participante] ?? `#${a.participante}`}
                  </span>
                  <span style={{ fontSize: 9, color: "var(--color-text-muted)" }}>
                    {relativeTime(a.timestamp_alerta)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SummaryChip({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 8px",
      background: `${color}18`,
      borderRadius: 12,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color, fontWeight: "var(--font-weight-semibold)" }}>{value}</span>
      <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{label}</span>
    </div>
  );
}

// ─── SalaPage (main) ──────────────────────────────────────────────────────────

export default function SalaPage() {
  const { sesionId: sesionIdStr } = useParams({ strict: false }) as { sesionId?: string };
  const sesionId = Number(sesionIdStr ?? 0);
  const navigate = useNavigate();

  const { data: sesionDetalle, isLoading } = useGetSesionDetalle(sesionId);
  const { data: alertasData = [] } = useAlertas(
    sesionDetalle ? { entrevista: sesionDetalle.entrevista } : undefined,
  );
  const actualizarEstado = useActualizarEstadoSesion();
  const generarReporte = useGenerarReporte();

  const [tab, setTab] = useState<TabView>("ambas");
  const [selectedId, setSelectedId] = useState<number | null>(null);
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

  const participants: ParticipantData[] = sesionDetalle
    ? sesionDetalle.invitados.map((inv) => computeMetrics(inv, alertasData, sesionDetalle.fecha_inicio))
    : [];

  const selectedParticipant = participants.find((p) => p.id === selectedId) ?? null;

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

  function handleGenerarReporte(p: ParticipantData) {
    if (!sesionDetalle) return;
    generarReporte.mutate({
      entrevista_id: String(sesionDetalle.entrevista),
      participante_id: String(p.id),
      puntaje_total: p.integridad,
      total_alertas: p.alertCount,
      nivel_riesgo: p.integridad < 70 ? "alto" : p.integridad < 85 ? "medio" : "bajo",
    });
  }

  if (isLoading || !sesionDetalle) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--color-background)",
      }}>
        <span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
          Cargando sala…
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "var(--color-background)",
      overflow: "hidden",
    }}>
      {/* ── Topbar ── */}
      <header style={{
        height: 52,
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 16px",
        flexShrink: 0,
        zIndex: 10,
      }}>
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

        <span style={{
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--color-text)",
          fontSize: "var(--font-size-sm)",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {sesionDetalle.titulo_entrevista}
        </span>

        {/* View tabs */}
        <div style={{
          display: "flex",
          gap: 2,
          background: "var(--color-background)",
          borderRadius: 8,
          padding: 3,
          flexShrink: 0,
        }}>
          {(["camaras", "pantallas", "ambas"] as TabView[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: "var(--font-size-xs)",
                fontWeight: tab === t ? "var(--font-weight-semibold)" : "var(--font-weight-normal)",
                background: tab === t ? "var(--color-surface)" : "transparent",
                color: tab === t ? "var(--color-primary)" : "var(--color-text-muted)",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s",
              }}
            >
              {t === "camaras" ? "Cámaras" : t === "pantallas" ? "Pantallas" : "Ambas"}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: "var(--color-border)", flexShrink: 0 }} />

        <span style={{
          fontFamily: "monospace",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-muted)",
          minWidth: 70,
          textAlign: "center",
          flexShrink: 0,
        }}>
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

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Candidate grid + detail panel */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Grid */}
          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
            {participants.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "64px 0",
                color: "var(--color-text-muted)",
                fontSize: "var(--font-size-sm)",
              }}>
                No hay participantes en esta sesión
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}>
                {participants.map((p) => (
                  <ParticipantCard
                    key={p.id}
                    data={p}
                    tab={tab}
                    selected={selectedId === p.id}
                    onClick={() => setSelectedId((prev) => (prev === p.id ? null : p.id))}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedParticipant && (
            <div
              className="sala-detail-panel"
              style={{
                width: 320,
                background: "var(--color-surface)",
                borderLeft: "1px solid var(--color-border)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <DetailPanel
                participant={selectedParticipant}
                onClose={() => setSelectedId(null)}
                onGenerarReporte={handleGenerarReporte}
                generarPending={generarReporte.isPending}
              />
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <aside style={{
          width: 220,
          background: "var(--color-surface)",
          borderLeft: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          <RightSidebar alertas={recentAlertas} participants={participants} />
        </aside>
      </div>
    </div>
  );
}
