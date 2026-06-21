export type NivelRiesgo = "bajo" | "medio" | "alto";

export type DecisionReporte = "pendiente" | "apto" | "no_apto";

export type Reporte = {
  id: number;
  sesion: number | null;
  candidato_nombre: string | null;
  entrevista_id?: number;
  estado_sesion?: string;
  motivo_cierre?: string | null;
  nota: number | string | null;
  nivel_riesgo: NivelRiesgo | null;
  total_alertas: number;
  puntaje_atencion: number | null;
  puntaje_sospecha: number | null;
  resumen_general: string;
  resumen_participante: string;
  recomendaciones: string;
  decision: DecisionReporte;
  firmado_por: number | null;
  firmado_por_nombre: string | null;
  fecha_firma: string | null;
  observaciones_evaluador: string | null;
  fecha_creacion: string;
  fecha_actualizacion?: string;
};
