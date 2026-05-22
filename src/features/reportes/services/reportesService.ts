import { api } from "@/shared/lib/axios";
import type { Reporte } from "../types";
import { normalizeReporte } from "../utils/reporteUtils";

type MaybePagedResponse = {
  results?: Reporte[];
} & (Reporte[] | object);

export type GenerarReporteDto = {
  entrevista_id: string;
  participante_id: string;
  puntaje_total: number;
  total_alertas: number;
  nivel_riesgo: string;
  session_id?: string;
};

export const reportesService = {
  getReportes: async (page = 1): Promise<Reporte[]> => {
    const r = await api.get<MaybePagedResponse | Reporte[]>("/reportes/", { params: { page } });
    const data = r.data;
    let list: Reporte[] = [];
    if (Array.isArray(data)) list = data;
    else if (data && typeof data === "object" && "results" in data && Array.isArray((data as { results: Reporte[] }).results)) {
      list = (data as { results: Reporte[] }).results;
    }
    return list.map((item) => normalizeReporte(item));
  },

  getReporteById: (id: number): Promise<Reporte> =>
    api.get<Reporte>(`/reportes/${id}/`).then((r) => normalizeReporte(r.data)),

  /** Persiste el informe en Django (llama al servicio de IA y guarda en BD). */
  generarResumen: (dto: GenerarReporteDto): Promise<Reporte> =>
    api.post<Reporte>("/reportes/resumen/", dto).then((r) => normalizeReporte(r.data)),
};

