import { useQuery } from "@tanstack/react-query";
import { alertasService } from "../services/alertasService";

const BASE_KEY = ["alertas"] as const;

export function useGetAlertas() {
  return useQuery({
    queryKey: BASE_KEY,
    queryFn: () => alertasService.getAlertas(),
  });
}
