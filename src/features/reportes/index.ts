export type { Reporte, NivelRiesgo } from "./types";
export type { GenerarReporteDto } from "./services/reportesService";
export { reportesService } from "./services/reportesService";
export { useGetReportes, useGetReporteById } from "./hooks/useReportes";
export { useGenerarReporte } from "./hooks/useGenerarReporte";
export { getEntrevistaId, alertasForReporte } from "./utils/reporteUtils";
export { default as ReportesTable } from "./components/ReportesTable";
export { default as ReporteDetalleModal } from "./components/ReporteDetalleModal";
