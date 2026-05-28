import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportesService } from "../services/reportesService";

export function useGenerarReporteIA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entrevistaId: number) => reportesService.generarPorEntrevista(entrevistaId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}
