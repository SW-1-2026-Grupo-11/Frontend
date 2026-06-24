import { api } from "@/shared/lib/axios";
import type {
  Sesion,
  SesionDetalle,
  ActualizarEstadoDto,
  ActualizarObservacionesDto,
  AgregarInvitadoDto,
  InvitadoSesion,
  RespuestaCalificacion,
  CalificacionResp,
  RegistroAuditoria,
} from "../types";

export const sesionesService = {
  listarSesiones: (): Promise<Sesion[]> =>
    api.get<Sesion[] | { results: Sesion[] }>("/sesiones/").then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : (d as { results: Sesion[] }).results ?? [];
    }),

  getSesionesPorEntrevista: (entrevistaId: number): Promise<Sesion[]> =>
    api
      .get<Sesion[] | { results: Sesion[] }>("/sesiones/", {
        params: { entrevista: entrevistaId },
      })
      .then((r) => {
        const d = r.data;
        return Array.isArray(d) ? d : (d as { results: Sesion[] }).results ?? [];
      }),

  getSesionDetalle: (sesionId: number): Promise<SesionDetalle> =>
    api.get<SesionDetalle>(`/sesiones/${sesionId}/detalle/`).then((r) => r.data),

  actualizarEstado: (sesionId: number, dto: ActualizarEstadoDto): Promise<SesionDetalle> =>
    api
      .patch<SesionDetalle>(`/sesiones/${sesionId}/actualizar-estado/`, dto)
      .then((r) => r.data),

  actualizarObservaciones: (
    sesionId: number,
    dto: ActualizarObservacionesDto,
  ): Promise<SesionDetalle> =>
    api
      .patch<SesionDetalle>(`/sesiones/${sesionId}/observaciones/`, dto)
      .then((r) => r.data),

  agregarInvitado: (sesionId: number, dto: AgregarInvitadoDto): Promise<InvitadoSesion> =>
    api
      .post<InvitadoSesion>(`/sesiones/${sesionId}/agregar-invitado/`, dto)
      .then((r) => r.data),

  // ── Calificación (Capa 4) — usa el api autenticado del evaluador ──
  getRespuestas: (sesionId: number): Promise<RespuestaCalificacion[]> =>
    api.get<RespuestaCalificacion[]>(`/sesiones/${sesionId}/respuestas/`).then((r) => r.data),

  calificarAuto: (sesionId: number): Promise<CalificacionResp> =>
    api.post<CalificacionResp>(`/sesiones/${sesionId}/calificar-auto/`).then((r) => r.data),

  puntuar: (sesionId: number, respuestaId: number, puntaje: number): Promise<CalificacionResp> =>
    api
      .post<CalificacionResp>(`/sesiones/${sesionId}/puntuar/`, {
        respuesta_id: respuestaId,
        puntaje_humano: puntaje,
      })
      .then((r) => r.data),

  getAuditoria: (sesionId: number): Promise<RegistroAuditoria[]> =>
    api.get<RegistroAuditoria[]>(`/sesiones/${sesionId}/auditoria/`).then((r) => r.data),

  // JWT moderador (app), para luego pedir el JWT de Jitsi sin el link público.
  getSupervisorToken: (sesionId: number): Promise<string> =>
    api
      .post<{ token: string }>(`/sesiones/${sesionId}/supervisor-token/`)
      .then((r) => r.data.token),
};
