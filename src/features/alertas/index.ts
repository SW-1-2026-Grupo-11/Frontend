export type { Alerta, Severidad, TipoAlerta, EvidenciaJSON, AlertasFilter } from "./types";
export { alertasService } from "./services/alertasService";
export { useGetAlertas, useAlertas } from "./hooks/useAlertas";
export { default as AlertasTable } from "./components/AlertasTable";
