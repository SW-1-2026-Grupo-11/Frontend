export type TipoPrueba = "teorica" | "tecnica" | "mixta";
export type AreaPrueba = "programacion" | "negocio" | "juridica";
export type NivelPrueba = "basico" | "intermedio" | "avanzado";
export type EstadoPrueba = "borrador" | "activa" | "inactiva" | "archivada";

export type Prueba = {
  id: number;
  titulo: string;
  descripcion: string;
  creada_por: number;
  tipo: TipoPrueba;
  area: AreaPrueba;
  nivel: NivelPrueba;
  duracion_minutos: number;
  puntaje_maximo: number;
  estado: EstadoPrueba;
  reutilizable: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
};

export type CreatePruebaDto = {
  titulo: string;
  descripcion: string;
  creada_por: number;
  tipo: TipoPrueba;
  area: AreaPrueba;
  nivel: NivelPrueba;
  duracion_minutos: number;
  puntaje_maximo: number;
  estado?: EstadoPrueba;
  reutilizable?: boolean;
};

export type UpdatePruebaDto = Partial<Omit<CreatePruebaDto, "creada_por">>;

// ── Módulo 2: contenido de la prueba (secciones / preguntas / opciones) ──

export type FormatoPregunta =
  | "opcion_multiple"
  | "verdadero_falso"
  | "abierta"
  | "codigo";

export type Opcion = {
  id: number;
  pregunta: number;
  texto: string;
  es_correcta: boolean;
  orden: number;
};

export type Pregunta = {
  id: number;
  seccion: number;
  enunciado: string;
  formato: FormatoPregunta;
  puntaje: number;
  orden: number;
  rubrica: unknown | null;
  lenguaje: string | null;
  casos_prueba: unknown | null;
  opciones: Opcion[];
  fecha_creacion: string;
  fecha_actualizacion: string;
};

export type TipoSeccion = "teorica" | "practica";

export type Seccion = {
  id: number;
  prueba: number;
  titulo: string;
  tipo: TipoSeccion;
  descripcion: string | null;
  orden: number;
  peso_porcentual: number;
  preguntas: Pregunta[];
  fecha_creacion: string;
  fecha_actualizacion: string;
};

export type CreateSeccionDto = {
  prueba: number;
  titulo: string;
  tipo?: TipoSeccion;
  descripcion?: string;
  orden?: number;
  peso_porcentual?: number;
};

export type UpdateSeccionDto = Partial<Omit<CreateSeccionDto, "prueba">>;

export type CreatePreguntaDto = {
  seccion: number;
  enunciado: string;
  formato: FormatoPregunta;
  puntaje?: number;
  orden?: number;
  rubrica?: unknown;
  lenguaje?: string;
  casos_prueba?: unknown;
};

export type UpdatePreguntaDto = Partial<Omit<CreatePreguntaDto, "seccion">>;

export type CreateOpcionDto = {
  pregunta: number;
  texto: string;
  es_correcta?: boolean;
  orden?: number;
};

export type UpdateOpcionDto = Partial<Omit<CreateOpcionDto, "pregunta">>;
