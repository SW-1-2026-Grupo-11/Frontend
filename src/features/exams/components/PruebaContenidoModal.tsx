import { useState } from "react";
import { createPortal } from "react-dom";
import { Badge, Button } from "@/shared/components/ui";
import {
  useGetSecciones,
  useCreateSeccion,
  useDeleteSeccion,
  useCreatePregunta,
  useDeletePregunta,
  useCreateOpcion,
  useDeleteOpcion,
} from "../hooks/useExams";
import type { FormatoPregunta, Pregunta, Prueba, Seccion } from "../types";

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

// ── Opciones de una pregunta cerrada ──
function OpcionesEditor({ pregunta }: { pregunta: Pregunta }) {
  const createOpcion = useCreateOpcion();
  const deleteOpcion = useDeleteOpcion();
  const [texto, setTexto] = useState("");
  const [correcta, setCorrecta] = useState(false);

  const add = () => {
    if (!texto.trim()) return;
    createOpcion.mutate({
      pregunta: pregunta.id,
      texto,
      es_correcta: correcta,
      orden: pregunta.opciones.length + 1,
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
          <button onClick={() => deleteOpcion.mutate(o.id)} style={iconBtn} aria-label="Eliminar opción">✕</button>
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
  const esCerrada = pregunta.formato === "opcion_multiple" || pregunta.formato === "verdadero_falso";

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
          {esCerrada && <OpcionesEditor pregunta={pregunta} />}
        </div>
        <button onClick={() => deletePregunta.mutate(pregunta.id)} style={iconBtn} aria-label="Eliminar pregunta">🗑️</button>
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
    createPregunta.mutate({
      seccion: seccion.id,
      enunciado: form.enunciado,
      formato: form.formato,
      puntaje: form.puntaje,
      orden: seccion.preguntas.length + 1,
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
        <button onClick={() => deleteSeccion.mutate(seccion.id)} style={iconBtn} aria-label="Eliminar sección">🗑️</button>
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

type Props = { prueba: Prueba; onClose: () => void };

export default function PruebaContenidoModal({ prueba, onClose }: Props) {
  const { data: secciones = [], isLoading } = useGetSecciones(prueba.id);
  const createSeccion = useCreateSeccion();
  const [titulo, setTitulo] = useState("");
  const [peso, setPeso] = useState(100);

  const totalPeso = secciones.reduce((s, sec) => s + sec.peso_porcentual, 0);

  const addSeccion = () => {
    if (!titulo.trim()) return;
    createSeccion.mutate({
      prueba: prueba.id,
      titulo,
      peso_porcentual: peso,
      orden: secciones.length + 1,
    });
    setTitulo("");
    setPeso(100);
  };

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-xl)" }}>
      <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-xl)",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-lg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={labelStyle}>Contenido de la prueba</p>
            <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)" }}>{prueba.titulo}</h2>
          </div>
          <button onClick={onClose} style={{ ...iconBtn, fontSize: "var(--font-size-xl)" }} aria-label="Cerrar">✕</button>
        </div>

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

        {/* Nueva sección */}
        <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-md)" }}>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título de la sección (ej: Teoría)" style={{ ...inputStyle, flex: 1 }} />
          <input type="number" min={0} max={100} value={peso} onChange={(e) => setPeso(Number(e.target.value))} style={{ ...inputStyle, width: 90 }} title="Peso %" />
          <Button variant="primary" onClick={addSeccion} disabled={createSeccion.isPending}>+ Sección</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
