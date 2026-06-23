import { Badge } from "@/shared/components/ui";
import { useGetSecciones } from "../hooks/useExams";
import type { FormatoPregunta, Prueba } from "../types";

const FORMATO_LABELS: Record<FormatoPregunta, string> = {
  opcion_multiple: "Opción múltiple",
  verdadero_falso: "Verdadero / Falso",
  abierta: "Respuesta abierta",
  codigo: "Código",
};

const labelStyle: React.CSSProperties = {
  fontSize: "var(--font-size-sm)",
  color: "var(--color-text-muted)",
};

type Props = { prueba: Prueba };

export default function PruebaVistaPreviaStep({ prueba }: Props) {
  const { data: secciones = [], isLoading } = useGetSecciones(prueba.id);

  if (isLoading) return <p style={labelStyle}>Cargando…</p>;

  if (secciones.length === 0) {
    return <p style={{ ...labelStyle, fontStyle: "italic" }}>Todavía no hay contenido para previsualizar.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <div>
        <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)" }}>
          {prueba.titulo}
        </h3>
        <p style={{ ...labelStyle, marginTop: 4 }}>{prueba.descripcion}</p>
        <p style={{ ...labelStyle, marginTop: 4 }}>{prueba.duracion_minutos} min</p>
      </div>

      {secciones.map((seccion) => (
        <div key={seccion.id} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-md)" }}>
          <h4 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)", marginBottom: "var(--space-sm)" }}>
            {seccion.titulo} <span style={{ color: "var(--color-text-muted)", fontWeight: "normal" }}>· {seccion.peso_porcentual}%</span>
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            {seccion.preguntas.map((p, i) => (
              <div key={p.id}>
                <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center", marginBottom: 4 }}>
                  <Badge variant="neutral">{FORMATO_LABELS[p.formato]}</Badge>
                  <span style={labelStyle}>{p.puntaje} pts</span>
                </div>
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>
                  {i + 1}. {p.enunciado}
                </p>
                {(p.formato === "opcion_multiple" || p.formato === "verdadero_falso") && (
                  <ul style={{ marginTop: 4, paddingLeft: "var(--space-lg)", display: "flex", flexDirection: "column", gap: 2 }}>
                    {p.opciones.map((o) => (
                      <li key={o.id} style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>{o.texto}</li>
                    ))}
                  </ul>
                )}
                {p.formato === "abierta" && (
                  <p style={{ ...labelStyle, fontStyle: "italic", marginTop: 4 }}>(El candidato escribe una respuesta abierta)</p>
                )}
                {p.formato === "codigo" && (
                  <p style={{ ...labelStyle, fontStyle: "italic", marginTop: 4 }}>
                    (El candidato escribe código{p.lenguaje ? ` en ${p.lenguaje}` : ""})
                  </p>
                )}
              </div>
            ))}
            {seccion.preguntas.length === 0 && (
              <p style={{ ...labelStyle, fontStyle: "italic" }}>Esta sección no tiene preguntas todavía.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
