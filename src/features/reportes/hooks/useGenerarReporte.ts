import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportesService, type GenerarReporteDto } from "../services/reportesService";

const BASE_KEY = ["reportes"] as const;

export function useGenerarReporte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: GenerarReporteDto) => reportesService.generarResumen(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASE_KEY });
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
  });
}
