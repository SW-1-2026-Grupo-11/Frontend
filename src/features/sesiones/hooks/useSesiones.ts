import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sesionesService } from "../services/sesionesService";
import env from "@/config/env";
import type {
  ActualizarEstadoDto,
  ActualizarObservacionesDto,
  AgregarInvitadoDto,
  CrearSesionDto,
} from "../types";

const BASE_KEY = ["sesiones"] as const;

export function useGetSesiones() {
  return useQuery({
    queryKey: BASE_KEY,
    queryFn: () => sesionesService.listarSesiones(),
  });
}

export function useCrearSesion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CrearSesionDto) => sesionesService.crearSesion(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

export function useGetSesionPorEntrevista(entrevistaId: number) {
  return useQuery({
    queryKey: [...BASE_KEY, "entrevista", entrevistaId] as const,
    queryFn: () => sesionesService.getSesionPorEntrevista(entrevistaId),
    enabled: entrevistaId > 0,
  });
}

export function useGetSesionDetalle(sesionId: number) {
  return useQuery({
    queryKey: [...BASE_KEY, sesionId, "detalle"] as const,
    queryFn: () => sesionesService.getSesionDetalle(sesionId),
    enabled: sesionId > 0,
  });
}

export function useActualizarEstadoSesion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sesionId, dto }: { sesionId: number; dto: ActualizarEstadoDto }) =>
      sesionesService.actualizarEstado(sesionId, dto),
    onSuccess: (_, { sesionId }) => {
      queryClient.invalidateQueries({ queryKey: [...BASE_KEY, sesionId] });
    },
  });
}

export function useActualizarObservaciones() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sesionId, dto }: { sesionId: number; dto: ActualizarObservacionesDto }) =>
      sesionesService.actualizarObservaciones(sesionId, dto),
    onSuccess: (_, { sesionId }) => {
      queryClient.invalidateQueries({ queryKey: [...BASE_KEY, sesionId] });
    },
  });
}

export function useAgregarInvitado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sesionId, dto }: { sesionId: number; dto: AgregarInvitadoDto }) =>
      sesionesService.agregarInvitado(sesionId, dto),
    onSuccess: (_, { sesionId }) => {
      queryClient.invalidateQueries({ queryKey: [...BASE_KEY, sesionId] });
    },
  });
}

export function useFinalizarSesion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sesionId: number) => sesionesService.finalizarSesion(sesionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

// Usa fetch directo con el JWT del invitado — no pasa por el interceptor Bearer del usuario autenticado
export function useMarcarAceptado() {
  return useMutation({
    mutationFn: async ({ invitadoId, token }: { invitadoId: number; token: string }) => {
      const res = await fetch(
        `${env.API_URL}/entrevistas/invitados/${invitadoId}/marcar-aceptado/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!res.ok) throw new Error("Error al marcar invitado como aceptado");
      return res.json() as Promise<unknown>;
    },
  });
}
