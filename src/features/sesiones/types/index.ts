export type EstadoSesion = "activa" | "iniciada" | "finalizada";

export type InvitadoSesion = {
  id: number;
  nombre: string;
  email: string;
  estado: "pendiente" | "aceptado" | "rechazado" | "completado";
  link_invitacion: string | null;
};

export type Sesion = {
  id: number;
  entrevista: number;
  creada_por: number;
  room_name: string;
  estado: EstadoSesion;
  observaciones_internas: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  fecha_actualizacion: string;
};

export type SesionDetalle = {
  id: number;
  entrevista: number;
  room_name: string;
  estado: EstadoSesion;
  titulo_entrevista: string;
  descripcion_entrevista: string | null;
  evaluador_nombre: string | null;
  evaluador_email: string | null;
  duracion_minutos: number;
  fecha_programada: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  observaciones_internas: string | null;
  link_supervisor?: string | null;
  invitados: InvitadoSesion[];
};

export type CrearSesionDto = {
  entrevista_id: number;
};

export type ActualizarEstadoDto = {
  nuevo_estado: EstadoSesion;
};

export type ActualizarObservacionesDto = {
  observaciones: string;
};

export type AgregarInvitadoDto = {
  nombre: string;
  email: string;
};
