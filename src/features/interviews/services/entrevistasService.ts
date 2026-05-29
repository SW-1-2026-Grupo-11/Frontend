import { api } from "@/shared/lib/axios";
import type { PaginatedResponse } from "@/shared/types/api";
import type {
  Entrevista,
  PruebaEntrevista,
  CreateEntrevistaDto,
  UpdateEntrevistaDto,
  AsignarPruebaDto,
  ProgramarEntrevistaDto,
  ProgramarEntrevistaResponse,
  InvitadoProgramado,
} from "../types";

export const entrevistasService = {
  getEntrevistas: (page = 1): Promise<Entrevista[]> =>
    api
      .get<PaginatedResponse<Entrevista>>("/entrevistas/entrevistas/", { params: { page } })
      .then((r) => r.data.results),

  getEntrevistaById: (id: number): Promise<Entrevista> =>
    api.get<Entrevista>(`/entrevistas/entrevistas/${id}/`).then((r) => r.data),

  createEntrevista: (dto: CreateEntrevistaDto): Promise<Entrevista> =>
    api.post<Entrevista>("/entrevistas/entrevistas/", dto).then((r) => r.data),

  updateEntrevista: (id: number, dto: UpdateEntrevistaDto): Promise<Entrevista> =>
    api.put<Entrevista>(`/entrevistas/entrevistas/${id}/`, dto).then((r) => r.data),

  patchEntrevista: (id: number, dto: UpdateEntrevistaDto): Promise<Entrevista> =>
    api.patch<Entrevista>(`/entrevistas/entrevistas/${id}/`, dto).then((r) => r.data),

  deleteEntrevista: (id: number): Promise<void> =>
    api.delete(`/entrevistas/entrevistas/${id}/`).then(() => undefined),

  getPruebasEntrevista: (entrevistaId: number): Promise<PruebaEntrevista[]> =>
    api
      .get<PaginatedResponse<PruebaEntrevista>>("/pruebas/pruebas-entrevista/", {
        params: { entrevista: entrevistaId },
      })
      .then((r) => r.data.results),

  asignarPrueba: (dto: AsignarPruebaDto): Promise<PruebaEntrevista> =>
    api.post<PruebaEntrevista>("/pruebas/pruebas-entrevista/", dto).then((r) => r.data),

  removerAsignacion: (pruebaEntrevistaId: number): Promise<void> =>
    api.delete(`/pruebas/pruebas-entrevista/${pruebaEntrevistaId}/`).then(() => undefined),

  programarEntrevista: (dto: ProgramarEntrevistaDto): Promise<ProgramarEntrevistaResponse> =>
    api
      .post<ProgramarEntrevistaResponse>("/entrevistas/entrevistas/programar/", dto)
      .then((r) => r.data),

  getInvitadosPorEntrevista: (entrevistaId: number): Promise<InvitadoProgramado[]> =>
    api
      .get<InvitadoProgramado[] | { results: InvitadoProgramado[] }>("/entrevistas/invitados/", {
        params: { entrevista: entrevistaId },
      })
      .then((r) => {
        const d = r.data;
        return Array.isArray(d) ? d : (d as { results: InvitadoProgramado[] }).results ?? [];
      }),
};
