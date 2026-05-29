import { useState } from "react";
import { createPortal } from "react-dom";
import { Badge, Button, Spinner } from "@/shared/components/ui";
import { ENTREVISTAS, PRUEBAS } from "@/config/constants";
import { useGetPruebas } from "@/features/exams";
import {
  useGetPruebasEntrevista,
  useRemoverAsignacion,
  useGetInvitadosPorEntrevista,
} from "../hooks/useEntrevistas";
import type { Entrevista, EstadoAsignacion, EstadoEntrevista, PruebaEntrevista } from "../types";
import AsignarPruebaModal from "./AsignarPruebaModal";

const INV_AVATAR_COLORS = ["#1d4ed8", "#7c3aed", "#0891b2", "#be185d", "#15803d", "#b45309"];

const INV_ESTADO_BADGE: Record<string, "neutral" | "info" | "success" | "danger"> = {
  pendiente: "neutral",
  aceptado: "info",
  completado: "success",
  rechazado: "danger",
};

const INV_ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  aceptado: "Aceptado",
  completado: "Completado",
  rechazado: "Rechazado",
};

function invInitials(nombre: string): string {
  return nombre.split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
}

type EntrevistaDetailDrawerProps = {
  entrevista: Entrevista;
  onClose: () => void;
};

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const metaLabelStyle: React.CSSProperties = {
  fontSize: "var(--font-size-sm)",
  color: "var(--color-text-muted)",
  marginBottom: "var(--space-xs)",
};

const metaValueStyle: React.CSSProperties = {
  fontSize: "var(--font-size-base)",
  color: "var(--color-text)",
  fontWeight: "var(--font-weight-medium)",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EntrevistaDetailDrawer({
  entrevista,
  onClose,
}: EntrevistaDetailDrawerProps) {
  const { data: asignaciones, isLoading } = useGetPruebasEntrevista(entrevista.id);
  const { data: pruebas } = useGetPruebas();
  const { data: invitados = [], isLoading: loadingInvitados } = useGetInvitadosPorEntrevista(entrevista.id);
  const removerAsignacion = useRemoverAsignacion();
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);
  const [copiadoInv, setCopiadoInv] = useState<Record<number, boolean>>({});
  const [copiadoTodosInv, setCopiadoTodosInv] = useState(false);

  const handleCopiarInvitado = (id: number, link: string) => {
    void navigator.clipboard.writeText(link).then(() => {
      setCopiadoInv((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiadoInv((prev) => ({ ...prev, [id]: false })), 2000);
    });
  };

  const handleCopiarTodosInv = () => {
    const text = invitados
      .filter((inv) => inv.link_invitacion)
      .map((inv) => `${inv.nombre}: ${inv.link_invitacion ?? ""}`)
      .join("\n");
    void navigator.clipboard.writeText(text).then(() => {
      setCopiadoTodosInv(true);
      setTimeout(() => setCopiadoTodosInv(false), 2000);
    });
  };

  const pruebaMap = new Map((pruebas ?? []).map((p) => [p.id, p]));
  const asignacionesList = asignaciones ?? [];
  const assignedPruebaIds = asignacionesList.map((a) => a.prueba);

  const handleRemover = (asignacion: PruebaEntrevista) => {
    if (window.confirm(ENTREVISTAS.CONFIRM_REMOVER_PRUEBA)) {
      removerAsignacion.mutate({ id: asignacion.id, entrevistaId: entrevista.id });
    }
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-xl)",
      }}
    >
      <div
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-xl)",
          width: "100%",
          maxWidth: "780px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-lg)",
        }}
      >
        {/* Encabezado */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "var(--space-md)",
          }}
        >
          <div>
            <p style={metaLabelStyle}>{ENTREVISTAS.MODAL_DETALLE_TITLE}</p>
            <h2
              style={{
                fontSize: "var(--font-size-xl)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-text)",
              }}
            >
              {entrevista.titulo}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              fontSize: "var(--font-size-xl)",
              cursor: "pointer",
              lineHeight: 1,
              padding: "var(--space-xs)",
              flexShrink: 0,
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Badge de estado */}
        <div>
          <Badge
            variant={
              ENTREVISTAS.ESTADO_BADGE[entrevista.estado as EstadoEntrevista] as BadgeVariant
            }
          >
            {ENTREVISTAS.ESTADO_LABELS[entrevista.estado as EstadoEntrevista]}
          </Badge>
        </div>

        {/* Descripción */}
        <div>
          <p style={metaLabelStyle}>{ENTREVISTAS.LABEL_DESCRIPCION}</p>
          <p
            style={{
              fontSize: "var(--font-size-base)",
              color: "var(--color-text)",
              lineHeight: 1.6,
            }}
          >
            {entrevista.descripcion}
          </p>
        </div>

        {/* Métricas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "var(--space-md)",
            backgroundColor: "var(--color-background)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md)",
          }}
        >
          <div>
            <p style={metaLabelStyle}>{ENTREVISTAS.COL_FECHA}</p>
            <p style={metaValueStyle}>{formatDate(entrevista.fecha_programada)}</p>
          </div>
          <div>
            <p style={metaLabelStyle}>Creada</p>
            <p style={metaValueStyle}>{formatDate(entrevista.fecha_creacion)}</p>
          </div>
        </div>

        {/* Sección pruebas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-md)",
            }}
          >
            <p
              style={{
                fontSize: "var(--font-size-base)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-text)",
              }}
            >
              {ENTREVISTAS.DETAIL_PRUEBAS_TITLE}
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsAsignarOpen(true)}>
              {ENTREVISTAS.BTN_ASIGNAR_PRUEBA}
            </Button>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-lg)" }}>
              <Spinner size="md" />
            </div>
          ) : asignacionesList.length === 0 ? (
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "var(--font-size-sm)",
                textAlign: "center",
                padding: "var(--space-lg)",
                backgroundColor: "var(--color-background)",
                borderRadius: "var(--radius-md)",
                border: "1px dashed var(--color-border)",
              }}
            >
              {ENTREVISTAS.DETAIL_NO_PRUEBAS}
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-xs)",
                backgroundColor: "var(--color-background)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                overflow: "hidden",
              }}
            >
              {asignacionesList.map((asignacion) => {
                const prueba = pruebaMap.get(asignacion.prueba);
                return (
                  <div
                    key={asignacion.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-sm)",
                      padding: "var(--space-sm) var(--space-md)",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    {/* Tipo badge */}
                    {prueba && (
                      <Badge variant={PRUEBAS.TIPO_BADGE[prueba.tipo] as BadgeVariant}>
                        {PRUEBAS.TIPO_LABELS[prueba.tipo]}
                      </Badge>
                    )}

                    {/* Título */}
                    <span
                      style={{
                        flex: 1,
                        fontSize: "var(--font-size-sm)",
                        color: "var(--color-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={prueba?.titulo ?? String(asignacion.prueba)}
                    >
                      {prueba?.titulo ?? `Prueba #${asignacion.prueba}`}
                    </span>

                    {/* Estado asignación */}
                    <Badge
                      variant={
                        ENTREVISTAS.ESTADO_ASIGNACION_BADGE[
                          asignacion.estado as EstadoAsignacion
                        ] as BadgeVariant
                      }
                    >
                      {ENTREVISTAS.ESTADO_ASIGNACION_LABELS[asignacion.estado as EstadoAsignacion]}
                    </Badge>

                    {/* Observaciones */}
                    {asignacion.observaciones && (
                      <span
                        style={{
                          fontSize: "var(--font-size-xs, 0.75rem)",
                          color: "var(--color-text-muted)",
                          maxWidth: 120,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={asignacion.observaciones}
                      >
                        {asignacion.observaciones}
                      </span>
                    )}

                    {/* Remover */}
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={removerAsignacion.isPending}
                      onClick={() => handleRemover(asignacion)}
                    >
                      {ENTREVISTAS.BTN_REMOVER}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sección links de invitados */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)" }}>
              Links de invitados
            </p>
            {invitados.some((inv) => inv.link_invitacion) && (
              <button
                onClick={handleCopiarTodosInv}
                style={{
                  padding: "4px 12px",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  fontSize: "var(--font-size-xs)",
                  color: copiadoTodosInv ? "var(--color-success)" : "var(--color-text-muted)",
                  fontFamily: "inherit",
                  transition: "color 0.15s",
                }}
              >
                {copiadoTodosInv ? "✓ Copiado" : "Copiar todos"}
              </button>
            )}
          </div>

          {loadingInvitados ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-lg)" }}>
              <Spinner size="md" />
            </div>
          ) : invitados.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", textAlign: "center", padding: "var(--space-lg)", backgroundColor: "var(--color-background)", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)" }}>
              No hay invitados para esta entrevista
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)", backgroundColor: "var(--color-background)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
              {invitados.map((inv, idx) => (
                <div
                  key={inv.id}
                  style={{ padding: "var(--space-sm) var(--space-md)", borderBottom: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {/* Fila superior: avatar + nombre + email + badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: INV_AVATAR_COLORS[idx % INV_AVATAR_COLORS.length],
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)",
                      color: "#fff", flexShrink: 0,
                    }}>
                      {invInitials(inv.nombre)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {inv.nombre}
                      </p>
                      <p style={{ margin: 0, fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {inv.email}
                      </p>
                    </div>
                    <Badge variant={INV_ESTADO_BADGE[inv.estado] ?? "neutral"}>
                      {INV_ESTADO_LABEL[inv.estado] ?? inv.estado}
                    </Badge>
                  </div>

                  {/* Fila inferior: link + botón copiar */}
                  {inv.link_invitacion ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                      <input
                        readOnly
                        value={inv.link_invitacion}
                        style={{
                          flex: 1,
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--color-text-muted)",
                          fontSize: "var(--font-size-xs)",
                          padding: "4px 8px",
                          fontFamily: "monospace",
                          outline: "none",
                          cursor: "text",
                        }}
                      />
                      <button
                        onClick={() => handleCopiarInvitado(inv.id, inv.link_invitacion!)}
                        style={{
                          padding: "4px 12px",
                          background: "transparent",
                          border: `1px solid ${copiadoInv[inv.id] ? "var(--color-success)" : "var(--color-primary)"}`,
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                          fontSize: "var(--font-size-xs)",
                          color: copiadoInv[inv.id] ? "var(--color-success)" : "var(--color-primary)",
                          fontFamily: "inherit",
                          flexShrink: 0,
                          transition: "color 0.15s, border-color 0.15s",
                        }}
                      >
                        {copiadoInv[inv.id] ? "✓ Copiado" : "Copiar"}
                      </button>
                    </div>
                  ) : (
                    <Badge variant="neutral">Sin link generado</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose}>
            {ENTREVISTAS.BTN_CERRAR}
          </Button>
        </div>
      </div>

      {isAsignarOpen && (
        <AsignarPruebaModal
          entrevistaId={entrevista.id}
          assignedPruebaIds={assignedPruebaIds}
          onClose={() => setIsAsignarOpen(false)}
        />
      )}
    </div>,
    document.body
  );
}
