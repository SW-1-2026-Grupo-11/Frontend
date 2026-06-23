export type {
  Prueba,
  TipoPrueba,
  AreaPrueba,
  NivelPrueba,
  EstadoPrueba,
  CreatePruebaDto,
  UpdatePruebaDto,
} from "./types";
export { examsService } from "./services/examsService";
export {
  useGetPruebas,
  useGetPruebaById,
  useCreatePrueba,
  useUpdatePrueba,
  useDeletePrueba,
} from "./hooks/useExams";
export { default as PruebasTable } from "./components/PruebasTable";
export { default as PruebaDetailModal } from "./components/PruebaDetailModal";
export { default as PruebaEditor } from "./components/PruebaEditor";
