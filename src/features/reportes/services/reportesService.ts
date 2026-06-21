import { api } from "@/shared/lib/axios";
import type { DecisionReporte, Reporte } from "../types";
import { normalizeReporte } from "../utils/reporteUtils";

type MaybePagedResponse = {
  results?: Reporte[];
} & (Reporte[] | object);

export type DecidirReporteDto = {
  id: number;
  decision: Exclude<DecisionReporte, "pendiente">;
  observaciones?: string;
};

export const reportesService = {
  getReportes: async (page = 1): Promise<Reporte[]> => {
    const r = await api.get<MaybePagedResponse | Reporte[]>("/reportes/", { params: { page } });
    const data = r.data;
    let list: Reporte[] = [];
    if (Array.isArray(data)) list = data;
    else if (
      data &&
      typeof data === "object" &&
      "results" in data &&
      Array.isArray((data as { results: Reporte[] }).results)
    ) {
      list = (data as { results: Reporte[] }).results;
    }
    return list.map((item) => normalizeReporte(item));
  },

  getReporteById: (id: number): Promise<Reporte> =>
    api.get<Reporte>(`/reportes/${id}/`).then((r) => normalizeReporte(r.data)),

  /** Genera (o regenera) el informe de UNA sesión. Idempotente: 1 por sesión. */
  generar: (sesionId: number): Promise<Reporte> =>
    api
      .post<Reporte>("/reportes/generar/", { sesion_id: sesionId })
      .then((r) => normalizeReporte(r.data)),

  /** El evaluador firma su decisión (apto / no_apto). */
  decidir: ({ id, decision, observaciones }: DecidirReporteDto): Promise<Reporte> =>
    api
      .patch<Reporte>(`/reportes/${id}/decidir/`, { decision, observaciones })
      .then((r) => normalizeReporte(r.data)),
};
