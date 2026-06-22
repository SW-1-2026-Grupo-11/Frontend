export type { Reporte, NivelRiesgo, DecisionReporte } from "./types";
export type { DecidirReporteDto } from "./services/reportesService";
export { reportesService } from "./services/reportesService";
export { useGetReportes, useGetReporteById } from "./hooks/useReportes";
export { useGenerarReporte, useDecidirReporte } from "./hooks/useGenerarReporte";
export { useGenerarReporteIA } from "./hooks/useGenerarReporteIA";
export { getEntrevistaId, alertasForReporte } from "./utils/reporteUtils";
export { default as ReportesTable } from "./components/ReportesTable";
export { default as ReporteDetalleModal } from "./components/ReporteDetalleModal";
