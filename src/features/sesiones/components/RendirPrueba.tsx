import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useResponder, useFinalizarCandidato } from "../hooks/useSesiones";
import type { PreguntaCandidato, PruebaCandidato } from "../types";

type FlatPregunta = PreguntaCandidato & {
  seccionTitulo: string;
  seccionTipo: string;
};

type Props = {
  prueba: PruebaCandidato | null;
  sesionId: number;
  token: string;
  onFinalizar: () => void;
};

const FORMATO_LABEL: Record<string, string> = {
  opcion_multiple: "Opción múltiple",
  verdadero_falso: "Verdadero / Falso",
  abierta: "Respuesta abierta",
  codigo: "Código",
};

export default function RendirPrueba({ prueba, sesionId, token, onFinalizar }: Props) {
  const responder = useResponder();
  const finalizar = useFinalizarCandidato();

  // Aplanar secciones→preguntas en una lista ordenada, recordando la sección.
  const preguntas: FlatPregunta[] = useMemo(() => {
    if (!prueba) return [];
    return prueba.secciones
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .flatMap((s) =>
        s.preguntas
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .map((p) => ({ ...p, seccionTitulo: s.titulo, seccionTipo: s.tipo })),
      );
  }, [prueba]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [enviando, setEnviando] = useState(false);
  const startRef = useRef<number>(Date.now());

  // Reinicia el cronómetro de la pregunta al cambiar de pregunta.
  useEffect(() => {
    startRef.current = Date.now();
  }, [idx]);

  const total = preguntas.length;
  const preg = preguntas[idx];
  const respondidas = Object.keys(answers).filter(
    (k) => (answers[Number(k)] ?? "").trim() !== "",
  ).length;

  function setAnswer(pid: number, val: string) {
    setAnswers((prev) => ({ ...prev, [pid]: val }));
  }

  async function submitActual() {
    if (!preg) return;
    const val = (answers[preg.id] ?? "").trim();
    if (val === "") return;
    const tiempo = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
    try {
      await responder.mutateAsync({
        sesionId,
        token,
        dto: { pregunta_id: preg.id, contenido_texto: val, tiempo_segundos: tiempo },
      });
    } catch {
      /* fallo individual no bloquea la navegación */
    }
  }

  async function goTo(newIdx: number) {
    setEnviando(true);
    await submitActual();
    setEnviando(false);
    setIdx(newIdx);
  }

  async function handleFinalizar() {
    setEnviando(true);
    await submitActual();
    try {
      await finalizar.mutateAsync({ sesionId, token });
    } catch {
      /* ignore */
    }
    setEnviando(false);
    onFinalizar();
  }

  if (!prueba || total === 0 || !preg)
    return <Centro>Esta convocatoria todavía no tiene preguntas asignadas.</Centro>;

  const esUltima = idx === total - 1;

  return (
    <div style={wrap}>
      <div style={inner}>
        {/* Encabezado + progreso */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 2px", fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)" }}>
            {prueba.titulo}
          </h2>
          <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
            Sección: {preg.seccionTitulo} · {respondidas}/{total} respondidas
          </p>
          <div style={{ height: 6, background: "var(--color-border)", borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
            <div style={{ height: "100%", width: `${((idx + 1) / total) * 100}%`, background: "var(--color-primary)", borderRadius: 3, transition: "width 0.3s" }} />
          </div>
        </div>

        {/* Tarjeta de la pregunta */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-primary)" }}>
              Pregunta {idx + 1} de {total}
            </span>
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
              {FORMATO_LABEL[preg.formato] ?? preg.formato} · {preg.puntaje} pts
            </span>
          </div>

          <p style={{ margin: "0 0 16px", fontSize: "var(--font-size-base)", color: "var(--color-text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
            {preg.enunciado}
          </p>

          {renderCampo(preg, answers[preg.id] ?? "", setAnswer)}
        </div>

        {/* Navegación */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <button onClick={() => void goTo(idx - 1)} disabled={idx === 0 || enviando} style={btnSec(idx === 0 || enviando)}>
            ← Anterior
          </button>

          {esUltima ? (
            <button onClick={() => void handleFinalizar()} disabled={enviando} style={btnPrimary(enviando)}>
              {enviando ? "Enviando…" : "✓ Finalizar prueba"}
            </button>
          ) : (
            <button onClick={() => void goTo(idx + 1)} disabled={enviando} style={btnPrimary(enviando)}>
              {enviando ? "Guardando…" : "Siguiente →"}
            </button>
          )}
        </div>

        <p style={{ marginTop: 12, fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textAlign: "center" }}>
          Tu respuesta se guarda al pasar de pregunta. Esta sesión está bajo monitoreo.
        </p>
      </div>
    </div>
  );
}

// ─── Campo de respuesta según el formato ────────────────────────────────────────

function renderCampo(
  preg: FlatPregunta,
  val: string,
  setAnswer: (pid: number, val: string) => void,
): ReactNode {
  const tieneOpciones = preg.opciones.length > 0;

  // Opción múltiple (y V/F si fue creado con opciones) → radios
  if (preg.formato === "opcion_multiple" || (preg.formato === "verdadero_falso" && tieneOpciones)) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {preg.opciones
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .map((op) => {
            const sel = val === String(op.id);
            return (
              <label key={op.id} style={opcionStyle(sel)}>
                <input
                  type="radio"
                  name={`p-${preg.id}`}
                  checked={sel}
                  onChange={() => setAnswer(preg.id, String(op.id))}
                  style={{ accentColor: "var(--color-primary)" }}
                />
                <span style={{ color: "var(--color-text)" }}>{op.texto}</span>
              </label>
            );
          })}
      </div>
    );
  }

  // Verdadero / Falso sin opciones → dos botones
  if (preg.formato === "verdadero_falso") {
    return (
      <div style={{ display: "flex", gap: 10 }}>
        {["Verdadero", "Falso"].map((opt) => {
          const sel = val === opt;
          return (
            <button key={opt} onClick={() => setAnswer(preg.id, opt)} style={{ ...vfStyle(sel), flex: 1 }}>
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  // Código → editor monoespaciado
  if (preg.formato === "codigo") {
    return (
      <textarea
        value={val}
        onChange={(e) => setAnswer(preg.id, e.target.value)}
        placeholder={`// Escribe tu código${preg.lenguaje ? ` en ${preg.lenguaje}` : ""}…`}
        spellCheck={false}
        style={{ ...textareaStyle, fontFamily: "monospace", minHeight: 200 }}
      />
    );
  }

  // Abierta → texto libre
  return (
    <textarea
      value={val}
      onChange={(e) => setAnswer(preg.id, e.target.value)}
      placeholder="Escribe tu respuesta…"
      style={{ ...textareaStyle, minHeight: 140 }}
    />
  );
}

function Centro({ children }: { children: ReactNode }) {
  return (
    <div style={{ ...wrap, alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>{children}</p>
    </div>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────────

const wrap: CSSProperties = {
  width: "100%",
  height: "100%",
  overflow: "auto",
  background: "var(--color-background)",
  display: "flex",
  flexDirection: "column",
  padding: 24,
  boxSizing: "border-box",
};

const inner: CSSProperties = { width: "100%", maxWidth: 720, margin: "0 auto" };

const card: CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
  boxShadow: "var(--shadow-sm)",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  background: "var(--color-background)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: 12,
  fontSize: "var(--font-size-sm)",
  color: "var(--color-text)",
  resize: "vertical",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

function opcionStyle(sel: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    border: `1px solid ${sel ? "var(--color-primary)" : "var(--color-border)"}`,
    borderRadius: "var(--radius-md)",
    background: sel ? "rgba(99,102,241,0.08)" : "var(--color-background)",
    cursor: "pointer",
    fontSize: "var(--font-size-sm)",
  };
}

function vfStyle(sel: boolean): CSSProperties {
  return {
    padding: "12px 0",
    border: `1px solid ${sel ? "var(--color-primary)" : "var(--color-border)"}`,
    borderRadius: "var(--radius-md)",
    background: sel ? "var(--color-primary)" : "var(--color-background)",
    color: sel ? "#fff" : "var(--color-text)",
    cursor: "pointer",
    fontSize: "var(--font-size-base)",
    fontWeight: "var(--font-weight-medium)",
    fontFamily: "inherit",
  };
}

function btnPrimary(disabled: boolean): CSSProperties {
  return {
    padding: "10px 20px",
    background: "var(--color-primary)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "var(--font-size-sm)",
    fontWeight: "var(--font-weight-semibold)",
    fontFamily: "inherit",
    opacity: disabled ? 0.6 : 1,
  };
}

function btnSec(disabled: boolean): CSSProperties {
  return {
    padding: "10px 20px",
    background: "transparent",
    color: "var(--color-text-muted)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "var(--font-size-sm)",
    fontWeight: "var(--font-weight-medium)",
    fontFamily: "inherit",
    opacity: disabled ? 0.5 : 1,
  };
}
