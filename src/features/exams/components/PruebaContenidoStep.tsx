import { useState } from "react";
import { Badge, Button } from "@/shared/components/ui";
import {
  useGetSecciones,
  useCreateSeccion,
  useDeleteSeccion,
  useCreatePregunta,
  useDeletePregunta,
  useCreateOpcion,
  useUpdateOpcion,
  useDeleteOpcion,
} from "../hooks/useExams";
import type { FormatoPregunta, Pregunta, Prueba, Seccion, TipoSeccion } from "../types";

const TIPO_SECCION_LABELS: Record<TipoSeccion, string> = {
  teorica: "Teórica",
  practica: "Práctica",
};

const FORMATO_LABELS: Record<FormatoPregunta, string> = {
  opcion_multiple: "Opción múltiple",
  verdadero_falso: "Verdadero / Falso",
  abierta: "Respuesta abierta",
  codigo: "Código",
};

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-sm) var(--space-md)",
  fontSize: "var(--font-size-sm)",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  fontSize: "var(--font-size-sm)",
  color: "var(--color-text-muted)",
};

const iconBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--color-text-muted)",
  cursor: "pointer",
  fontSize: "var(--font-size-sm)",
  padding: 2,
  lineHeight: 1,
};

// ── Opciones de una pregunta Verdadero/Falso: fijas, solo se elige cuál es correcta ──
function VerdaderoFalsoEditor({ pregunta }: { pregunta: Pregunta }) {
  const createOpcion = useCreateOpcion();
  const updateOpcion = useUpdateOpcion();

  if (pregunta.opciones.length !== 2) {
    return (
      <div style={{ marginTop: "var(--space-xs)" }}>
        <Button
          variant="secondary"
          onClick={() => {
            createOpcion.mutate({ pregunta: pregunta.id, texto: "Verdadero", orden: 1 });
            createOpcion.mutate({ pregunta: pregunta.id, texto: "Falso", orden: 2 });
          }}
          disabled={createOpcion.isPending}
        >
          Generar opciones Verdadero / Falso
        </Button>
      </div>
    );
  }

  const marcarCorrecta = (seleccionada: Pregunta["opciones"][number]) => {
    if (seleccionada.es_correcta) return;
    pregunta.opciones.forEach((o) => {
      if (o.es_correcta) updateOpcion.mutate({ id: o.id, dto: { es_correcta: false } });
    });
    updateOpcion.mutate({ id: seleccionada.id, dto: { es_correcta: true } });
  };

  return (
    <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-xs)" }}>
      {pregunta.opciones.map((o) => (
        <label key={o.id} style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <input
            type="radio"
            name={`vf-correcta-${pregunta.id}`}
            checked={o.es_correcta}
            onChange={() => marcarCorrecta(o)}
          />
          {o.texto}
        </label>
      ))}
    </div>
  );
}

// ── Opciones de una pregunta de opción múltiple: texto libre, agregar/quitar ──
function OpcionMultipleEditor({ pregunta }: { pregunta: Pregunta }) {
  const createOpcion = useCreateOpcion();
  const deleteOpcion = useDeleteOpcion();
  const [texto, setTexto] = useState("");
  const [correcta, setCorrecta] = useState(false);

  const add = () => {
    if (!texto.trim()) return;
    const siguienteOrden = pregunta.opciones.reduce((max, o) => Math.max(max, o.orden), 0) + 1;
    createOpcion.mutate({
      pregunta: pregunta.id,
      texto,
      es_correcta: correcta,
      orden: siguienteOrden,
    });
    setTexto("");
    setCorrecta(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)", marginTop: "var(--space-xs)" }}>
      {pregunta.opciones.map((o) => (
        <div key={o.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", fontSize: "var(--font-size-sm)" }}>
          <span style={{ color: o.es_correcta ? "var(--color-success)" : "var(--color-text-muted)" }}>
            {o.es_correcta ? "✓" : "○"}
          </span>
          <span style={{ flex: 1, color: "var(--color-text)" }}>{o.texto}</span>
          <button
            onClick={() => {
              if (window.confirm(`¿Eliminar la opción "${o.texto}"?`)) deleteOpcion.mutate(o.id);
            }}
            style={iconBtn}
            aria-label="Eliminar opción"
          >
            ✕
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nueva opción" style={{ ...inputStyle, flex: 1 }} />
        <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={correcta} onChange={(e) => setCorrecta(e.target.checked)} /> correcta
        </label>
        <Button variant="secondary" onClick={add} disabled={createOpcion.isPending}>+</Button>
      </div>
    </div>
  );
}

// ── Una pregunta ──
function PreguntaItem({ pregunta }: { pregunta: Pregunta }) {
  const deletePregunta = useDeletePregunta();

  return (
    <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-sm)", backgroundColor: "var(--color-background)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-sm)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center", marginBottom: 4 }}>
            <Badge variant="neutral">{FORMATO_LABELS[pregunta.formato]}</Badge>
            <span style={labelStyle}>{pregunta.puntaje} pts</span>
            {pregunta.lenguaje && <span style={labelStyle}>· {pregunta.lenguaje}</span>}
          </div>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>{pregunta.enunciado}</p>
          {pregunta.formato === "verdadero_falso" && <VerdaderoFalsoEditor pregunta={pregunta} />}
          {pregunta.formato === "opcion_multiple" && <OpcionMultipleEditor pregunta={pregunta} />}
        </div>
        <button
          onClick={() => {
            if (window.confirm("¿Eliminar esta pregunta? Se perderán sus opciones.")) {
              deletePregunta.mutate(pregunta.id);
            }
          }}
          style={iconBtn}
          aria-label="Eliminar pregunta"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// ── Una sección con sus preguntas ──
function SeccionCard({ seccion }: { seccion: Seccion }) {
  const deleteSeccion = useDeleteSeccion();
  const createPregunta = useCreatePregunta();
  const [form, setForm] = useState<{ enunciado: string; formato: FormatoPregunta; puntaje: number; lenguaje: string }>({
    enunciado: "",
    formato: "opcion_multiple",
    puntaje: 1,
    lenguaje: "",
  });

  const addPregunta = () => {
    if (!form.enunciado.trim()) return;
    const siguienteOrden = seccion.preguntas.reduce((max, p) => Math.max(max, p.orden), 0) + 1;
    createPregunta.mutate({
      seccion: seccion.id,
      enunciado: form.enunciado,
      formato: form.formato,
      puntaje: form.puntaje,
      orden: siguienteOrden,
      ...(form.formato === "codigo" && form.lenguaje ? { lenguaje: form.lenguaje } : {}),
    });
    setForm({ enunciado: "", formato: form.formato, puntaje: 1, lenguaje: "" });
  };

  return (
    <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-md)", display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h4 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)" }}>
          {seccion.titulo} <span style={{ color: "var(--color-text-muted)", fontWeight: "normal" }}>· {seccion.peso_porcentual}%</span>
        </h4>
        <button
          onClick={() => {
            const aviso = seccion.preguntas.length > 0
              ? `¿Eliminar la sección "${seccion.titulo}"? Se perderán sus ${seccion.preguntas.length} pregunta(s) y opciones.`
              : `¿Eliminar la sección "${seccion.titulo}"?`;
            if (window.confirm(aviso)) deleteSeccion.mutate(seccion.id);
          }}
          style={iconBtn}
          aria-label="Eliminar sección"
        >
          🗑️
        </button>
      </div>

      {seccion.preguntas.length === 0 ? (
        <p style={{ ...labelStyle, fontStyle: "italic" }}>Sin preguntas todavía</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
          {seccion.preguntas.map((p) => (
            <PreguntaItem key={p.id} pregunta={p} />
          ))}
        </div>
      )}

      {/* Nueva pregunta */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)", borderTop: "1px dashed var(--color-border)", paddingTop: "var(--space-sm)" }}>
        <textarea
          value={form.enunciado}
          onChange={(e) => setForm((f) => ({ ...f, enunciado: e.target.value }))}
          placeholder="Enunciado de la pregunta"
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={form.formato}
            onChange={(e) => setForm((f) => ({ ...f, formato: e.target.value as FormatoPregunta }))}
            style={{ ...inputStyle, width: "auto" }}
          >
            {Object.entries(FORMATO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={form.puntaje}
            onChange={(e) => setForm((f) => ({ ...f, puntaje: Number(e.target.value) }))}
            style={{ ...inputStyle, width: 80 }}
            title="Puntaje"
          />
          {form.formato === "codigo" && (
            <input
              value={form.lenguaje}
              onChange={(e) => setForm((f) => ({ ...f, lenguaje: e.target.value }))}
              placeholder="lenguaje (ej: python)"
              style={{ ...inputStyle, width: 170 }}
            />
          )}
          <Button variant="secondary" onClick={addPregunta} disabled={createPregunta.isPending}>+ Pregunta</Button>
        </div>
      </div>
    </div>
  );
}

const TIPOS_SECCION_POR_PRUEBA: Record<Prueba["tipo"], TipoSeccion[]> = {
  teorica: ["teorica"],
  tecnica: ["practica"],
  mixta: ["teorica", "practica"],
};

type Props = { prueba: Prueba };

export default function PruebaContenidoStep({ prueba }: Props) {
  const { data: secciones = [], isLoading } = useGetSecciones(prueba.id);
  const createSeccion = useCreateSeccion();
  const tiposDisponibles = TIPOS_SECCION_POR_PRUEBA[prueba.tipo];
  const [titulo, setTitulo] = useState("");
  const [tipoSeccion, setTipoSeccion] = useState<TipoSeccion>(tiposDisponibles[0]);
  const [peso, setPeso] = useState(100);

  const totalPeso = secciones.reduce((s, sec) => s + sec.peso_porcentual, 0);

  const addSeccion = () => {
    if (!titulo.trim()) return;
    if (totalPeso + peso > 100) {
      window.alert(`La suma de pesos excedería 100% (actual: ${totalPeso}%). Ajustá el peso de la nueva sección o el de las existentes.`);
      return;
    }
    const siguienteOrden = secciones.reduce((max, s) => Math.max(max, s.orden), 0) + 1;
    createSeccion.mutate({
      prueba: prueba.id,
      titulo,
      tipo: tipoSeccion,
      peso_porcentual: peso,
      orden: siguienteOrden,
    });
    setTitulo("");
    setTipoSeccion(tiposDisponibles[0]);
    setPeso(100);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <p style={{ fontSize: "var(--font-size-sm)", color: totalPeso === 100 ? "var(--color-text-muted)" : "var(--color-warning)" }}>
        Suma de pesos: {totalPeso}%{totalPeso !== 100 ? " (lo ideal es 100%)" : ""}
      </p>

      {isLoading ? (
        <p style={labelStyle}>Cargando…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {secciones.map((s) => (
            <SeccionCard key={s.id} seccion={s} />
          ))}
          {secciones.length === 0 && (
            <p style={{ ...labelStyle, fontStyle: "italic" }}>Aún no hay secciones. Agregá la primera abajo.</p>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-md)" }}>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título de la sección (ej: Teoría)" style={{ ...inputStyle, flex: 1 }} />
        <select
          value={tipoSeccion}
          onChange={(e) => setTipoSeccion(e.target.value as TipoSeccion)}
          style={{ ...inputStyle, width: "auto" }}
          title="Tipo"
          disabled={tiposDisponibles.length === 1}
        >
          {tiposDisponibles.map((t) => (
            <option key={t} value={t}>{TIPO_SECCION_LABELS[t]}</option>
          ))}
        </select>
        <input type="number" min={0} max={100} value={peso} onChange={(e) => setPeso(Number(e.target.value))} style={{ ...inputStyle, width: 90 }} title="Peso %" />
        <Button variant="primary" onClick={addSeccion} disabled={createSeccion.isPending}>+ Sección</Button>
      </div>
    </div>
  );
}
