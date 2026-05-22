import { useNavigate } from "@tanstack/react-router";
import { MainLayout } from "@/shared/components/layout";
import { useCurrentUser, useLogout } from "@/features/auth";
import { useGetEntrevistas } from "@/features/interviews";
import type { Entrevista } from "@/features/interviews";
import { UI } from "@/config/constants";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });
}

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador",
  programada: "Programada",
  en_proceso: "En proceso",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

const ESTADO_COLOR: Record<string, string> = {
  borrador: "var(--color-text-muted)",
  programada: "#3b82f6",
  en_proceso: "#10b981",
  finalizada: "var(--color-success)",
  cancelada: "var(--color-danger)",
};

export default function HomePage() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const { data: entrevistas, isLoading } = useGetEntrevistas();

  const handleIniciar = (entrevista: Entrevista) => {
    const sessionId = crypto.randomUUID();
    navigate({
      to: `/session/${sessionId}`,
      search: { entrevistaId: entrevista.id, participanteId: user?.id ?? 1 },
    } as any);
  };


  const activas = entrevistas?.filter((e) =>
    e.estado === "programada" || e.estado === "en_proceso" || e.estado === "borrador"
  ) ?? [];

  return (
    <MainLayout userName={user?.username} onLogout={logout}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-xl)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)" }}>
            📡 {UI.HOME_TITLE}
          </h1>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", marginTop: "var(--space-xs)" }}>
            Selecciona una entrevista activa para iniciar la supervisión en tiempo real.
          </p>
        </div>
      </div>

      {/* Lista de entrevistas */}
      <div style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-surface-hover)" }}>
              {["#", "Título", "Estado", "Fecha programada", "Acción"].map((h) => (
                <th key={h} style={{
                  padding: "var(--space-sm) var(--space-md)",
                  textAlign: "left",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: "var(--font-weight-bold)",
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
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ padding: "var(--space-xl)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
                  Cargando entrevistas...
                </td>
              </tr>
            )}
            {!isLoading && activas.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "var(--space-xl)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
                  No hay entrevistas activas disponibles
                </td>
              </tr>
            )}
            {activas.map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "var(--space-sm) var(--space-md)", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
                  {e.id}
                </td>
                <td style={{ padding: "var(--space-sm) var(--space-md)", fontSize: "var(--font-size-sm)", color: "var(--color-text)", fontWeight: "var(--font-weight-medium)" }}>
                  {e.titulo}
                </td>
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <span style={{
                    fontSize: "var(--font-size-xs, 0.75rem)",
                    fontWeight: "bold",
                    color: ESTADO_COLOR[e.estado] ?? "var(--color-text-muted)",
                    backgroundColor: `color-mix(in srgb, ${ESTADO_COLOR[e.estado] ?? "gray"} 15%, transparent)`,
                    padding: "2px 10px",
                    borderRadius: "var(--radius-full)",
                    border: `1px solid ${ESTADO_COLOR[e.estado] ?? "var(--color-border)"}`,
                    textTransform: "capitalize",
                  }}>
                    {ESTADO_LABEL[e.estado] ?? e.estado}
                  </span>
                </td>
                <td style={{ padding: "var(--space-sm) var(--space-md)", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                  {formatDate(e.fecha_programada)}
                </td>
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <button
                    id={`btn-iniciar-entrevista-${e.id}`}
                    onClick={() => handleIniciar(e)}
                    style={{
                      padding: "var(--space-xs) var(--space-md)",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: "var(--font-weight-medium)",
                      color: "#fff",
                      backgroundColor: "var(--color-primary)",
                      border: "none",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Iniciar supervisión
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}
