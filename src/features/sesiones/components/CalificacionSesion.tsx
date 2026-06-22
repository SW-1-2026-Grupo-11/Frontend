import { useState, type CSSProperties } from "react";
import { useGetRespuestas, useCalificarAuto, usePuntuar } from "../hooks/useSesiones";
import type { EstadoCorreccion, RespuestaCalificacion } from "../types";

const FORMATO_LABEL: Record<string, string> = {
  opcion_multiple: "Opción múltiple",
  verdadero_falso: "V / F",
  abierta: "Abierta",
  codigo: "Código",
};

const ESTADO: Record<EstadoCorreccion, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "var(--color-text-muted)" },
  parcial: { label: "Parcial", color: "#f59e0b" },
  corregida: { label: "Corregida", color: "var(--color-success)" },
};

type Props = {
  sesionId: number;
  notaInicial?: number | string | null;
  estadoInicial?: EstadoCorreccion;
};

function numOrDash(v: number | string | null): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  return Number.isNaN(n) ? "—" : String(n);
}

export default function CalificacionSesion({
  sesionId,
  notaInicial = null,
  estadoInicial = "pendiente",
}: Props) {
  const { data: respuestas = [], isLoading } = useGetRespuestas(sesionId);
  const calificarAuto = useCalificarAuto();
  const puntuar = usePuntuar();

  const [nota, setNota] = useState<number | null>(
    notaInicial != null && notaInicial !== "" ? Number(notaInicial) : null,
  );
  const [estado, setEstado] = useState<EstadoCorreccion>(estadoInicial);
  const [edits, setEdits] = useState<Record<number, string>>({});

  function handleAuto() {
    calificarAuto.mutate(sesionId, {
      onSuccess: (d) => {
        setNota(d.nota_final != null ? Number(d.nota_final) : null);
        setEstado(d.estado_correccion);
      },
    });
  }

  function handlePuntuar(r: RespuestaCalificacion) {
    const raw = edits[r.id];
    if (raw === undefined || raw.trim() === "") return;
    const v = Number(raw);
    if (Number.isNaN(v) || v < 0 || v > r.pregunta_puntaje) return;
    puntuar.mutate(
      { sesionId, respuestaId: r.id, puntaje: v },
      {
        onSuccess: (d) => {
          setNota(d.nota_final != null ? Number(d.nota_final) : null);
          setEstado(d.estado_correccion);
        },
      },
    );
  }

  const est = ESTADO[estado] ?? ESTADO.pendiente;

  return (
    <div>
      {/* Cabecera: nota + estado + calificar automático */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: 32, fontWeight: "var(--font-weight-bold)", color: "var(--color-text)" }}>
            {nota != null ? nota : "—"}
          </span>
          <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>/100</span>
          <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Nota de la prueba
          </p>
        </div>
        <span style={{ padding: "3px 12px", borderRadius: 12, fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", background: `${est.color}20`, color: est.color }}>
          {est.label}
        </span>
        <button
          onClick={handleAuto}
          disabled={calificarAuto.isPending}
          style={{ ...btnPrimary, marginLeft: "auto", opacity: calificarAuto.isPending ? 0.6 : 1 }}
        >
          {calificarAuto.isPending ? "Calificando…" : "Calificar automático"}
        </button>
      </div>

      {isLoading ? (
        <p style={muted}>Cargando respuestas…</p>
      ) : respuestas.length === 0 ? (
        <p style={muted}>El candidato todavía no envió respuestas.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {respuestas.map((r, i) => (
            <div key={r.id} style={itemCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text)" }}>
                  {i + 1}. {r.pregunta_enunciado}
                </span>
                <span style={{ fontSize: 10, color: "var(--color-text-muted)", flexShrink: 0, whiteSpace: "nowrap" }}>
                  {FORMATO_LABEL[r.pregunta_formato] ?? r.pregunta_formato} · {r.pregunta_puntaje} pts
                </span>
              </div>

              {/* Respuesta del candidato */}
              <div style={answerBox}>
                {r.respuesta_legible ? (
                  r.respuesta_legible
                ) : (
                  <em style={{ color: "var(--color-text-muted)" }}>(sin responder)</em>
                )}
              </div>

              {/* Puntajes + edición */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  IA: <strong style={{ color: "var(--color-text)" }}>{numOrDash(r.puntaje_ia)}</strong>
                </span>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  Final: <strong style={{ color: "var(--color-primary)" }}>{numOrDash(r.puntaje_final)}</strong>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                  <input
                    type="number"
                    min={0}
                    max={r.pregunta_puntaje}
                    placeholder={`0–${r.pregunta_puntaje}`}
                    value={edits[r.id] ?? (r.puntaje_humano ?? "")}
                    onChange={(e) => setEdits((p) => ({ ...p, [r.id]: e.target.value }))}
                    style={numInput}
                  />
                  <button
                    onClick={() => handlePuntuar(r)}
                    disabled={puntuar.isPending}
                    style={{ ...btnSec, opacity: puntuar.isPending ? 0.6 : 1 }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────────

const muted: CSSProperties = {
  color: "var(--color-text-muted)",
  fontSize: "var(--font-size-sm)",
  margin: 0,
};

const itemCard: CSSProperties = {
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: 12,
  background: "var(--color-background)",
};

const answerBox: CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  padding: "8px 10px",
  fontSize: "var(--font-size-sm)",
  color: "var(--color-text)",
  whiteSpace: "pre-wrap",
  maxHeight: 160,
  overflow: "auto",
};

const numInput: CSSProperties = {
  width: 80,
  padding: "6px 8px",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-text)",
  fontSize: "var(--font-size-sm)",
  fontFamily: "inherit",
  outline: "none",
};

const btnPrimary: CSSProperties = {
  padding: "8px 16px",
  background: "var(--color-primary)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  fontSize: "var(--font-size-sm)",
  fontWeight: "var(--font-weight-semibold)",
  fontFamily: "inherit",
};

const btnSec: CSSProperties = {
  padding: "6px 12px",
  background: "transparent",
  color: "var(--color-primary)",
  border: "1px solid var(--color-primary)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  fontSize: "var(--font-size-xs)",
  fontWeight: "var(--font-weight-medium)",
  fontFamily: "inherit",
};
