import { api } from "@/shared/lib/axios";
import type {
  Sesion,
  SesionDetalle,
  CrearSesionDto,
  ActualizarEstadoDto,
  ActualizarObservacionesDto,
  AgregarInvitadoDto,
  InvitadoSesion,
} from "../types";

export const sesionesService = {
  listarSesiones: (): Promise<Sesion[]> =>
    api.get<Sesion[] | { results: Sesion[] }>("/sesiones/").then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : (d as { results: Sesion[] }).results ?? [];
    }),

  crearSesion: (dto: CrearSesionDto): Promise<Sesion> =>
    api.post<Sesion>("/sesiones/crear/", dto).then((r) => r.data),

  getSesionPorEntrevista: (entrevistaId: number): Promise<Sesion> =>
    api.get<Sesion>(`/sesiones/${entrevistaId}/`).then((r) => r.data),

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

  finalizarSesion: (sesionId: number): Promise<Sesion> =>
    api.patch<Sesion>(`/sesiones/${sesionId}/finalizar/`).then((r) => r.data),
};
