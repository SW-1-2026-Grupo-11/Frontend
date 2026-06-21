import { useState } from "react";
import { MainLayout } from "@/shared/components/layout";
import { useCurrentUser, useLogout } from "@/features/auth";
import { ReportesTable, ReporteDetalleModal, useGetReportes, useGenerarReporte } from "@/features/reportes";
import { useGetAlertas } from "@/features/alertas";
import { useGetSesiones } from "@/features/sesiones";
import type { Reporte } from "@/features/reportes";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nivelColor(nivel: string | null): string {
  if (nivel === "alto") return "var(--color-danger)";
  if (nivel === "medio") return "#f97316";
  return "var(--color-success)";
}

function scoreColor(value: number, invert = false): string {
  const v = invert ? 100 - value : value;
  if (v >= 85) return "var(--color-success)";
  if (v >= 70) return "#f97316";
  return "var(--color-danger)";
}

function deriveScores(reporte: Reporte): { atencion: number; sospecha: number } {
  if (reporte.puntaje_atencion != null && reporte.puntaje_sospecha != null) {
    return { atencion: reporte.puntaje_atencion, sospecha: reporte.puntaje_sospecha };
  }
  const nivel = reporte.nivel_riesgo;
  if (nivel === "alto") return { atencion: 40, sospecha: 60 };
  if (nivel === "medio") return { atencion: 70, sospecha: 30 };
  return { atencion: 95, sospecha: 5 };
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>{label}</span>
        <span style={{ fontSize: "var(--font-size-xs)", fontWeight: "bold", color }}>{value}/100</span>
      </div>
      <div style={{ height: 6, background: "var(--color-border)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const { data: reportes, isLoading: loadingReportes, isError: errorReportes } = useGetReportes();
  const { data: alertas } = useGetAlertas();
  const { data: sesiones = [] } = useGetSesiones();
  const generarMutation = useGenerarReporte();

  const [selectedReporte, setSelectedReporte] = useState<Reporte | undefined>(undefined);
  const [selectedSesionId, setSelectedSesionId] = useState<number | "">("");
  const [reporteGenerado, setReporteGenerado] = useState<Reporte | null>(null);
  const [errorIA, setErrorIA] = useState<string | null>(null);

  const sectionTitle: React.CSSProperties = {
    fontSize: "var(--font-size-xl)",
    fontWeight: "var(--font-weight-bold)",
    color: "var(--color-text)",
    marginBottom: "var(--space-md)",
  };

  const handleGenerar = async () => {
    if (!selectedSesionId) return;
    setErrorIA(null);
    setReporteGenerado(null);
    try {
      const r = await generarMutation.mutateAsync(Number(selectedSesionId));
      setReporteGenerado(r);
    } catch {
      setErrorIA("No se pudo generar el reporte. Intenta de nuevo.");
    }
  };

  // Se genera el informe de una SESIÓN (1 candidato = 1 sesión = 1 informe).
  const sesionesFiltradas = sesiones.filter((s) => s.estado === "finalizada");

  return (
    <MainLayout userName={user?.username} onLogout={logout}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-xl)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)" }}>
            Reportes y Alertas de Proctoring
          </h1>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", marginTop: "var(--space-xs)" }}>
            Cada informe de IA incluye solo las alertas de su entrevista. Expande una fila (▶) o abre el detalle completo.
          </p>
        </div>
        <span style={{
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-muted)",
          backgroundColor: "var(--color-surface-hover)",
          borderRadius: "var(--radius-full)",
          padding: "var(--space-xs) var(--space-md)",
          border: "1px solid var(--color-border)",
        }}>
          {reportes?.length ?? 0} reportes · {alertas?.length ?? 0} alertas
        </span>
      </div>

      {/* ── Generar reporte con IA ──────────────────────────────────────────── */}
      <section style={{ marginBottom: "var(--space-xl)" }}>
        <h2 style={sectionTitle}>Generar reporte con IA</h2>
        <div style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-lg)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-md)",
        }}>
          {/* Select + botón */}
          <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={{
                display: "block",
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-text-muted)",
                marginBottom: "var(--space-xs)",
              }}>
                Selecciona una sesión finalizada
              </label>
              <select
                value={selectedSesionId}
                onChange={(e) => {
                  setSelectedSesionId(e.target.value === "" ? "" : Number(e.target.value));
                  setReporteGenerado(null);
                  setErrorIA(null);
                }}
                style={{
                  width: "100%",
                  padding: "var(--space-sm) var(--space-md)",
                  backgroundColor: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text)",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                <option value="">— Elige una sesión —</option>
                {sesionesFiltradas.map((s) => (
                  <option key={s.id} value={s.id}>
                    Sesión #{s.id} · {s.estado}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => void handleGenerar()}
              disabled={!selectedSesionId || generarMutation.isPending}
              style={{
                padding: "var(--space-sm) var(--space-lg)",
                backgroundColor: !selectedSesionId || generarMutation.isPending
                  ? "var(--color-border)"
                  : "var(--color-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-semibold)",
                fontFamily: "inherit",
                cursor: !selectedSesionId || generarMutation.isPending ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                minWidth: 200,
                transition: "background-color 0.15s",
              }}
            >
              {generarMutation.isPending ? "Analizando con IA…" : "Generar reporte con IA"}
            </button>
          </div>

          {/* Error */}
          {errorIA && (
            <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-danger)" }}>
              {errorIA}
            </p>
          )}

          {/* Resultado */}
          {reporteGenerado && (() => {
            const { atencion, sospecha } = deriveScores(reporteGenerado);
            return (
              <div style={{
                padding: "var(--space-lg)",
                background: "var(--color-background)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-md)",
              }}>
                {/* Cabecera resultado */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text)" }}>
                    Reporte generado
                  </span>
                  {reporteGenerado.nivel_riesgo && (
                    <span style={{
                      padding: "3px 12px",
                      borderRadius: 12,
                      fontSize: "var(--font-size-xs)",
                      fontWeight: "bold",
                      background: `${nivelColor(reporteGenerado.nivel_riesgo)}20`,
                      color: nivelColor(reporteGenerado.nivel_riesgo),
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      Nivel de riesgo: {reporteGenerado.nivel_riesgo}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginLeft: "auto" }}>
                    {new Date(reporteGenerado.fecha_creacion).toLocaleString("es-ES", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Puntajes */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-md)" }}>
                  <ScoreBar
                    label="Puntaje atención"
                    value={atencion}
                    color={scoreColor(atencion)}
                  />
                  <ScoreBar
                    label="Puntaje sospecha"
                    value={sospecha}
                    color={scoreColor(sospecha, true)}
                  />
                </div>

                {/* Resumen general */}
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: "bold", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Resumen general
                  </p>
                  <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {reporteGenerado.resumen_general}
                  </p>
                </div>

                {/* Recomendaciones */}
                {reporteGenerado.recomendaciones && (
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: "bold", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Recomendaciones
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                      {reporteGenerado.recomendaciones.split("\n").filter(Boolean).map((rec, i) => (
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
      </section>

      {/* ── Tabla de informes históricos ────────────────────────────────────── */}
      <section>
        <h2 style={sectionTitle}>Informes de IA</h2>
        <ReportesTable
          reportes={reportes}
          alertas={alertas}
          isLoading={loadingReportes}
          isError={errorReportes}
          onVerDetalle={setSelectedReporte}
        />
      </section>

      {selectedReporte && (
        <ReporteDetalleModal
          reporte={selectedReporte}
          alertas={alertas}
          onClose={() => setSelectedReporte(undefined)}
        />
      )}
    </MainLayout>
  );
}
