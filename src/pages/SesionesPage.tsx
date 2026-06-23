import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MainLayout } from "@/shared/components/layout";
import { useCurrentUser, useLogout } from "@/features/auth";
import {
  useGetEntrevistaById,
  useGetInvitadosPorEntrevista,
  EntrevistaDetailDrawer,
} from "@/features/interviews";
import { useGetSesiones } from "@/features/sesiones";
import type { Sesion } from "@/features/sesiones";
import { Spinner } from "@/shared/components/ui";
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

const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: "var(--font-size-xs)",
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--color-text-muted)",
  borderBottom: "1px solid var(--color-border)",
  whiteSpace: "nowrap",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: "var(--font-size-sm)",
};

// ─── Fila de grupo: 1 convocatoria + sus sesiones (1 por candidato) ───────────

function GrupoConvocatoria({ entrevistaId, sesiones }: { entrevistaId: number; sesiones: Sesion[] }) {
  const navigate = useNavigate();
  const [verDetalle, setVerDetalle] = useState(false);
  const { data: entrevista, isLoading: loadingEntrevista } = useGetEntrevistaById(entrevistaId);
  const { data: invitados = [] } = useGetInvitadosPorEntrevista(entrevistaId);

  const nombrePorInvitacion = new Map(invitados.map((inv) => [inv.id, inv.nombre]));

  return (
    <>
      <tr style={{ backgroundColor: "var(--color-background)", borderBottom: "1px solid var(--color-border)" }}>
        <td colSpan={4} style={{ ...tdStyle, fontWeight: "var(--font-weight-semibold)", color: "var(--color-text)" }}>
          {loadingEntrevista ? <Spinner size="sm" /> : entrevista?.titulo ?? `Convocatoria #${entrevistaId}`}
          <span style={{ marginLeft: 8, fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontWeight: "var(--font-weight-medium)" }}>
            ({sesiones.length} {sesiones.length === 1 ? "candidato" : "candidatos"})
          </span>
        </td>
        <td style={{ ...tdStyle, textAlign: "right" }}>
          <button
            disabled={!entrevista}
            onClick={() => setVerDetalle(true)}
            style={{
              padding: "4px 10px",
              background: "transparent",
              color: "var(--color-primary)",
              border: "1px solid var(--color-primary)",
              borderRadius: 6,
              cursor: entrevista ? "pointer" : "not-allowed",
              opacity: entrevista ? 1 : 0.5,
              fontSize: "var(--font-size-xs)",
              fontWeight: "var(--font-weight-medium)",
            }}
          >
            Ver detalle
          </button>
        </td>
      </tr>

      {sesiones.map((s) => (
        <tr
          key={s.id}
          style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.1s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--color-background)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
        >
          <td style={{ ...tdStyle, paddingLeft: 28, color: "var(--color-text)" }}>
            {s.invitacion != null
              ? nombrePorInvitacion.get(s.invitacion) ?? "Candidato sin datos"
              : <em style={{ color: "var(--color-text-muted)" }}>Sin candidato</em>}
          </td>
          <td style={tdStyle}>
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
          <td style={{ ...tdStyle, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
            {formatDate(s.fecha_inicio)}
          </td>
          <td style={{ ...tdStyle, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
            {formatDate(s.fecha_fin)}
          </td>
          <td style={{ ...tdStyle, textAlign: "right" }}>
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
          </td>
        </tr>
      ))}

      {verDetalle && entrevista && (
        <EntrevistaDetailDrawer entrevista={entrevista} onClose={() => setVerDetalle(false)} />
      )}
    </>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SesionesPage() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const { data: sesiones = [], isLoading, isError } = useGetSesiones();

  // Agrupa por convocatoria preservando el orden (las sesiones ya llegan
  // ordenadas por fecha_inicio descendente desde el backend).
  const grupos = new Map<number, Sesion[]>();
  for (const s of sesiones) {
    const grupo = grupos.get(s.entrevista);
    if (grupo) grupo.push(s);
    else grupos.set(s.entrevista, [s]);
  }

  return (
    <MainLayout userName={user?.username} onLogout={logout}>
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
            Gestiona y monitorea las sesiones de entrevista, agrupadas por convocatoria
          </p>
        </div>
      </div>

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
              {["Candidato", "Estado", "Inicio", "Fin", "Acciones"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
                  Cargando sesiones…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "var(--color-danger)", fontSize: "var(--font-size-sm)" }}>
                  {SESIONES.ERROR}
                </td>
              </tr>
            )}
            {!isLoading && !isError && grupos.size === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
                  {SESIONES.EMPTY}
                </td>
              </tr>
            )}
            {[...grupos.entries()].map(([entrevistaId, sesionesDeGrupo]) => (
              <GrupoConvocatoria key={entrevistaId} entrevistaId={entrevistaId} sesiones={sesionesDeGrupo} />
            ))}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}
