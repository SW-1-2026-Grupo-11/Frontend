import { api } from "@/shared/lib/axios";
import type { Alerta } from "../types";

export const alertasService = {
  getAlertas: async (): Promise<Alerta[]> => {
    const r = await api.get<Alerta[] | { results: Alerta[] }>("/alertas/");
    const data = r.data;
    if (Array.isArray(data)) return data;
    if ("results" in data && Array.isArray(data.results)) return data.results;
    return [];
  },
};
