import { api } from "@/shared/lib/axios";
import type { Alerta, AlertasFilter } from "../types";

export const alertasService = {
  getAlertas: async (filter?: AlertasFilter): Promise<Alerta[]> => {
    const r = await api.get<Alerta[] | { results: Alerta[] }>("/alertas/", {
      params: filter,
    });
    const data = r.data;
    if (Array.isArray(data)) return data;
    if ("results" in data && Array.isArray(data.results)) return data.results;
    return [];
  },
};
