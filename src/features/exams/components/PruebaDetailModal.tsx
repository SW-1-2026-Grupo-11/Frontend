import { Badge, Button, Modal } from "@/shared/components/ui";
import { PRUEBAS } from "@/config/constants";
import type { AreaPrueba, EstadoPrueba, Prueba, TipoPrueba } from "../types";

type PruebaDetailModalProps = {
  prueba: Prueba;
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PruebaDetailModal({ prueba, onClose }: PruebaDetailModalProps) {
  return (
    <Modal onClose={onClose} maxWidth="600px">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
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
            <p style={{ ...metaLabelStyle, marginBottom: "var(--space-xs)" }}>
              {PRUEBAS.MODAL_DETALLE_TITLE}
            </p>
            <h2
              style={{
                fontSize: "var(--font-size-xl)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-text)",
              }}
            >
              {prueba.titulo}
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

        {/* Badges: tipo, área, nivel, estado */}
        <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
          <Badge variant={PRUEBAS.TIPO_BADGE[prueba.tipo as TipoPrueba] as BadgeVariant}>
            {PRUEBAS.TIPO_LABELS[prueba.tipo as TipoPrueba]}
          </Badge>
          <Badge variant={PRUEBAS.AREA_BADGE[prueba.area as AreaPrueba] as BadgeVariant}>
            {PRUEBAS.AREA_LABELS[prueba.area as AreaPrueba]}
          </Badge>
          <Badge variant="neutral">
            {PRUEBAS.NIVEL_LABELS[prueba.nivel]}
          </Badge>
          <Badge variant={PRUEBAS.ESTADO_BADGE[prueba.estado as EstadoPrueba] as BadgeVariant}>
            {PRUEBAS.ESTADO_LABELS[prueba.estado as EstadoPrueba]}
          </Badge>
        </div>

        {/* Métricas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "var(--space-md)",
            backgroundColor: "var(--color-background)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md)",
          }}
        >
          <div>
            <p style={metaLabelStyle}>{PRUEBAS.COL_DURACION}</p>
            <p style={metaValueStyle}>
              {prueba.duracion_minutos} {PRUEBAS.DETAIL_MINUTOS}
            </p>
          </div>
          <div>
            <p style={metaLabelStyle}>{PRUEBAS.COL_PUNTAJE}</p>
            <p style={metaValueStyle}>
              {prueba.puntaje_maximo} {PRUEBAS.DETAIL_PUNTOS}
            </p>
          </div>
          <div>
            <p style={metaLabelStyle}>Creada</p>
            <p style={metaValueStyle}>{formatDate(prueba.fecha_creacion)}</p>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <p style={metaLabelStyle}>{PRUEBAS.LABEL_DESCRIPCION}</p>
          <p
            style={{
              fontSize: "var(--font-size-base)",
              color: "var(--color-text)",
              lineHeight: 1.6,
            }}
          >
            {prueba.descripcion}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose}>
            {PRUEBAS.BTN_CERRAR}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
