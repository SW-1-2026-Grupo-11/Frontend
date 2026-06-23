import { api } from "@/shared/lib/axios";
import type { PaginatedResponse } from "@/shared/types/api";
import type {
  Entrevista,
  CreateEntrevistaDto,
  UpdateEntrevistaDto,
  ProgramarEntrevistaDto,
  ProgramarEntrevistaResponse,
  InvitadoProgramado,
} from "../types";

export type GetEntrevistasParams = {
  page?: number;
  search?: string;
  ordering?: string;
};

export const entrevistasService = {
  getEntrevistas: (params: GetEntrevistasParams = {}): Promise<PaginatedResponse<Entrevista>> =>
    api
      .get<PaginatedResponse<Entrevista>>("/entrevistas/entrevistas/", { params })
      .then((r) => r.data),

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

  cancelarEntrevista: (id: number): Promise<Entrevista> =>
    api.post<Entrevista>(`/entrevistas/entrevistas/${id}/cancelar/`, {}).then((r) => r.data),

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
