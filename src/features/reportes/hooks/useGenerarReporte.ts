import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportesService, type DecidirReporteDto } from "../services/reportesService";

/** Genera (o regenera) el informe de una sesión. Recibe el sesion_id. */
export function useGenerarReporte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sesionId: number) => reportesService.generar(sesionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reportes"] });
      void queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
  });
}

/** El evaluador firma su decisión (apto / no_apto) sobre un informe. */
export function useDecidirReporte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: DecidirReporteDto) => reportesService.decidir(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}
