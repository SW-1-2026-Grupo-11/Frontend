import { useState } from "react";
import { Button, Input, Modal } from "@/shared/components/ui";
import { USUARIOS } from "@/config/constants";
import { useCreateUsuario, useUpdateUsuario } from "../hooks/useUsuarios";
import type { CreateUsuarioDto, EstadoUsuario, Rol, UpdateUsuarioDto, Usuario } from "../types";

type UsuarioModalProps = {
  onClose: () => void;
  usuario?: Usuario;
};

type FormState = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  telefono: string;
  password: string;
  rol: Rol;
  estado: EstadoUsuario;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(state: FormState, isEdit: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!state.username.trim()) errors.username = USUARIOS.VALIDATION_REQUIRED;
  if (!state.first_name.trim()) errors.first_name = USUARIOS.VALIDATION_REQUIRED;
  if (!state.last_name.trim()) errors.last_name = USUARIOS.VALIDATION_REQUIRED;
  if (!state.email.trim()) {
    errors.email = USUARIOS.VALIDATION_REQUIRED;
  } else if (!EMAIL_REGEX.test(state.email)) {
    errors.email = USUARIOS.VALIDATION_EMAIL;
  }
  if (!isEdit && !state.password.trim()) errors.password = USUARIOS.VALIDATION_REQUIRED;
  if (!state.rol) errors.rol = USUARIOS.VALIDATION_REQUIRED;
  return errors;
}

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

export default function UsuarioModal({ onClose, usuario }: UsuarioModalProps) {
  const isEdit = Boolean(usuario);
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();

  const [form, setForm] = useState<FormState>({
    username: usuario?.username ?? "",
    first_name: usuario?.first_name ?? "",
    last_name: usuario?.last_name ?? "",
    email: usuario?.email ?? "",
    telefono: usuario?.telefono ?? "",
    password: "",
    rol: usuario?.rol ?? "evaluador",
    estado: usuario?.estado ?? "activo",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const isPending = createUsuario.isPending || updateUsuario.isPending;

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateForm(form, isEdit);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (isEdit && usuario) {
      const dto: UpdateUsuarioDto = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        telefono: form.telefono,
        rol: form.rol,
        estado: form.estado,
      };
      updateUsuario.mutate({ id: usuario.id, dto }, { onSuccess: onClose });
    } else {
      const dto: CreateUsuarioDto = {
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        telefono: form.telefono,
        password: form.password,
        rol: form.rol,
      };
      createUsuario.mutate(dto, { onSuccess: onClose });
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="480px">
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
            {isEdit ? USUARIOS.MODAL_EDITAR_TITLE : USUARIOS.MODAL_CREAR_TITLE}
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
          {!isEdit && (
            <Input
              label="Usuario"
              name="username"
              value={form.username}
              error={formErrors.username}
              variant={formErrors.username ? "error" : "default"}
              autoComplete="username"
              onChange={(e) => handleChange("username", e.target.value)}
            />
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
            <Input
              label={USUARIOS.LABEL_NOMBRE}
              name="first_name"
              value={form.first_name}
              error={formErrors.first_name}
              variant={formErrors.first_name ? "error" : "default"}
              onChange={(e) => handleChange("first_name", e.target.value)}
            />
            <Input
              label={USUARIOS.LABEL_APELLIDO}
              name="last_name"
              value={form.last_name}
              error={formErrors.last_name}
              variant={formErrors.last_name ? "error" : "default"}
              onChange={(e) => handleChange("last_name", e.target.value)}
            />
          </div>

          <Input
            label={USUARIOS.LABEL_EMAIL}
            name="email"
            type="email"
            value={form.email}
            error={formErrors.email}
            variant={formErrors.email ? "error" : "default"}
            autoComplete="off"
            onChange={(e) => handleChange("email", e.target.value)}
          />

          <Input
            label={USUARIOS.LABEL_TELEFONO}
            name="telefono"
            type="tel"
            value={form.telefono}
            error={formErrors.telefono}
            variant={formErrors.telefono ? "error" : "default"}
            onChange={(e) => handleChange("telefono", e.target.value)}
          />

          {!isEdit && (
            <Input
              label={USUARIOS.LABEL_PASSWORD}
              name="password"
              type="password"
              value={form.password}
              error={formErrors.password}
              variant={formErrors.password ? "error" : "default"}
              autoComplete="new-password"
              onChange={(e) => handleChange("password", e.target.value)}
            />
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            <label
              htmlFor="rol"
              style={{
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-text-muted)",
              }}
            >
              {USUARIOS.LABEL_ROL}
            </label>
            <select
              id="rol"
              value={form.rol}
              onChange={(e) => handleChange("rol", e.target.value as Rol)}
              style={{
                ...selectStyle,
                borderColor: formErrors.rol ? "var(--color-danger)" : "var(--color-border)",
              }}
            >
              {USUARIOS.ROLES.map((rol) => (
                <option key={rol} value={rol}>
                  {USUARIOS.ROL_LABELS[rol as Rol]}
                </option>
              ))}
            </select>
            {formErrors.rol && (
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-danger)" }}>
                {formErrors.rol}
              </span>
            )}
          </div>

          {isEdit && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
              <label
                htmlFor="estado"
                style={{
                  fontSize: "var(--font-size-sm)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--color-text-muted)",
                }}
              >
                {USUARIOS.LABEL_ESTADO}
              </label>
              <select
                id="estado"
                value={form.estado}
                onChange={(e) => handleChange("estado", e.target.value as EstadoUsuario)}
                style={selectStyle}
              >
                {USUARIOS.ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {USUARIOS.ESTADO_LABELS[estado as EstadoUsuario]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "var(--space-sm)",
              justifyContent: "flex-end",
              marginTop: "var(--space-sm)",
            }}
          >
            <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>
              {USUARIOS.BTN_CANCELAR}
            </Button>
            <Button variant="primary" type="submit" loading={isPending}>
              {isEdit ? USUARIOS.BTN_GUARDAR : USUARIOS.BTN_CREAR}
            </Button>
          </div>
        </form>
    </Modal>
  );
}
