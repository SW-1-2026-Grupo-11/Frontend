import { Badge, Button, Pagination, Spinner, Table, TableHead, Th, Td } from "@/shared/components/ui";
import { ENTREVISTAS } from "@/config/constants";
import { useGetEntrevistas, useDeleteEntrevista } from "../hooks/useEntrevistas";
import type { Entrevista, EstadoEntrevista } from "../types";

export type EntrevistasSortField = "titulo" | "fecha_programada";
export type SortDirection = "asc" | "desc";
export type SortState = { field: EntrevistasSortField; direction: SortDirection } | null;

type EntrevistasTableProps = {
  estadoFilter: EstadoEntrevista | null;
  page: number;
  onPageChange: (page: number) => void;
  search: string;
  sort: SortState;
  onSortChange: (field: EntrevistasSortField) => void;
  onView: (entrevista: Entrevista) => void;
  onEdit: (entrevista: Entrevista) => void;
};

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const ellipsisStyle: React.CSSProperties = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

function sortDirectionFor(field: EntrevistasSortField, sort: SortState) {
  return sort?.field === field ? sort.direction : null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function EntrevistasTable({
  estadoFilter,
  page,
  onPageChange,
  search,
  sort,
  onSortChange,
  onView,
  onEdit,
}: EntrevistasTableProps) {
  const ordering = sort ? `${sort.direction === "desc" ? "-" : ""}${sort.field}` : undefined;
  const { data, isLoading, isError } = useGetEntrevistas({
    page,
    search: search || undefined,
    ordering,
  });
  const entrevistas = data?.results;
  const deleteEntrevista = useDeleteEntrevista();

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
        {ENTREVISTAS.ERROR}
      </p>
    );
  }

  const filtered = estadoFilter
    ? (entrevistas ?? []).filter((e) => e.estado_efectivo === estadoFilter)
    : (entrevistas ?? []);

  if (filtered.length === 0) {
    return (
      <p
        style={{
          color: "var(--color-text-muted)",
          textAlign: "center",
          padding: "var(--space-xl)",
          fontSize: "var(--font-size-base)",
        }}
      >
        {search ? ENTREVISTAS.EMPTY_SEARCH : ENTREVISTAS.EMPTY}
      </p>
    );
  }

  const handleDelete = (entrevista: Entrevista) => {
    if (window.confirm(`${ENTREVISTAS.CONFIRM_DELETE}\n"${entrevista.titulo}"`)) {
      deleteEntrevista.mutate(entrevista.id);
    }
  };

  const isMutating = deleteEntrevista.isPending;

  return (
    <div>
      <Table>
        <TableHead>
          <Th sortDirection={sortDirectionFor("titulo", sort)} onClick={() => onSortChange("titulo")}>
            {ENTREVISTAS.COL_TITULO}
          </Th>
          <Th>{ENTREVISTAS.COL_DESCRIPCION}</Th>
          <Th>{ENTREVISTAS.COL_ESTADO}</Th>
          <Th
            sortDirection={sortDirectionFor("fecha_programada", sort)}
            onClick={() => onSortChange("fecha_programada")}
          >
            {ENTREVISTAS.COL_FECHA}
          </Th>
          <Th align="right">{ENTREVISTAS.COL_ACCIONES}</Th>
        </TableHead>
        <tbody>
          {filtered.map((entrevista) => (
            <tr key={entrevista.id}>
              <Td style={{ fontWeight: "var(--font-weight-medium)", maxWidth: "220px" }}>
                <span style={ellipsisStyle} title={entrevista.titulo}>
                  {entrevista.titulo}
                </span>
              </Td>
              <Td muted style={{ maxWidth: "240px" }}>
                <span style={ellipsisStyle} title={entrevista.descripcion}>
                  {entrevista.descripcion}
                </span>
              </Td>
              <Td>
                <Badge variant={ENTREVISTAS.ESTADO_BADGE[entrevista.estado_efectivo] as BadgeVariant}>
                  {ENTREVISTAS.ESTADO_LABELS[entrevista.estado_efectivo]}
                </Badge>
              </Td>
              <Td muted>{formatDate(entrevista.fecha_programada)}</Td>
              <Td align="right">
                <div
                  style={{
                    display: "inline-flex",
                    gap: "var(--space-xs)",
                    alignItems: "center",
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => onView(entrevista)}
                  >
                    {ENTREVISTAS.BTN_VER}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => onEdit(entrevista)}
                  >
                    {ENTREVISTAS.BTN_EDITAR}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => handleDelete(entrevista)}
                  >
                    {ENTREVISTAS.BTN_ELIMINAR}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {!estadoFilter && (
        <Pagination
          page={page}
          count={data?.count ?? 0}
          hasNext={Boolean(data?.next)}
          hasPrevious={Boolean(data?.previous)}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
