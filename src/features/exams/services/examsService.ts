import { api } from "@/shared/lib/axios";
import type { PaginatedResponse } from "@/shared/types/api";
import type {
  Prueba,
  CreatePruebaDto,
  UpdatePruebaDto,
  Seccion,
  CreateSeccionDto,
  UpdateSeccionDto,
  Pregunta,
  CreatePreguntaDto,
  UpdatePreguntaDto,
  Opcion,
  CreateOpcionDto,
  UpdateOpcionDto,
} from "../types";

export const examsService = {
  getPruebas: (page = 1): Promise<Prueba[]> =>
    api
      .get<PaginatedResponse<Prueba>>("/pruebas/pruebas/", { params: { page } })
      .then((r) => r.data.results),

  getPruebaById: (id: number): Promise<Prueba> =>
    api.get<Prueba>(`/pruebas/pruebas/${id}/`).then((r) => r.data),

  createPrueba: (dto: CreatePruebaDto): Promise<Prueba> =>
    api.post<Prueba>("/pruebas/pruebas/", dto).then((r) => r.data),

  updatePrueba: (id: number, dto: UpdatePruebaDto): Promise<Prueba> =>
    api.put<Prueba>(`/pruebas/pruebas/${id}/`, dto).then((r) => r.data),

  patchPrueba: (id: number, dto: UpdatePruebaDto): Promise<Prueba> =>
    api.patch<Prueba>(`/pruebas/pruebas/${id}/`, dto).then((r) => r.data),

  deletePrueba: (id: number): Promise<void> =>
    api.delete(`/pruebas/pruebas/${id}/`).then(() => undefined),

  // ── Contenido: secciones (traen sus preguntas y opciones anidadas) ──
  getSecciones: (pruebaId: number): Promise<Seccion[]> =>
    api
      .get<PaginatedResponse<Seccion>>("/pruebas/secciones/", {
        params: { prueba: pruebaId },
      })
      .then((r) => r.data.results),

  createSeccion: (dto: CreateSeccionDto): Promise<Seccion> =>
    api.post<Seccion>("/pruebas/secciones/", dto).then((r) => r.data),

  updateSeccion: (id: number, dto: UpdateSeccionDto): Promise<Seccion> =>
    api.patch<Seccion>(`/pruebas/secciones/${id}/`, dto).then((r) => r.data),

  deleteSeccion: (id: number): Promise<void> =>
    api.delete(`/pruebas/secciones/${id}/`).then(() => undefined),

  // ── Preguntas ──
  createPregunta: (dto: CreatePreguntaDto): Promise<Pregunta> =>
    api.post<Pregunta>("/pruebas/preguntas/", dto).then((r) => r.data),

  updatePregunta: (id: number, dto: UpdatePreguntaDto): Promise<Pregunta> =>
    api.patch<Pregunta>(`/pruebas/preguntas/${id}/`, dto).then((r) => r.data),

  deletePregunta: (id: number): Promise<void> =>
    api.delete(`/pruebas/preguntas/${id}/`).then(() => undefined),

  // ── Opciones ──
  createOpcion: (dto: CreateOpcionDto): Promise<Opcion> =>
    api.post<Opcion>("/pruebas/opciones/", dto).then((r) => r.data),

  updateOpcion: (id: number, dto: UpdateOpcionDto): Promise<Opcion> =>
    api.patch<Opcion>(`/pruebas/opciones/${id}/`, dto).then((r) => r.data),

  deleteOpcion: (id: number): Promise<void> =>
    api.delete(`/pruebas/opciones/${id}/`).then(() => undefined),
};
