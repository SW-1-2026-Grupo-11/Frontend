import { Badge, Button, Pagination, Spinner, Table, TableHead, Th, Td } from "@/shared/components/ui";
import { USUARIOS } from "@/config/constants";
import { useGetUsuarios, useDeleteUsuario } from "../hooks/useUsuarios";
import type { EstadoUsuario, Rol, Usuario } from "../types";

export type UsuariosSortField = "first_name" | "email";
export type SortDirection = "asc" | "desc";
export type SortState = { field: UsuariosSortField; direction: SortDirection } | null;

type UsuariosTableProps = {
  page: number;
  onPageChange: (page: number) => void;
  search: string;
  sort: SortState;
  onSortChange: (field: UsuariosSortField) => void;
  onEdit: (usuario: Usuario) => void;
};

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

function sortDirectionFor(field: UsuariosSortField, sort: SortState) {
  return sort?.field === field ? sort.direction : null;
}

export default function UsuariosTable({
  page,
  onPageChange,
  search,
  sort,
  onSortChange,
  onEdit,
}: UsuariosTableProps) {
  const ordering = sort ? `${sort.direction === "desc" ? "-" : ""}${sort.field}` : undefined;
  const { data, isLoading, isError } = useGetUsuarios({ page, search: search || undefined, ordering });
  const usuarios = data?.results;
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
        {search ? USUARIOS.EMPTY_SEARCH : USUARIOS.EMPTY}
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
    <div>
      <Table>
        <TableHead>
          <Th sortDirection={sortDirectionFor("first_name", sort)} onClick={() => onSortChange("first_name")}>
            {USUARIOS.COL_NOMBRE}
          </Th>
          <Th sortDirection={sortDirectionFor("email", sort)} onClick={() => onSortChange("email")}>
            {USUARIOS.COL_EMAIL}
          </Th>
          <Th>{USUARIOS.COL_ROL}</Th>
          <Th>{USUARIOS.COL_ESTADO}</Th>
          <Th align="right">{USUARIOS.COL_ACCIONES}</Th>
        </TableHead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id}>
              <Td>
                {usuario.first_name} {usuario.last_name}
              </Td>
              <Td muted>{usuario.email}</Td>
              <Td>
                <Badge variant={USUARIOS.ROL_BADGE[usuario.rol as Rol] as BadgeVariant}>
                  {USUARIOS.ROL_LABELS[usuario.rol as Rol]}
                </Badge>
              </Td>
              <Td>
                <Badge variant={USUARIOS.ESTADO_BADGE[usuario.estado as EstadoUsuario] as BadgeVariant}>
                  {USUARIOS.ESTADO_LABELS[usuario.estado as EstadoUsuario]}
                </Badge>
              </Td>
              <Td align="right">
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
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination
        page={page}
        count={data?.count ?? 0}
        hasNext={Boolean(data?.next)}
        hasPrevious={Boolean(data?.previous)}
        onPageChange={onPageChange}
      />
    </div>
  );
}
