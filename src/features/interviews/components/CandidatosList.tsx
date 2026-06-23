import Card from "@/shared/components/ui/Card";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";
import Badge from "@/shared/components/ui/Badge";
import type { ProgramarInvitadoDto } from "../types";

const AVATAR_COLORS = [
  "#1d4ed8",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#15803d",
  "#b45309",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CandidatosListProps = {
  candidatos: ProgramarInvitadoDto[];
  error?: string;
  nuevoNombre: string;
  nuevoEmail: string;
  onNombreChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onAgregar: () => void;
  onEliminar: (index: number) => void;
};

export default function CandidatosList({
  candidatos,
  error,
  nuevoNombre,
  nuevoEmail,
  onNombreChange,
  onEmailChange,
  onAgregar,
  onEliminar,
}: CandidatosListProps) {
  return (
    <Card title="Candidatos invitados">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        {error && (
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
            {error}
          </div>
        )}

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
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            {candidatos.map((candidato, i) => {
              const iniciales = candidato.nombre
                .split(" ")
                .map((n) => n[0] ?? "")
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length] ?? "#1d4ed8";

              return (
                <div
                  key={candidato.email}
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
                    onClick={() => onEliminar(i)}
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
            onChange={(e) => onNombreChange(e.target.value)}
          />
          <Input
            type="email"
            placeholder="email@ejemplo.com"
            value={nuevoEmail}
            onChange={(e) => onEmailChange(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={!nuevoNombre.trim() || !EMAIL_REGEX.test(nuevoEmail.trim())}
            onClick={onAgregar}
          >
            + Agregar
          </Button>
        </div>
      </div>
    </Card>
  );
}

export { EMAIL_REGEX };
