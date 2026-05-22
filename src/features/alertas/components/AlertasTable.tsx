import type { Alerta, Severidad } from "../types";

type Props = {
  alertas: Alerta[] | undefined;
  isLoading: boolean;
};

const SEV_COLORS: Record<Severidad, string> = {
  alta: "var(--color-danger)",
  media: "#f59e0b",
  baja: "var(--color-success)",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    year: "numeric", month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const th: React.CSSProperties = {
  padding: "var(--space-sm) var(--space-md)",
  textAlign: "left",
  fontSize: "var(--font-size-sm)",
  fontWeight: "var(--font-weight-bold)",
  color: "var(--color-text-muted)",
  borderBottom: "1px solid var(--color-border)",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "var(--space-sm) var(--space-md)",
  fontSize: "var(--font-size-sm)",
  borderBottom: "1px solid var(--color-border)",
  color: "var(--color-text)",
  verticalAlign: "middle",
};

export default function AlertasTable({ alertas, isLoading }: Props) {
  return (
    <div style={{
      backgroundColor: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-surface-hover)" }}>
              <th style={th}>Tipo</th>
              <th style={th}>Severidad</th>
              <th style={th}>Descripción</th>
              <th style={th}>Entrevista ID</th>
              <th style={th}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} style={{ ...td, textAlign: "center", padding: "var(--space-xl)" }}>Cargando alertas...</td></tr>
            )}
            {!isLoading && (!alertas || alertas.length === 0) && (
              <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: "var(--color-text-muted)", padding: "var(--space-xl)" }}>No hay alertas registradas</td></tr>
            )}
            {!isLoading && alertas && alertas.map((a) => (
              <tr key={a.id}>
                <td style={td}>
                  <span style={{
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    color: SEV_COLORS[a.severidad] ?? "var(--color-text)",
                    fontWeight: "bold",
                  }}>
                    {a.tipo_alerta}
                  </span>
                </td>
                <td style={td}>
                  <span style={{
                    color: SEV_COLORS[a.severidad] ?? "var(--color-text)",
                    fontWeight: "bold",
                    fontSize: "var(--font-size-sm)",
                  }}>
                    {a.severidad}
                  </span>
                </td>
                <td style={{ ...td, maxWidth: 360 }}>
                  <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={a.descripcion}>
                    {a.descripcion}
                  </span>
                </td>
                <td style={td}>{a.entrevista}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>{formatDate(a.timestamp_alerta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
