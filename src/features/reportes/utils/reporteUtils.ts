import type { Alerta } from "@/features/alertas";
import type { Reporte } from "../types";

/** API puede devolver `entrevista` en lugar de `entrevista_id`. */
export function getEntrevistaId(reporte: Reporte): number | undefined {
  const raw = reporte as Reporte & { entrevista?: number };
  const id = raw.entrevista_id ?? raw.entrevista;
  return id != null && id > 0 ? Number(id) : undefined;
}

export function normalizeReporte(raw: Reporte & { entrevista?: number; participante?: number }): Reporte {
  return {
    ...raw,
    entrevista_id: getEntrevistaId(raw),
    participante_id: raw.participante_id ?? raw.participante,
  };
}

/** Extrae el session_id del sufijo almacenado en resumen_general. */
export function getSessionIdFromReporte(reporte: Reporte): string | undefined {
  const match = reporte.resumen_general?.match(/\nSessionID:\s*([a-f0-9-]{36})/i);
  return match?.[1];
}

/** Devuelve el resumen_general limpio, sin el sufijo SessionID. */
export function cleanResumenGeneral(text: string): string {
  return text.replace(/\nSessionID:\s*[a-f0-9-]{36}/i, "").trim();
}

/**
 * Filtra las alertas que corresponden a este reporte específico.
 * Si el reporte tiene session_id (extraído de resumen_general), filtra por sesión.
 * De lo contrario, filtra solo por entrevista_id.
 */
export function alertasForReporte(alertas: Alerta[], reporte: Reporte): Alerta[] {
  const entrevistaId = getEntrevistaId(reporte);
  if (!entrevistaId) return [];

  const sessionId = getSessionIdFromReporte(reporte);

  return alertas.filter((a) => {
    if (Number(a.entrevista) !== entrevistaId) return false;
    if (!sessionId) return true;
    const ej = a.evidencia_json as Record<string, unknown> | undefined;
    return ej?.session_id === sessionId;
  });
}
