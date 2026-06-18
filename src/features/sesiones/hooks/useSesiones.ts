import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sesionesService } from "../services/sesionesService";
import env from "@/config/env";
import type {
  ActualizarEstadoDto,
  ActualizarObservacionesDto,
  AgregarInvitadoDto,
  Sesion,
  ResponderDto,
} from "../types";

const BASE_KEY = ["sesiones"] as const;

export function useGetSesiones() {
  return useQuery({
    queryKey: BASE_KEY,
    queryFn: () => sesionesService.listarSesiones(),
  });
}

// Todas las sesiones de una convocatoria (para el detalle: candidato → su sesión)
export function useGetSesionesDeConvocatoria(entrevistaId: number) {
  return useQuery({
    queryKey: [...BASE_KEY, "de-convocatoria", entrevistaId] as const,
    queryFn: () => sesionesService.getSesionesPorEntrevista(entrevistaId),
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

// ─── Rendir prueba (Capa 3c) — todo con el JWT del invitado ────────────────────

// Enviar (o actualizar) la respuesta de una pregunta
export function useResponder() {
  return useMutation({
    mutationFn: async ({
      sesionId,
      token,
      dto,
    }: {
      sesionId: number;
      token: string;
      dto: ResponderDto;
    }) => {
      const res = await fetch(`${env.API_URL}/sesiones/${sesionId}/responder/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...dto }),
      });
      if (!res.ok) throw new Error("Error al enviar la respuesta");
      return res.json() as Promise<unknown>;
    },
  });
}

// El candidato termina la prueba → sesión finalizada
export function useFinalizarCandidato() {
  return useMutation({
    mutationFn: async ({ sesionId, token }: { sesionId: number; token: string }) => {
      const res = await fetch(`${env.API_URL}/sesiones/${sesionId}/finalizar-candidato/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error("Error al finalizar la prueba");
      return res.json() as Promise<Sesion>;
    },
  });
}

// ─── Calificación (Capa 4b) — lado evaluador (api autenticado) ──────────────────

export function useGetRespuestas(sesionId: number) {
  return useQuery({
    queryKey: [...BASE_KEY, sesionId, "respuestas"] as const,
    queryFn: () => sesionesService.getRespuestas(sesionId),
    enabled: sesionId > 0,
  });
}

export function useCalificarAuto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sesionId: number) => sesionesService.calificarAuto(sesionId),
    onSuccess: (_data, sesionId) =>
      queryClient.invalidateQueries({ queryKey: [...BASE_KEY, sesionId] }),
  });
}

export function usePuntuar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sesionId,
      respuestaId,
      puntaje,
    }: {
      sesionId: number;
      respuestaId: number;
      puntaje: number;
    }) => sesionesService.puntuar(sesionId, respuestaId, puntaje),
    onSuccess: (_data, { sesionId }) =>
      queryClient.invalidateQueries({ queryKey: [...BASE_KEY, sesionId] }),
  });
}

export function useGetAuditoria(sesionId: number) {
  return useQuery({
    queryKey: [...BASE_KEY, sesionId, "auditoria"] as const,
    queryFn: () => sesionesService.getAuditoria(sesionId),
    enabled: sesionId > 0,
  });
}
