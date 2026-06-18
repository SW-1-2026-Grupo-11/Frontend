export type EstadoEntrevista =
  | "borrador"
  | "programada"
  | "en_proceso"
  | "finalizada"
  | "cancelada";

export type Entrevista = {
  id: number;
  titulo: string;
  descripcion: string;
  creada_por: number;
  prueba: number | null;
  prueba_nombre?: string | null;
  estado: EstadoEntrevista;
  fecha_programada: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
};

export type CreateEntrevistaDto = {
  titulo: string;
  descripcion: string;
  creada_por: number;
  estado?: EstadoEntrevista;
  fecha_programada?: string | null;
};

export type UpdateEntrevistaDto = Partial<Omit<CreateEntrevistaDto, "creada_por">>;

export type ProgramarInvitadoDto = {
  nombre: string;
  email: string;
};

export type ProgramarEntrevistaDto = {
  titulo: string;
  descripcion?: string;
  evaluador_id: number;
  prueba_id?: number;
  fecha_programada: string;
  duracion_minutos: number;
  invitados: ProgramarInvitadoDto[];
};

export type InvitadoProgramado = {
  id: number;
  nombre: string;
  email: string;
  estado: string;
  link_invitacion: string | null;
};

export type ProgramarEntrevistaResponse = {
  entrevista: Entrevista;
  invitados: InvitadoProgramado[];
  link_supervisor: string;
  emails_encolados: boolean;
  mensaje: string;
};
