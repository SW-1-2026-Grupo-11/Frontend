import { useNavigate } from "@tanstack/react-router";
import { MainLayout } from "@/shared/components/layout";
import { useCurrentUser, useLogout } from "@/features/auth";
import { useGetSesiones } from "@/features/sesiones";
import { SESIONES, UI } from "@/config/constants";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ESTADO_COLOR: Record<string, string> = {
  activa: "var(--color-primary)",
  iniciada: "#f59e0b",
  finalizada: "var(--color-success)",
};

export default function SesionesPage() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const { data: sesiones = [], isLoading, isError } = useGetSesiones();

  return (
    <MainLayout userName={user?.username} onLogout={logout}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "var(--space-xl)",
      }}>
        <div>
          <h1 style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-text)",
            margin: 0,
          }}>
            {UI.SESIONES_TITLE}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
            Gestiona y monitorea las sesiones de entrevista
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-background)" }}>
              {["#", "Entrevista", "Room", "Estado", "Inicio", "Fin", "Acciones"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--color-text-muted)",
                    borderBottom: "1px solid var(--color-border)",
                    whiteSpace: "nowrap",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
                  Cargando sesiones…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--color-danger)", fontSize: "var(--font-size-sm)" }}>
                  {SESIONES.ERROR}
                </td>
              </tr>
            )}
            {!isLoading && !isError && sesiones.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
                  {SESIONES.EMPTY}
                </td>
              </tr>
            )}
            {sesiones.map((s) => (
              <tr
                key={s.id}
                style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.1s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--color-background)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
              >
                <td style={{ padding: "10px 14px", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
                  {s.id}
                </td>
                <td style={{ padding: "10px 14px", fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>
                  #{s.entrevista}
                </td>
                <td style={{ padding: "10px 14px", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                  {s.room_name.length > 24 ? `${s.room_name.slice(0, 24)}…` : s.room_name}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 12,
                    fontSize: "var(--font-size-xs)",
                    fontWeight: "var(--font-weight-semibold)",
                    background: `${ESTADO_COLOR[s.estado] ?? "#6b7280"}18`,
                    color: ESTADO_COLOR[s.estado] ?? "var(--color-text-muted)",
                  }}>
                    {SESIONES.ESTADO_LABELS[s.estado] ?? s.estado}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                  {formatDate(s.fecha_inicio)}
                </td>
                <td style={{ padding: "10px 14px", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                  {formatDate(s.fecha_fin)}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => void navigate({ to: `/sesiones/${s.id}/detalle` as never })}
                      style={{
                        padding: "4px 10px",
                        background: "transparent",
                        color: "var(--color-primary)",
                        border: "1px solid var(--color-primary)",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: "var(--font-size-xs)",
                        fontWeight: "var(--font-weight-medium)",
                      }}
                    >
                      Ver detalle
                    </button>
                    {s.estado !== "finalizada" && (
                      <button
                        onClick={() => void navigate({ to: `/sesiones/${s.id}/sala` as never })}
                        style={{
                          padding: "4px 10px",
                          background: "var(--color-primary)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: "var(--font-size-xs)",
                          fontWeight: "var(--font-weight-medium)",
                        }}
                      >
                        {SESIONES.BTN_UNIRSE}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}
