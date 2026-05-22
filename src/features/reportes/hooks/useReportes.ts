import { useQuery } from "@tanstack/react-query";
import { reportesService } from "../services/reportesService";

const BASE_KEY = ["reportes"] as const;

export function useGetReportes(page = 1) {
  return useQuery({
    queryKey: [...BASE_KEY, page] as const,
    queryFn: () => reportesService.getReportes(page),
  });
}

export function useGetReporteById(id: number) {
  return useQuery({
    queryKey: [...BASE_KEY, id] as const,
    queryFn: () => reportesService.getReporteById(id),
    enabled: id > 0,
  });
}
