import { useState } from "react";
import { Badge, Button } from "@/shared/components/ui";
import { PRUEBAS } from "@/config/constants";
import { useGetPruebaById, useGetSecciones, useUpdatePrueba } from "../hooks/useExams";
import PruebaDatosStep from "./PruebaDatosStep";
import PruebaContenidoStep from "./PruebaContenidoStep";
import PruebaVistaPreviaStep from "./PruebaVistaPreviaStep";
import type { EstadoPrueba, Prueba } from "../types";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const STEPS = [
  { id: 1, label: "Datos generales" },
  { id: 2, label: "Secciones y preguntas" },
  { id: 3, label: "Vista previa" },
] as const;

function stepperBtnStyle(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: "var(--space-sm) var(--space-md)",
    fontSize: "var(--font-size-sm)",
    fontWeight: active ? "var(--font-weight-bold)" : "var(--font-weight-medium)",
    color: disabled ? "var(--color-text-muted)" : active ? "var(--color-primary)" : "var(--color-text)",
    backgroundColor: active ? "var(--color-surface-hover)" : "transparent",
    border: "none",
    borderBottom: active ? "2px solid var(--color-primary)" : "2px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}

type Props = {
  pruebaId?: number;
  initialStep?: number;
  onPruebaCreated?: (prueba: Prueba) => void;
};

export default function PruebaEditor({ pruebaId, initialStep, onPruebaCreated }: Props) {
  const [step, setStep] = useState(initialStep ?? 1);
  const { data: prueba, isLoading } = useGetPruebaById(pruebaId ?? 0);
  const { data: secciones = [] } = useGetSecciones(pruebaId ?? 0);
  const updatePrueba = useUpdatePrueba();

  if (pruebaId && isLoading) {
    return <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>Cargando…</p>;
  }

  const contenidoHabilitado = Boolean(prueba);
  const tieneContenido = secciones.some((s) => s.preguntas.length > 0);

  const cambiarEstado = (estado: EstadoPrueba) => {
    if (!prueba) return;
    updatePrueba.mutate({ id: prueba.id, dto: { estado } });
  };

  const handleDatosSaved = (saved: Prueba) => {
    if (!pruebaId) {
      onPruebaCreated?.(saved);
      return;
    }
    setStep(2);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      {/* ── Barra de estado/publicación: visible en todos los pasos ── */}
      {prueba && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--space-sm)",
            backgroundColor: "var(--color-background)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-sm) var(--space-md)",
          }}
        >
          <Badge variant={PRUEBAS.ESTADO_BADGE[prueba.estado as EstadoPrueba] as BadgeVariant}>
            {PRUEBAS.ESTADO_LABELS[prueba.estado as EstadoPrueba]}
          </Badge>

          {prueba.estado === "borrador" && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <span
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: tieneContenido ? "var(--color-success)" : "var(--color-warning)",
                }}
              >
                {tieneContenido ? "✓ Lista para publicar" : "✗ Agregá al menos una sección con una pregunta"}
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => cambiarEstado("activa")}
                disabled={!tieneContenido || updatePrueba.isPending}
              >
                Publicar
              </Button>
            </div>
          )}

          {prueba.estado === "activa" && (
            <Button variant="secondary" size="sm" onClick={() => cambiarEstado("inactiva")} disabled={updatePrueba.isPending}>
              Pasar a inactiva
            </Button>
          )}

          {prueba.estado === "inactiva" && (
            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <Button variant="primary" size="sm" onClick={() => cambiarEstado("activa")} disabled={updatePrueba.isPending}>
                Reactivar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => cambiarEstado("archivada")} disabled={updatePrueba.isPending}>
                Archivar
              </Button>
            </div>
          )}

          {prueba.estado === "archivada" && (
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", fontStyle: "italic" }}>
              Archivada — sin acciones
            </span>
          )}
        </div>
      )}

      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
        {STEPS.map((s) => {
          const disabled = s.id > 1 && !contenidoHabilitado;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => !disabled && setStep(s.id)}
              disabled={disabled}
              style={stepperBtnStyle(step === s.id, disabled)}
              title={disabled ? "Primero guardá los datos generales" : undefined}
            >
              {s.id}. {s.label}
            </button>
          );
        })}
      </div>

      {step === 1 && <PruebaDatosStep prueba={prueba} onSaved={handleDatosSaved} />}
      {step === 2 && prueba && <PruebaContenidoStep prueba={prueba} />}
      {step === 3 && prueba && <PruebaVistaPreviaStep prueba={prueba} />}
    </div>
  );
}
