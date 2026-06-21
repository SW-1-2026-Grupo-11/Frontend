import type { Alerta } from "@/features/alertas";
import type { Reporte } from "../types";

/** Id de la entrevista del informe (derivado de la sesión en el back). */
export function getEntrevistaId(reporte: Reporte): number | undefined {
  const id = reporte.entrevista_id;
  return id != null && id > 0 ? Number(id) : undefined;
}

/** Passthrough: el back ya devuelve la forma correcta (anclada en sesión). */
export function normalizeReporte(raw: Reporte): Reporte {
  return raw;
}

/**
 * Alertas que pertenecen a este informe = las de su SESIÓN (M5 ligó las alertas
 * directo a la sesión, así que ya no hace falta el truco del SessionID en texto).
 */
export function alertasForReporte(alertas: Alerta[], reporte: Reporte): Alerta[] {
  if (reporte.sesion == null) return [];
  return alertas.filter((a) => a.sesion === reporte.sesion);
}
