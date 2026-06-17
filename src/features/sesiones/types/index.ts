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
  nota_final: number | string | null;
  estado_correccion: EstadoCorreccion;
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

// ─── Rendir prueba (Capa 3c) — vista del candidato, sin respuestas correctas ───

export type FormatoPregunta =
  | "opcion_multiple"
  | "verdadero_falso"
  | "abierta"
  | "codigo";

export type OpcionCandidato = {
  id: number;
  texto: string;
  orden: number;
};

export type PreguntaCandidato = {
  id: number;
  enunciado: string;
  formato: FormatoPregunta;
  puntaje: number;
  orden: number;
  lenguaje: string | null;
  opciones: OpcionCandidato[];
};

export type SeccionCandidato = {
  id: number;
  titulo: string;
  tipo: string;
  descripcion: string | null;
  orden: number;
  peso_porcentual: number;
  preguntas: PreguntaCandidato[];
};

export type PruebaCandidato = {
  id: number;
  titulo: string;
  descripcion: string | null;
  duracion_minutos: number;
  secciones: SeccionCandidato[];
};

export type ResponderDto = {
  pregunta_id: number;
  contenido_texto?: string;
  contenido_url?: string;
  casos_pasados?: number;
  tiempo_segundos?: number;
};

// ─── Calificación (Capa 4) — lado evaluador ────────────────────────────────────

export type EstadoCorreccion = "pendiente" | "parcial" | "corregida";

export type RespuestaCalificacion = {
  id: number;
  sesion: number;
  pregunta: number;
  pregunta_enunciado: string;
  pregunta_formato: FormatoPregunta;
  pregunta_puntaje: number;
  contenido_texto: string | null;
  respuesta_legible: string | null;
  contenido_url: string | null;
  casos_pasados: number | null;
  tiempo_segundos: number | null;
  puntaje_ia: string | null; // DecimalField → string en el JSON de DRF
  puntaje_humano: string | null;
  feedback_ia: string | null;
  puntaje_final: number | null;
  enviado_en: string;
};

export type CalificacionResp = {
  nota_final: number | null;
  estado_correccion: EstadoCorreccion;
  calificadas_auto?: number;
};

export type RegistroAuditoria = {
  id: number;
  actor: string;
  accion: string;
  entidad: string | null;
  entidad_id: number | null;
  detalle: Record<string, unknown> | null;
  timestamp: string;
};
