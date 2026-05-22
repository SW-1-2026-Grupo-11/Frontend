import { Fragment, useState } from "react";
import { Badge, Spinner } from "@/shared/components/ui";
import type { Alerta } from "@/features/alertas";
import type { Reporte, NivelRiesgo } from "../types";
import { alertasForReporte, getEntrevistaId, cleanResumenGeneral } from "../utils/reporteUtils";

type Props = {
  reportes: Reporte[] | undefined;
  alertas?: Alerta[];
  isLoading: boolean;
  isError: boolean;
  onVerDetalle: (reporte: Reporte) => void;
};

type BadgeVariant = "success" | "warning" | "danger" | "neutral";

function riesgoVariant(nivel: NivelRiesgo | null): BadgeVariant {
  if (nivel === "bajo") return "success";
  if (nivel === "medio") return "warning";
  if (nivel === "alto") return "danger";
  return "neutral";
}

function riesgoLabel(nivel: NivelRiesgo | null): string {
  if (!nivel) return "Sin nivel";
  return nivel.charAt(0).toUpperCase() + nivel.slice(1);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAlertaDate(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const thStyle: React.CSSProperties = {
  padding: "var(--space-sm) var(--space-md)",
  textAlign: "left",
  fontWeight: "var(--font-weight-bold)",
  fontSize: "var(--font-size-sm)",
  color: "var(--color-text-muted)",
  borderBottom: "1px solid var(--color-border)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "var(--space-sm) var(--space-md)",
  fontSize: "var(--font-size-sm)",
  color: "var(--color-text)",
  borderBottom: "1px solid var(--color-border)",
  verticalAlign: "middle",
};

const SEV_COLORS = {
  alta: "var(--color-danger)",
  media: "#f59e0b",
  baja: "var(--color-success)",
} as const;

function ReporteAlertasNested({ alertas }: { alertas: Alerta[] }) {
  if (alertas.length === 0) {
    return (
      <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", fontStyle: "italic", margin: 0 }}>
        Sin alertas de seguridad para esta entrevista.
      </p>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ backgroundColor: "var(--color-surface-hover)" }}>
          {["Tipo", "Severidad", "Descripción", "Fecha"].map((h) => (
            <th
              key={h}
              style={{
                padding: "var(--space-xs) var(--space-sm)",
                textAlign: "left",
                fontSize: "0.7rem",
                fontWeight: "bold",
                color: "var(--color-text-muted)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {alertas.map((a) => (
          <tr key={a.id}>
            <td style={{ padding: "var(--space-xs) var(--space-sm)", fontSize: "0.75rem", fontFamily: "monospace" }}>
              {a.tipo_alerta}
            </td>
            <td
              style={{
                padding: "var(--space-xs) var(--space-sm)",
                fontSize: "0.75rem",
                fontWeight: "bold",
                color: SEV_COLORS[a.severidad] ?? "var(--color-text)",
              }}
            >
              {a.severidad}
            </td>
            <td style={{ padding: "var(--space-xs) var(--space-sm)", fontSize: "0.75rem", maxWidth: 280 }}>
              <span
                style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                title={a.descripcion}
              >
                {a.descripcion}
              </span>
            </td>
            <td style={{ padding: "var(--space-xs) var(--space-sm)", fontSize: "0.75rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
              {formatAlertaDate(a.timestamp_alerta)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ReportesTable({ reportes, alertas = [], isLoading, isError, onVerDetalle }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-surface-hover)" }}>
              <th style={thStyle} />
              <th style={thStyle}>#</th>
              <th style={thStyle}>Resumen general</th>
              <th style={thStyle}>Entrevista</th>
              <th style={thStyle}>Nivel de riesgo</th>
              <th style={thStyle}>Alertas</th>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: "center", padding: "var(--space-xl)" }}>
                  <Spinner size="md" />
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "var(--color-danger)", padding: "var(--space-xl)" }}>
                  Error al cargar los reportes
                </td>
              </tr>
            )}
            {!isLoading && !isError && (!reportes || reportes.length === 0) && (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "var(--color-text-muted)", padding: "var(--space-xl)" }}>
                  No hay reportes registrados
                </td>
              </tr>
            )}
            {!isLoading && !isError && reportes && reportes.map((r) => {
              const entrevistaId = getEntrevistaId(r);
              const alertasReporte = alertasForReporte(alertas, r);
              const isExpanded = expandedId === r.id;

              return (
                <Fragment key={r.id}>
                  <tr style={{ transition: "background-color var(--transition-fast)" }}>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(r.id)}
                        aria-expanded={isExpanded}
                        title={isExpanded ? "Ocultar alertas" : "Ver alertas de este informe"}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--color-text-muted)",
                          fontSize: "0.85rem",
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        {isExpanded ? "▼" : "▶"}
                      </button>
                    </td>
                    <td style={tdStyle}>{r.id}</td>
                    <td style={{ ...tdStyle, maxWidth: 280 }}>
                      <span
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={cleanResumenGeneral(r.resumen_general)}
                      >
                        {cleanResumenGeneral(r.resumen_general)}
                      </span>
                    </td>
                    <td style={tdStyle}>{entrevistaId ? `#${entrevistaId}` : "—"}</td>
                    <td style={tdStyle}>
                      <Badge variant={riesgoVariant(r.nivel_riesgo)}>
                        {riesgoLabel(r.nivel_riesgo)}
                      </Badge>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: "var(--font-size-sm)",
                          color: alertasReporte.length > 0 ? "var(--color-text)" : "var(--color-text-muted)",
                        }}
                      >
                        {alertasReporte.length}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{formatDate(r.fecha_creacion)}</td>
                    <td style={tdStyle}>
                      <button
                        id={`btn-detalle-reporte-${r.id}`}
                        onClick={() => onVerDetalle(r)}
                        style={{
                          background: "none",
                          border: "1px solid var(--color-primary)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--color-primary)",
                          fontSize: "var(--font-size-sm)",
                          padding: "var(--space-xs) var(--space-sm)",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} style={{ padding: "var(--space-md) var(--space-lg)", backgroundColor: "var(--color-surface-hover)" }}>
                        <div style={{ marginBottom: "var(--space-sm)", fontSize: "var(--font-size-sm)", fontWeight: "bold", color: "var(--color-text-muted)" }}>
                          Alertas de seguridad — Entrevista {entrevistaId ? `#${entrevistaId}` : "sin asignar"}
                        </div>
                        <ReporteAlertasNested alertas={alertasReporte} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
