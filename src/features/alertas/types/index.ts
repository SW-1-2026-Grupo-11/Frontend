export type Severidad = "alta" | "media" | "baja";

export type Alerta = {
  id: number;
  entrevista: number;
  participante: number;
  tipo_alerta: string;
  severidad: Severidad;
  origen: string;
  descripcion: string;
  evidencia_json?: Record<string, unknown>;
  timestamp_alerta: string;
  fecha_creacion: string;
};
