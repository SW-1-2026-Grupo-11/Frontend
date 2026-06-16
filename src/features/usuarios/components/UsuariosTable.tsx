import { Badge, Button, Spinner } from "@/shared/components/ui";
import { USUARIOS } from "@/config/constants";
import { useGetUsuarios, useDeleteUsuario } from "../hooks/useUsuarios";
import type { EstadoUsuario, Rol, Usuario } from "../types";

type UsuariosTableProps = {
  onEdit: (usuario: Usuario) => void;
};

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const thStyle: React.CSSProperties = {
  padding: "var(--space-sm) var(--space-md)",
  textAlign: "left",
  fontSize: "var(--font-size-sm)",
  fontWeight: "var(--font-weight-medium)",
  color: "var(--color-text-muted)",
  borderBottom: "1px solid var(--color-border)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "var(--space-sm) var(--space-md)",
  fontSize: "var(--font-size-sm)",
  color: "var(--color-text)",
  borderBottom: "1px solid var(--color-border)",
  verticalAlign: "middle",
};

export default function UsuariosTable({ onEdit }: UsuariosTableProps) {
  const { data: usuarios, isLoading, isError } = useGetUsuarios();
  const deleteUsuario = useDeleteUsuario();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-2xl)" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <p
        style={{
          color: "var(--color-danger)",
          textAlign: "center",
          padding: "var(--space-xl)",
          fontSize: "var(--font-size-base)",
        }}
      >
        {USUARIOS.ERROR}
      </p>
    );
  }

  if (!usuarios || usuarios.length === 0) {
    return (
      <p
        style={{
          color: "var(--color-text-muted)",
          textAlign: "center",
          padding: "var(--space-xl)",
          fontSize: "var(--font-size-base)",
        }}
      >
        {USUARIOS.EMPTY}
      </p>
    );
  }

  const handleDelete = (usuario: Usuario) => {
    if (window.confirm(`${USUARIOS.CONFIRM_DELETE}\n${usuario.first_name} ${usuario.last_name}`)) {
      deleteUsuario.mutate(usuario.id);
    }
  };

  const isMutating = deleteUsuario.isPending;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ backgroundColor: "var(--color-surface-hover)" }}>
          <tr>
            <th style={thStyle}>{USUARIOS.COL_NOMBRE}</th>
            <th style={thStyle}>{USUARIOS.COL_EMAIL}</th>
            <th style={thStyle}>{USUARIOS.COL_ROL}</th>
            <th style={thStyle}>{USUARIOS.COL_ESTADO}</th>
            <th style={{ ...thStyle, textAlign: "right" }}>{USUARIOS.COL_ACCIONES}</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id}>
              <td style={tdStyle}>
                {usuario.first_name} {usuario.last_name}
              </td>
              <td style={{ ...tdStyle, color: "var(--color-text-muted)" }}>{usuario.email}</td>
              <td style={tdStyle}>
                <Badge variant={USUARIOS.ROL_BADGE[usuario.rol as Rol] as BadgeVariant}>
                  {USUARIOS.ROL_LABELS[usuario.rol as Rol]}
                </Badge>
              </td>
              <td style={tdStyle}>
                <Badge variant={USUARIOS.ESTADO_BADGE[usuario.estado as EstadoUsuario] as BadgeVariant}>
                  {USUARIOS.ESTADO_LABELS[usuario.estado as EstadoUsuario]}
                </Badge>
              </td>
              <td style={{ ...tdStyle, textAlign: "right" }}>
                <div
                  style={{
                    display: "inline-flex",
                    gap: "var(--space-xs)",
                    alignItems: "center",
                  }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => onEdit(usuario)}
                  >
                    {USUARIOS.BTN_EDITAR}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => handleDelete(usuario)}
                  >
                    {USUARIOS.BTN_ELIMINAR}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
