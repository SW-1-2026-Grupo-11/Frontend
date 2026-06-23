import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/shared/components/layout";
import { useCurrentUser, useLogout } from "@/features/auth";
import { useProgramarEntrevista } from "@/features/interviews";
import type {
  ProgramarEntrevistaDto,
  InvitadoProgramado,
} from "@/features/interviews";
import { useGetUsuarios } from "@/features/usuarios";
import { useGetPruebas } from "@/features/exams";
import Card from "@/shared/components/ui/Card";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";
import Badge from "@/shared/components/ui/Badge";
import Spinner from "@/shared/components/ui/Spinner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fixLink(link: string): string {
  try {
    const url = new URL(link);
    return `${window.location.origin}${url.pathname}${url.search}`;
  } catch {
    return link;
  }
}

// ─── Tipos locales ────────────────────────────────────────────────────────────

type Candidato = { nombre: string; email: string };

type Toast = { mensaje: string; tipo: "success" | "error" };

type ValidationErrors = {
  titulo?: string;
  prueba?: string;
  evaluador?: string;
  fecha?: string;
  candidatos?: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#1d4ed8",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#15803d",
  "#b45309",
];

const DURACION_OPTIONS = [
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "60 minutos" },
  { value: 90, label: "90 minutos" },
  { value: 120, label: "2 horas" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Estilos reutilizables ────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-sm) var(--space-md)",
  fontSize: "var(--font-size-base)",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  cursor: "pointer",
  boxSizing: "border-box" as const,
};

const labelStyle: React.CSSProperties = {
  fontSize: "var(--font-size-sm)",
  fontWeight: "var(--font-weight-medium)",
  color: "var(--color-text-muted)",
  display: "block",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xs)",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function SesionNuevaPage() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  // ── Estado del formulario ──
  const [titulo, setTitulo] = useState("");
  const [pruebaId, setPruebaId] = useState<number | null>(null);
  const [fechaProgramada, setFechaProgramada] = useState("");
  // null = heredar la duración de la prueba (lo normal). Un número = override.
  const [duracionMinutos, setDuracionMinutos] = useState<number | null>(null);
  const [evaluadorId, setEvaluadorId] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [linkSupervisor, setLinkSupervisor] = useState<string | null>(null);
  const [invitadosLinks, setInvitadosLinks] = useState<InvitadoProgramado[]>(
    [],
  );
  const [copiadoInvitadoNueva, setCopiadoInvitadoNueva] = useState<
    Record<number, boolean>
  >({});
  const [copiadoTodosNueva, setCopiadoTodosNueva] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [errores, setErrores] = useState<ValidationErrors>({});

  const emailPreviewRef = useRef<HTMLDivElement>(null);

  // ── Carga de datos ──
  const { data: usuarios, isLoading: loadingUsuarios } = useGetUsuarios();
  const { data: pruebas } = useGetPruebas();
  // Duración por defecto = la de la prueba elegida (fuente de verdad).
  const pruebaDuracion = (pruebas ?? []).find((p) => p.id === pruebaId)?.duracion_minutos ?? null;

  // ── Mutaciones ──
  const programarMutation = useProgramarEntrevista();

  // ── Auto-dismiss del toast ──
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Datos derivados ──
  const evaluador = usuarios?.find((u) => u.id === evaluadorId);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleAgregarCandidato = () => {
    const nombre = nuevoNombre.trim();
    const email = nuevoEmail.trim();
    if (!nombre || !EMAIL_REGEX.test(email)) return;
    setCandidatos((prev) => [...prev, { nombre, email }]);
    setNuevoNombre("");
    setNuevoEmail("");
    if (errores.candidatos)
      setErrores((prev) => ({ ...prev, candidatos: undefined }));
  };

  const handleEliminarCandidato = (index: number) => {
    setCandidatos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopiarLink = async () => {
    if (!linkSupervisor) return;
    await navigator.clipboard.writeText(linkSupervisor);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const validate = (): boolean => {
    const nuevos: ValidationErrors = {};
    if (!titulo.trim()) nuevos.titulo = "El título es requerido";
    if (!pruebaId) nuevos.prueba = "Selecciona una prueba del banco";
    if (!evaluadorId) nuevos.evaluador = "Selecciona un evaluador";
    if (!fechaProgramada) nuevos.fecha = "La fecha es requerida";
    if (candidatos.length === 0)
      nuevos.candidatos = "Agrega al menos un candidato";
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const dto: ProgramarEntrevistaDto = {
      titulo: titulo.trim(),
      descripcion: observaciones.trim() || undefined,
      evaluador_id: evaluadorId as number,
      prueba_id: pruebaId ?? undefined,
      fecha_programada: new Date(fechaProgramada).toISOString(),
      // Si va null, no se envía → la convocatoria hereda la duración de la prueba.
      duracion_minutos: duracionMinutos ?? undefined,
      invitados: candidatos,
    };

    programarMutation.mutate(dto, {
      onSuccess: (data) => {
        const supervisorLink = fixLink(data.link_supervisor);
        const invitadosFixed = data.invitados.map((inv) => ({
          ...inv,
          link_invitacion: inv.link_invitacion
            ? fixLink(inv.link_invitacion)
            : inv.link_invitacion,
        }));
        setLinkSupervisor(supervisorLink);
        setInvitadosLinks(invitadosFixed);
        setEnviado(true);
        setToast({ mensaje: data.mensaje, tipo: "success" });
        localStorage.setItem(
          `link_supervisor_entrevista_${data.entrevista.id}`,
          supervisorLink,
        );
      },
      onError: () => {
        setToast({
          mensaje: "Error al programar la entrevista. Intenta de nuevo.",
          tipo: "error",
        });
      },
    });
  };

  function handleCopiarInvitadoNueva(invId: number, link: string) {
    void navigator.clipboard.writeText(link).then(() => {
      setCopiadoInvitadoNueva((prev) => ({ ...prev, [invId]: true }));
      setTimeout(
        () => setCopiadoInvitadoNueva((prev) => ({ ...prev, [invId]: false })),
        2000,
      );
    });
  }

  function handleCopiarTodosNueva() {
    const invLines = invitadosLinks
      .filter((inv) => inv.link_invitacion)
      .map((inv) => `${inv.nombre}: ${inv.link_invitacion ?? ""}`)
      .join("\n");
    const supervisorLine = linkSupervisor
      ? `\nTu link como supervisor: ${linkSupervisor}`
      : "";
    const text = `Links de evaluación — ${titulo.trim()}\n\n${invLines}${supervisorLine}`;
    void navigator.clipboard.writeText(text).then(() => {
      setCopiadoTodosNueva(true);
      setTimeout(() => setCopiadoTodosNueva(false), 2000);
    });
  }

  const isSubmitting = programarMutation.isPending;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <MainLayout userName={user?.username} onLogout={logout}>
      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "var(--space-lg)",
            right: "var(--space-lg)",
            zIndex: 1000,
            backgroundColor:
              toast.tipo === "success"
                ? "var(--color-success)"
                : "var(--color-danger)",
            color: "#fff",
            padding: "var(--space-sm) var(--space-lg)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--font-size-base)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            maxWidth: "420px",
          }}
        >
          {toast.mensaje}
        </div>
      )}

      {/* ── Encabezado ── */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <h1
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-text)",
            marginBottom: "var(--space-xs)",
          }}
        >
          Nueva convocatoria
        </h1>
        <p
          style={{
            fontSize: "var(--font-size-base)",
            color: "var(--color-text-muted)",
            margin: 0,
          }}
        >
          Completa los datos, agrega candidatos y envía los links de acceso.
        </p>
      </div>

      {/* ── Layout de dos columnas ── */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-xl)",
          alignItems: "flex-start",
        }}
      >
        {/* ─ Columna izquierda ─ */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-lg)",
            minWidth: 0,
          }}
        >
          {/* ── SECCIÓN 1: Datos de la sesión ── */}
          <Card title="Datos de la sesión">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-md)",
              }}
            >
              {/* Prueba a rendir (del banco reutilizable) */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Prueba a rendir (del banco) *</label>
                <select
                  style={{
                    ...selectStyle,
                    border: errores.prueba
                      ? "1px solid var(--color-danger)"
                      : "1px solid var(--color-border)",
                  }}
                  value={pruebaId ?? ""}
                  onChange={(e) => {
                    setPruebaId(e.target.value ? Number(e.target.value) : null);
                    if (errores.prueba)
                      setErrores((p) => ({ ...p, prueba: undefined }));
                  }}
                >
                  <option value="">Seleccionar prueba…</option>
                  {(pruebas ?? [])
                    .filter((p) => p.estado === "activa")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.titulo}
                      </option>
                    ))}
                </select>
                {errores.prueba && (
                  <span
                    style={{
                      fontSize: "var(--font-size-sm)",
                      color: "var(--color-danger)",
                    }}
                  >
                    {errores.prueba}
                  </span>
                )}
              </div>

              {/* Título */}
              <Input
                label="Título de la sesión *"
                placeholder="Ej. Evaluación Frontend Junior"
                value={titulo}
                error={errores.titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  if (errores.titulo)
                    setErrores((p) => ({ ...p, titulo: undefined }));
                }}
              />

              {/* Fecha + Duración */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-md)",
                }}
              >
                <div style={fieldStyle}>
                  <label style={labelStyle}>Fecha y hora de inicio *</label>
                  <input
                    type="datetime-local"
                    value={fechaProgramada}
                    onChange={(e) => {
                      setFechaProgramada(e.target.value);
                      if (errores.fecha)
                        setErrores((p) => ({ ...p, fecha: undefined }));
                    }}
                    style={{
                      ...selectStyle,
                      border: errores.fecha
                        ? "1px solid var(--color-danger)"
                        : "1px solid var(--color-border)",
                    }}
                  />
                  {errores.fecha && (
                    <span
                      style={{
                        fontSize: "var(--font-size-sm)",
                        color: "var(--color-danger)",
                      }}
                    >
                      {errores.fecha}
                    </span>
                  )}
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Duración</label>
                  <select
                    style={selectStyle}
                    value={duracionMinutos ?? ""}
                    onChange={(e) =>
                      setDuracionMinutos(e.target.value === "" ? null : Number(e.target.value))
                    }
                  >
                    <option value="">
                      {pruebaDuracion
                        ? `Usar el tiempo de la prueba (${pruebaDuracion} min)`
                        : "Usar el tiempo de la prueba"}
                    </option>
                    {DURACION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}
                  >
                    Vacío = usa el tiempo de la prueba. Cámbialo solo para dar más/menos
                    tiempo a esta convocatoria.
                  </span>
                </div>
              </div>

              {/* Evaluador */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Evaluador responsable *</label>
                {loadingUsuarios ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-sm)",
                    }}
                  >
                    <Spinner size="sm" />
                    <span
                      style={{
                        fontSize: "var(--font-size-sm)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Cargando usuarios...
                    </span>
                  </div>
                ) : (
                  <>
                    <select
                      style={{
                        ...selectStyle,
                        border: errores.evaluador
                          ? "1px solid var(--color-danger)"
                          : "1px solid var(--color-border)",
                      }}
                      value={evaluadorId ?? ""}
                      onChange={(e) => {
                        setEvaluadorId(
                          e.target.value ? Number(e.target.value) : null,
                        );
                        if (errores.evaluador)
                          setErrores((p) => ({ ...p, evaluador: undefined }));
                      }}
                    >
                      <option value="">Seleccionar evaluador</option>
                      {(usuarios ?? []).map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.first_name} {u.last_name}
                        </option>
                      ))}
                    </select>
                    {errores.evaluador && (
                      <span
                        style={{
                          fontSize: "var(--font-size-sm)",
                          color: "var(--color-danger)",
                        }}
                      >
                        {errores.evaluador}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Observaciones */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Observaciones internas</label>
                <textarea
                  placeholder="Notas privadas sobre esta sesión..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  style={{
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-sm) var(--space-md)",
                    fontSize: "var(--font-size-base)",
                    fontFamily: "inherit",
                    outline: "none",
                    width: "100%",
                    resize: "vertical",
                    minHeight: "80px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </Card>

          {/* ── SECCIÓN 2: Candidatos invitados ── */}
          <Card title="Candidatos invitados">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-md)",
              }}
            >
              {/* Error global de candidatos */}
              {errores.candidatos && (
                <div
                  style={{
                    padding: "var(--space-sm) var(--space-md)",
                    backgroundColor: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-danger)",
                  }}
                >
                  {errores.candidatos}
                </div>
              )}

              {/* Lista */}
              {candidatos.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "var(--space-lg)",
                    color: "var(--color-text-muted)",
                    fontSize: "var(--font-size-sm)",
                    fontStyle: "italic",
                  }}
                >
                  No hay candidatos agregados aún
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-sm)",
                  }}
                >
                  {candidatos.map((candidato, i) => {
                    const iniciales = candidato.nombre
                      .split(" ")
                      .map((n) => n[0] ?? "")
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    const color =
                      AVATAR_COLORS[i % AVATAR_COLORS.length] ?? "#1d4ed8";

                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-sm)",
                          padding: "var(--space-sm) var(--space-md)",
                          backgroundColor: "var(--color-background)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "var(--radius-full)",
                            backgroundColor: color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "var(--font-size-sm)",
                            fontWeight: "var(--font-weight-bold)",
                            color: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {iniciales}
                        </div>

                        {/* Nombre y email */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "var(--font-size-base)",
                              fontWeight: "var(--font-weight-medium)",
                              color: "var(--color-text)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {candidato.nombre}
                          </div>
                          <div
                            style={{
                              fontSize: "var(--font-size-sm)",
                              color: "var(--color-text-muted)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {candidato.email}
                          </div>
                        </div>

                        <Badge variant="neutral">Pendiente</Badge>

                        <button
                          onClick={() => handleEliminarCandidato(i)}
                          title="Eliminar candidato"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--color-text-muted)",
                            fontSize: "1.2rem",
                            padding: "var(--space-xs)",
                            lineHeight: 1,
                            borderRadius: "var(--radius-sm)",
                            flexShrink: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fila para agregar */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: "var(--space-sm)",
                  alignItems: "flex-end",
                  paddingTop: "var(--space-sm)",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <Input
                  placeholder="Nombre del candidato"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                />
                <Button
                  variant="secondary"
                  disabled={
                    !nuevoNombre.trim() || !EMAIL_REGEX.test(nuevoEmail.trim())
                  }
                  onClick={handleAgregarCandidato}
                >
                  + Agregar
                </Button>
              </div>
            </div>
          </Card>

        </div>

        {/* ─ Columna derecha ─ */}
        <div
          style={{
            width: "320px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-lg)",
          }}
        >
          {/* ── SECCIÓN 4: Link de supervisor ── */}
          {linkSupervisor ? (
            <div
              style={{
                backgroundColor: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.35)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>✓</span>
                <span
                  style={{
                    fontSize: "var(--font-size-sm)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--color-success)",
                  }}
                >
                  Sesión creada. Tu link de supervisor:
                </span>
              </div>
              <input
                readOnly
                value={linkSupervisor}
                onFocus={(e) => e.target.select()}
                style={{
                  width: "100%",
                  fontSize: "var(--font-size-xs)",
                  padding: "var(--space-sm)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                  fontFamily: "monospace",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              <Button
                variant={copiado ? "secondary" : "primary"}
                onClick={handleCopiarLink}
                style={{ width: "100%" }}
              >
                {copiado ? "Copiado ✓" : "Copiar link de supervisor"}
              </Button>
            </div>
          ) : (
            <Card title="Link de acceso">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  padding: "var(--space-lg) var(--space-md)",
                  color: "var(--color-text-muted)",
                }}
              >
                <span style={{ fontSize: "2rem" }}>🔒</span>
                <p
                  style={{
                    fontSize: "var(--font-size-sm)",
                    textAlign: "center",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Se genera automáticamente al crear la sesión
                </p>
              </div>
            </Card>
          )}

          {/* ── SECCIÓN 4b: Links generados ── */}
          {enviado && invitadosLinks.length > 0 && (
            <Card title="Links generados">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-xs)",
                }}
              >
                {/* Botón copiar todos */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 4,
                  }}
                >
                  <Button
                    variant="secondary"
                    onClick={handleCopiarTodosNueva}
                    style={{
                      fontSize: "var(--font-size-xs)",
                      padding: "4px 12px",
                    }}
                  >
                    {copiadoTodosNueva ? "✓ Copiado" : "Copiar todos"}
                  </Button>
                </div>

                {/* Fila por invitado */}
                {invitadosLinks.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto",
                      alignItems: "center",
                      gap: "var(--space-sm)",
                      padding: "6px 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--font-size-sm)",
                        fontWeight: "var(--font-weight-medium)",
                        color: "var(--color-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {inv.nombre}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 130,
                      }}
                    >
                      {inv.link_invitacion ? (
                        inv.link_invitacion.length > 30 ? (
                          `${inv.link_invitacion.slice(0, 30)}…`
                        ) : (
                          inv.link_invitacion
                        )
                      ) : (
                        <em>No disponible</em>
                      )}
                    </span>
                    <button
                      disabled={!inv.link_invitacion}
                      onClick={() =>
                        inv.link_invitacion &&
                        handleCopiarInvitadoNueva(inv.id, inv.link_invitacion)
                      }
                      style={{
                        padding: "3px 10px",
                        background: "transparent",
                        color: inv.link_invitacion
                          ? "var(--color-primary)"
                          : "var(--color-text-muted)",
                        border: `1px solid ${inv.link_invitacion ? "var(--color-primary)" : "var(--color-border)"}`,
                        borderRadius: "var(--radius-sm)",
                        cursor: inv.link_invitacion ? "pointer" : "default",
                        fontSize: "var(--font-size-xs)",
                        fontFamily: "inherit",
                        flexShrink: 0,
                      }}
                    >
                      {copiadoInvitadoNueva[inv.id] ? "✓ Copiado" : "Copiar"}
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── SECCIÓN 5: Vista previa del email ── */}
          <div ref={emailPreviewRef}>
            <Card title="Vista previa del email">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-sm)",
                }}
              >
                {/* Cabecera */}
                <div
                  style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-muted)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ fontWeight: "var(--font-weight-medium)" }}>
                      Para:{" "}
                    </span>
                    {candidatos.length > 0 ? (
                      candidatos.map((c) => c.email).join(", ")
                    ) : (
                      <span style={{ fontStyle: "italic" }}>
                        candidatos por agregar...
                      </span>
                    )}
                  </div>
                  <div>
                    <span style={{ fontWeight: "var(--font-weight-medium)" }}>
                      De:{" "}
                    </span>
                    evalsecure@empresa.com
                  </div>
                  <div>
                    <span style={{ fontWeight: "var(--font-weight-medium)" }}>
                      Asunto:{" "}
                    </span>
                    Invitación a evaluación — EvalSecure
                  </div>
                </div>

                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid var(--color-border)",
                    margin: 0,
                  }}
                />

                {/* Cuerpo */}
                <div
                  style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-sm)",
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ margin: 0 }}>Hola,</p>
                  <p style={{ margin: 0 }}>
                    Has sido invitado/a a participar en una evaluación a través
                    de EvalSecure.
                  </p>

                  {/* Detalles de sesión */}
                  <div
                    style={{
                      padding: "var(--space-sm)",
                      backgroundColor: "var(--color-background)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    <div>
                      <strong>Sesión:</strong> {titulo || <em>Sin título</em>}
                    </div>
                    <div>
                      <strong>Fecha:</strong>{" "}
                      {fechaProgramada
                        ? new Date(fechaProgramada).toLocaleString("es-ES", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Por definir"}
                    </div>
                    <div>
                      <strong>Duración:</strong>{" "}
                      {duracionMinutos != null
                        ? `${duracionMinutos} minutos`
                        : pruebaDuracion
                          ? `${pruebaDuracion} minutos (de la prueba)`
                          : "Tiempo de la prueba"}
                    </div>
                    {evaluador && (
                      <div>
                        <strong>Evaluador:</strong> {evaluador.first_name}{" "}
                        {evaluador.last_name}
                      </div>
                    )}
                  </div>

                  {/* Botón de acceso (decorativo) */}
                  <div
                    style={{
                      padding: "var(--space-sm) var(--space-md)",
                      backgroundColor: "var(--color-primary)",
                      color: "#fff",
                      borderRadius: "var(--radius-md)",
                      textAlign: "center",
                      fontWeight: "var(--font-weight-medium)",
                    }}
                  >
                    Ingresar a la evaluación →
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.7rem",
                      color: "var(--color-text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    Esta sesión está sujeta a monitoreo remoto por parte de
                    EvalSecure.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* ── SECCIÓN 6: Acciones ── */}
          <Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
              }}
            >
              {enviado && (
                <div
                  style={{
                    padding: "var(--space-sm) var(--space-md)",
                    backgroundColor: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-success)",
                    textAlign: "center",
                  }}
                >
                  ✓ Invitaciones enviadas correctamente
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-sm)",
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() =>
                    emailPreviewRef.current?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                >
                  Ver email
                </Button>
                <Button
                  variant="primary"
                  loading={isSubmitting}
                  disabled={enviado}
                  onClick={handleSubmit}
                >
                  Enviar invitaciones
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Botón grande (ancho completo) ── */}
      <div style={{ marginTop: "var(--space-xl)" }}>
        <Button
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={enviado}
          onClick={handleSubmit}
          style={{ width: "100%" }}
        >
          {enviado
            ? "✓ Convocatoria creada exitosamente"
            : "Crear convocatoria y enviar links"}
        </Button>
      </div>
    </MainLayout>
  );
}
