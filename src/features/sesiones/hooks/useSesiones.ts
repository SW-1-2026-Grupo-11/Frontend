import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sesionesService } from "../services/sesionesService";
import env from "@/config/env";
import type {
  ActualizarEstadoDto,
  ActualizarObservacionesDto,
  AgregarInvitadoDto,
  CrearSesionDto,
  Sesion,
  PruebaCandidato,
  ResponderDto,
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

// El candidato ENTRA → su sesión NACE aquí (Capa 3). Usa fetch directo con el
// JWT del invitado (no pasa por el interceptor Bearer del usuario autenticado).
export function useIngresarSesion() {
  return useMutation({
    mutationFn: async ({ token }: { token: string }): Promise<Sesion> => {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 12000);
      try {
        const res = await fetch(`${env.API_URL}/sesiones/ingresar/`, {
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
            /* respuesta sin cuerpo JSON */
          }
          throw new Error(detail);
        }
        return (await res.json()) as Sesion;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new Error(
            "El servidor no respondió (timeout 12s). Revisa que el backend esté arriba o avisa al evaluador.",
          );
        }
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    },
  });
}

// ─── Rendir prueba (Capa 3c) — todo con el JWT del invitado ────────────────────

// Contenido de la prueba para que el candidato la rinda (sin respuestas correctas)
export function useGetPruebaCandidato(sesionId: number | undefined, token: string | null) {
  return useQuery({
    queryKey: [...BASE_KEY, "prueba-candidato", sesionId] as const,
    queryFn: async (): Promise<PruebaCandidato> => {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 12000);
      try {
        const res = await fetch(`${env.API_URL}/sesiones/${sesionId}/prueba/`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });
        if (!res.ok) {
          let detail = `HTTP ${res.status}`;
          try {
            const e = (await res.json()) as { detail?: string };
            if (e?.detail) detail = e.detail;
          } catch {
            /* sin cuerpo JSON */
          }
          throw new Error(detail);
        }
        return (await res.json()) as PruebaCandidato;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new Error("Timeout (12s) al cargar la prueba.");
        }
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    },
    enabled: !!sesionId && !!token,
    retry: false,
  });
}

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
