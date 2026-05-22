import type { Reporte, NivelRiesgo } from "../types";
import type { Alerta, Severidad } from "@/features/alertas";
import { alertasForReporte, getEntrevistaId, cleanResumenGeneral } from "../utils/reporteUtils";

type Props = {
  reporte: Reporte;
  alertas?: Alerta[];
  onClose: () => void;
};

type BadgeVariant = "success" | "warning" | "danger" | "neutral";

function riesgoVariant(nivel: NivelRiesgo | null): BadgeVariant {
  if (nivel === "bajo") return "success";
  if (nivel === "medio") return "warning";
  if (nivel === "alto") return "danger";
  return "neutral";
}

const riesgoColors: Record<BadgeVariant, string> = {
  success: "var(--color-success)",
  warning: "#f59e0b",
  danger: "var(--color-danger)",
  neutral: "var(--color-text-muted)",
};

const SEV_COLORS: Record<Severidad, string> = {
  alta: "var(--color-danger)",
  media: "#f59e0b",
  baja: "var(--color-success)",
};

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div style={{ marginBottom: "var(--space-lg)" }}>
      <h3 style={{
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--font-weight-bold)",
        color: "var(--color-text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: "var(--space-xs)",
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: "var(--font-size-base)",
        color: "var(--color-text)",
        lineHeight: 1.6,
        backgroundColor: "var(--color-surface-hover)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-md)",
      }}>
        {content}
      </p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ReporteDetalleModal({ reporte, alertas = [], onClose }: Props) {
  const variant = riesgoVariant(reporte.nivel_riesgo);
  const riesgoColor = riesgoColors[variant];
  const entrevistaId = getEntrevistaId(reporte);
  const alertasFiltradas = alertasForReporte(alertas, reporte);

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "var(--space-lg)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-xl)",
        width: "100%",
        maxWidth: 700,
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--color-border)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "var(--space-lg) var(--space-xl)",
          borderBottom: "1px solid var(--color-border)",
          gap: "var(--space-md)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
            <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)" }}>
              Reporte #{reporte.id}
            </h2>
            <span style={{
              fontSize: "var(--font-size-sm)", fontWeight: "bold",
              color: riesgoColor,
              backgroundColor: `color-mix(in srgb, ${riesgoColor} 15%, transparent)`,
              borderRadius: "var(--radius-full)",
              padding: "2px 10px",
              border: `1px solid ${riesgoColor}`,
              textTransform: "capitalize",
            }}>
              Riesgo {reporte.nivel_riesgo ?? "—"}
            </span>
            {entrevistaId && (
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
                Entrevista #{entrevistaId}
              </span>
            )}
          </div>
          <button
            id="btn-cerrar-reporte-modal"
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--color-text-muted)", lineHeight: 1, padding: "var(--space-xs)" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "var(--space-xl)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "var(--space-lg)" }}>
            Generado el {new Date(reporte.fecha_creacion).toLocaleDateString("es-ES", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </div>

          <Section title="Resumen general" content={cleanResumenGeneral(reporte.resumen_general)} />
          <Section title="Resumen del participante" content={reporte.resumen_participante} />
          <Section title="Recomendaciones" content={reporte.recomendaciones} />

          {/* Alertas de seguridad de esta sesión */}
          <div style={{ marginTop: "var(--space-lg)" }}>
            <h3 style={{
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "var(--space-md)",
            }}>
              Alertas de seguridad ({alertasFiltradas.length})
            </h3>
            {alertasFiltradas.length === 0 ? (
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                No se registraron alertas para esta sesión.
              </p>
            ) : (
              <div style={{
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "var(--color-surface-hover)" }}>
                      {["Tipo", "Severidad", "Descripción", "Fecha"].map((h) => (
                        <th key={h} style={{
                          padding: "var(--space-xs) var(--space-sm)",
                          textAlign: "left",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                          color: "var(--color-text-muted)",
                          borderBottom: "1px solid var(--color-border)",
                          whiteSpace: "nowrap",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alertasFiltradas.map((a) => (
                      <tr key={a.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "var(--space-xs) var(--space-sm)", fontSize: "0.7rem", fontFamily: "monospace", color: SEV_COLORS[a.severidad], fontWeight: "bold" }}>
                          {a.tipo_alerta}
                        </td>
                        <td style={{ padding: "var(--space-xs) var(--space-sm)", fontSize: "0.7rem", color: SEV_COLORS[a.severidad], fontWeight: "bold" }}>
                          {a.severidad}
                        </td>
                        <td style={{ padding: "var(--space-xs) var(--space-sm)", fontSize: "0.7rem", color: "var(--color-text)", maxWidth: 220 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.descripcion}>
                            {a.descripcion}
                          </span>
                        </td>
                        <td style={{ padding: "var(--space-xs) var(--space-sm)", fontSize: "0.7rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                          {formatDate(a.timestamp_alerta)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "var(--space-md) var(--space-xl)",
          borderTop: "1px solid var(--color-border)",
          display: "flex", justifyContent: "flex-end",
        }}>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-muted)",
              fontSize: "var(--font-size-sm)",
              padding: "var(--space-sm) var(--space-lg)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
