import { useState } from "react";
import { createPortal } from "react-dom";
import { Button, Input } from "@/shared/components/ui";
import { ENTREVISTAS } from "@/config/constants";
import { useCurrentUser } from "@/features/auth";
import {
  useCancelarEntrevista,
  useCreateEntrevista,
  useUpdateEntrevista,
} from "../hooks/useEntrevistas";
import type {
  CreateEntrevistaDto,
  Entrevista,
  UpdateEntrevistaDto,
} from "../types";

type EntrevistaModalProps = {
  onClose: () => void;
  entrevista?: Entrevista;
};

type FormState = {
  titulo: string;
  descripcion: string;
  fecha_programada: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function validateForm(state: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!state.titulo.trim()) errors.titulo = ENTREVISTAS.VALIDATION_REQUIRED;
  if (!state.descripcion.trim()) errors.descripcion = ENTREVISTAS.VALIDATION_REQUIRED;
  return errors;
}

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xs)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "var(--font-size-sm)",
  fontWeight: "var(--font-weight-medium)",
  color: "var(--color-text-muted)",
};

const selectStyle: React.CSSProperties = {
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-sm) var(--space-md)",
  fontSize: "var(--font-size-base)",
  fontFamily: "inherit",
  width: "100%",
  outline: "none",
  cursor: "pointer",
};

export default function EntrevistaModal({ onClose, entrevista }: EntrevistaModalProps) {
  const isEdit = Boolean(entrevista);
  const { data: currentUser } = useCurrentUser();
  const createEntrevista = useCreateEntrevista();
  const updateEntrevista = useUpdateEntrevista();
  const cancelar = useCancelarEntrevista();

  const [form, setForm] = useState<FormState>({
    titulo: entrevista?.titulo ?? "",
    descripcion: entrevista?.descripcion ?? "",
    fecha_programada: entrevista?.fecha_programada ?? "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const isPending = createEntrevista.isPending || updateEntrevista.isPending;

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // El `estado` ya NO se setea a mano: es derivado (o cancelar). Solo se editan
    // los datos de la convocatoria.
    const base = {
      titulo: form.titulo,
      descripcion: form.descripcion,
      fecha_programada: form.fecha_programada || null,
    };

    if (isEdit && entrevista) {
      const dto: UpdateEntrevistaDto = base;
      updateEntrevista.mutate({ id: entrevista.id, dto }, { onSuccess: onClose });
    } else {
      const dto: CreateEntrevistaDto = { ...base, creada_por: currentUser!.id };
      createEntrevista.mutate(dto, { onSuccess: onClose });
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
          maxWidth: "520px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-lg)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--font-size-xl)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-text)",
            }}
          >
            {isEdit ? ENTREVISTAS.MODAL_EDITAR_TITLE : ENTREVISTAS.MODAL_CREAR_TITLE}
          </h2>
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
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}
        >
          <Input
            label={ENTREVISTAS.LABEL_TITULO}
            name="titulo"
            value={form.titulo}
            error={formErrors.titulo}
            variant={formErrors.titulo ? "error" : "default"}
            onChange={(e) => handleChange("titulo", e.target.value)}
          />

          {/* Estado: derivado (read-only) + acción Cancelar. Ya NO es un selector
              libre — el estado se calcula solo según la fecha; lo único manual es
              cancelar la convocatoria. */}
          {isEdit && entrevista && (
            <div style={fieldStyle}>
              <label style={labelStyle}>{ENTREVISTAS.LABEL_ESTADO}</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: "var(--font-weight-medium)",
                    color: "var(--color-text)",
                  }}
                >
                  {ENTREVISTAS.ESTADO_LABELS[entrevista.estado_efectivo]}
                </span>
                {entrevista.estado_efectivo !== "cancelada" &&
                  entrevista.estado_efectivo !== "finalizada" && (
                    <Button
                      variant="danger"
                      size="sm"
                      type="button"
                      loading={cancelar.isPending}
                      onClick={() => cancelar.mutate(entrevista.id, { onSuccess: onClose })}
                    >
                      Cancelar convocatoria
                    </Button>
                  )}
              </div>
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
                El estado se calcula automáticamente según la fecha; solo podés cancelarla.
              </span>
            </div>
          )}

          {/* Fecha programada */}
          <div style={fieldStyle}>
            <label htmlFor="fecha_programada" style={labelStyle}>
              {ENTREVISTAS.LABEL_FECHA_PROGRAMADA}
            </label>
            <input
              id="fecha_programada"
              type="datetime-local"
              value={form.fecha_programada}
              onChange={(e) => handleChange("fecha_programada", e.target.value)}
              style={{
                ...selectStyle,
                cursor: "default",
                colorScheme: "dark",
              }}
            />
          </div>

          {/* Descripción */}
          <div style={fieldStyle}>
            <label htmlFor="descripcion" style={labelStyle}>
              {ENTREVISTAS.LABEL_DESCRIPCION}
            </label>
            <textarea
              id="descripcion"
              value={form.descripcion}
              rows={3}
              onChange={(e) => handleChange("descripcion", e.target.value)}
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
                border: `1px solid ${formErrors.descripcion ? "var(--color-danger)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-md)",
                padding: "var(--space-sm) var(--space-md)",
                fontSize: "var(--font-size-base)",
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
                width: "100%",
              }}
            />
            {formErrors.descripcion && (
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-danger)" }}>
                {formErrors.descripcion}
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "var(--space-sm)",
              justifyContent: "flex-end",
              marginTop: "var(--space-sm)",
            }}
          >
            <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>
              {ENTREVISTAS.BTN_CANCELAR}
            </Button>
            <Button variant="primary" type="submit" loading={isPending} disabled={!currentUser}>
              {isEdit ? ENTREVISTAS.BTN_GUARDAR : ENTREVISTAS.BTN_CREAR}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
