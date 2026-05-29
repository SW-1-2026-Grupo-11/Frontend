import { useQuery } from "@tanstack/react-query";
import { alertasService } from "../services/alertasService";
import type { AlertasFilter } from "../types";
import { ALERTAS } from "@/config/constants";

const BASE_KEY = ["alertas"] as const;

export function useGetAlertas() {
  return useQuery({
    queryKey: BASE_KEY,
    queryFn: () => alertasService.getAlertas().catch(() => []),
    retry: false,
  });
}

export function useAlertas(filter?: AlertasFilter) {
  return useQuery({
    queryKey: [...BASE_KEY, filter] as const,
    queryFn: () => alertasService.getAlertas(filter).catch(() => []),
    refetchInterval: ALERTAS.POLLING_INTERVAL_MS,
    retry: false,
  });
}
