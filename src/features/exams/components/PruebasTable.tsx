import { Badge, Button, Spinner } from "@/shared/components/ui";
import { PRUEBAS } from "@/config/constants";
import { useGetPruebas, useDeletePrueba } from "../hooks/useExams";
import type { AreaPrueba, EstadoPrueba, Prueba, TipoPrueba } from "../types";

type PruebasTableProps = {
  tipoFilter: TipoPrueba | null;
  onView: (prueba: Prueba) => void;
  onEdit: (prueba: Prueba) => void;
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

export default function PruebasTable({ tipoFilter, onView, onEdit }: PruebasTableProps) {
  const { data: pruebas, isLoading, isError } = useGetPruebas();
  const deletePrueba = useDeletePrueba();

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
        {PRUEBAS.ERROR}
      </p>
    );
  }

  const filtered = tipoFilter
    ? (pruebas ?? []).filter((p) => p.tipo === tipoFilter)
    : (pruebas ?? []);

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
        {PRUEBAS.EMPTY}
      </p>
    );
  }

  const handleDelete = (prueba: Prueba) => {
    if (window.confirm(`${PRUEBAS.CONFIRM_DELETE}\n"${prueba.titulo}"`)) {
      deletePrueba.mutate(prueba.id);
    }
  };

  const isMutating = deletePrueba.isPending;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ backgroundColor: "var(--color-surface-hover)" }}>
          <tr>
            <th style={thStyle}>{PRUEBAS.COL_TITULO}</th>
            <th style={thStyle}>{PRUEBAS.COL_TIPO}</th>
            <th style={thStyle}>{PRUEBAS.COL_AREA}</th>
            <th style={thStyle}>{PRUEBAS.COL_NIVEL}</th>
            <th style={{ ...thStyle, textAlign: "right" }}>{PRUEBAS.COL_DURACION}</th>
            <th style={{ ...thStyle, textAlign: "right" }}>{PRUEBAS.COL_PUNTAJE}</th>
            <th style={thStyle}>{PRUEBAS.COL_ESTADO}</th>
            <th style={{ ...thStyle, textAlign: "right" }}>{PRUEBAS.COL_ACCIONES}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((prueba) => (
            <tr key={prueba.id}>
              <td
                style={{
                  ...tdStyle,
                  fontWeight: "var(--font-weight-medium)",
                  maxWidth: "200px",
                }}
              >
                <span
                  style={{
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={prueba.titulo}
                >
                  {prueba.titulo}
                </span>
              </td>
              <td style={tdStyle}>
                <Badge variant={PRUEBAS.TIPO_BADGE[prueba.tipo as TipoPrueba] as BadgeVariant}>
                  {PRUEBAS.TIPO_LABELS[prueba.tipo as TipoPrueba]}
                </Badge>
              </td>
              <td style={tdStyle}>
                <Badge variant={PRUEBAS.AREA_BADGE[prueba.area as AreaPrueba] as BadgeVariant}>
                  {PRUEBAS.AREA_LABELS[prueba.area as AreaPrueba]}
                </Badge>
              </td>
              <td style={tdStyle}>
                <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
                  {PRUEBAS.NIVEL_LABELS[prueba.nivel]}
                </span>
              </td>
              <td style={{ ...tdStyle, textAlign: "right", color: "var(--color-text-muted)" }}>
                {prueba.duracion_minutos} {PRUEBAS.DETAIL_MINUTOS}
              </td>
              <td style={{ ...tdStyle, textAlign: "right", color: "var(--color-text-muted)" }}>
                {prueba.puntaje_maximo} {PRUEBAS.DETAIL_PUNTOS}
              </td>
              <td style={tdStyle}>
                <Badge
                  variant={PRUEBAS.ESTADO_BADGE[prueba.estado as EstadoPrueba] as BadgeVariant}
                >
                  {PRUEBAS.ESTADO_LABELS[prueba.estado as EstadoPrueba]}
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
                    variant="ghost"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => onView(prueba)}
                  >
                    {PRUEBAS.BTN_VER}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => onEdit(prueba)}
                  >
                    {PRUEBAS.BTN_EDITAR}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => handleDelete(prueba)}
                  >
                    {PRUEBAS.BTN_ELIMINAR}
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
