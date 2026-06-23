import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sesionesService } from "../services/sesionesService";
import env from "@/config/env";
import { ALERTAS } from "@/config/constants";
import type {
  ActualizarEstadoDto,
  ActualizarObservacionesDto,
  AgregarInvitadoDto,
  InvitadoSesion,
  Sesion,
  ResponderDto,
  RendirResp,
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
    refetchInterval: ALERTAS.POLLING_INTERVAL_MS,
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

// Todo-en-uno (Capa 3c): crea/recupera la sesión del candidato y trae su prueba.
// POST /sesiones/rendir/ {token} -> { sesion, prueba }
export function useRendir() {
  return useMutation({
    mutationFn: async (token: string) => {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 12000);
      try {
        const res = await fetch(`${env.API_URL}/sesiones/rendir/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          let detail = `Error ${res.status}`;
          try {
            const e = (await res.json()) as { detail?: string };
            if (e?.detail) detail = e.detail;
          } catch {
            /* sin cuerpo JSON */
          }
          throw new Error(detail);
        }
        return (await res.json()) as RendirResp;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new Error("El servidor no respondió (timeout 12s). Avisa al evaluador.", { cause: err });
        }
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    },
  });
}

// El supervisor (con su JWT de moderador, no el cliente autenticado normal)
// agrega un invitado nuevo a la entrevista desde la sala pública.
export function useAgregarInvitadoPublico() {
  return useMutation({
    mutationFn: async ({
      sesionId,
      token,
      dto,
    }: {
      sesionId: number;
      token: string;
      dto: AgregarInvitadoDto;
    }) => {
      const res = await fetch(`${env.API_URL}/sesiones/${sesionId}/agregar-invitado/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<InvitadoSesion>;
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
