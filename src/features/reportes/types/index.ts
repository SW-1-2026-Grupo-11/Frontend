export type NivelRiesgo = "bajo" | "medio" | "alto";

export type Reporte = {
  id: number;
  entrevista_id?: number;
  participante_id?: number;
  resumen_general: string;
  resumen_participante: string;
  recomendaciones: string;
  nivel_riesgo: NivelRiesgo | null;
  puntaje_atencion?: number | null;
  puntaje_sospecha?: number | null;
  fecha_creacion: string;
};
