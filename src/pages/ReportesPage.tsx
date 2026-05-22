import { useState } from "react";
import { MainLayout } from "@/shared/components/layout";
import { useCurrentUser, useLogout } from "@/features/auth";
import { ReportesTable, ReporteDetalleModal, useGetReportes } from "@/features/reportes";
import { useGetAlertas } from "@/features/alertas";
import type { Reporte } from "@/features/reportes";

export default function ReportesPage() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const { data: reportes, isLoading: loadingReportes, isError: errorReportes } = useGetReportes();
  const { data: alertas } = useGetAlertas();
  const [selectedReporte, setSelectedReporte] = useState<Reporte | undefined>(undefined);

  const sectionTitle: React.CSSProperties = {
    fontSize: "var(--font-size-xl)",
    fontWeight: "var(--font-weight-bold)",
    color: "var(--color-text)",
    marginBottom: "var(--space-md)",
  };

  const handleVerDetalle = (reporte: Reporte) => {
    setSelectedReporte(reporte);
  };

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

      <section>
        <h2 style={sectionTitle}>Informes de IA</h2>
        <ReportesTable
          reportes={reportes}
          alertas={alertas}
          isLoading={loadingReportes}
          isError={errorReportes}
          onVerDetalle={handleVerDetalle}
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
