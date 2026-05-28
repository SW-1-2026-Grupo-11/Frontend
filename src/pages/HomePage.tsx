import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MainLayout } from "@/shared/components/layout";
import { useCurrentUser, useLogout } from "@/features/auth";
import { useGetEntrevistas, entrevistasService } from "@/features/interviews";
import type { Entrevista } from "@/features/interviews";
import { UI } from "@/config/constants";

interface InvitadoJwtPayload {
  moderator?: boolean;
}

function fixLink(link: string): string {
  try {
    const url = new URL(link);
    return `${window.location.origin}${url.pathname}${url.search}`;
  } catch {
    return link;
  }
}

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

  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleIniciar = async (entrevista: Entrevista) => {
    setLoadingId(entrevista.id);
    setErrorMsg(null);

    try {
      // a) Busca primero en localStorage (guardado al crear la sesión)
      const linkGuardado = localStorage.getItem(
        `link_supervisor_entrevista_${entrevista.id}`,
      );
      if (linkGuardado) {
        window.location.href = fixLink(linkGuardado);
        return;
      }

      // b) Fallback: decodifica JWT de cada invitado buscando moderator=true
      const invitados = await entrevistasService.getInvitadosPorEntrevista(entrevista.id);

      let supervisorLink: string | null = null;

      for (const inv of invitados) {
        if (!inv.link_invitacion) continue;
        try {
          const url = new URL(inv.link_invitacion);
          const jwtToken = url.searchParams.get("token");
          if (!jwtToken) continue;
          const payload = JSON.parse(atob(jwtToken.split(".")[1])) as InvitadoJwtPayload;
          if (payload.moderator === true) {
            supervisorLink = fixLink(inv.link_invitacion);
            break;
          }
        } catch {
          // JWT inválido o URL malformada — saltar
        }
      }

      if (supervisorLink) {
        window.location.href = supervisorLink;
      } else {
        setErrorMsg(
          "Crea una sesión para esta entrevista primero desde el menú Sesiones.",
        );
        void navigate({ to: "/sesiones/nueva" });
      }
    } catch {
      setErrorMsg("Error al obtener los links. Intenta de nuevo.");
    } finally {
      setLoadingId(null);
    }
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

      {/* Mensaje de error */}
      {errorMsg && (
        <div
          style={{
            marginBottom: "var(--space-md)",
            padding: "var(--space-sm) var(--space-md)",
            backgroundColor: "rgba(220,38,38,0.08)",
            border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-sm)",
          }}
        >
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 16, lineHeight: 1, padding: "0 4px" }}
          >
            ×
          </button>
        </div>
      )}

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
                    onClick={() => void handleIniciar(e)}
                    disabled={loadingId !== null}
                    style={{
                      padding: "var(--space-xs) var(--space-md)",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: "var(--font-weight-medium)",
                      color: "#fff",
                      backgroundColor: loadingId === e.id ? "#6b7280" : "var(--color-primary)",
                      border: "none",
                      borderRadius: "var(--radius-md)",
                      cursor: loadingId !== null ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      whiteSpace: "nowrap",
                      opacity: loadingId !== null && loadingId !== e.id ? 0.5 : 1,
                      minWidth: 140,
                    }}
                  >
                    {loadingId === e.id ? "Buscando link..." : "Iniciar supervisión"}
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
