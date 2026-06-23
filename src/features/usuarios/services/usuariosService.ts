import { api } from "@/shared/lib/axios";
import type { PaginatedResponse } from "@/shared/types/api";
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from "../types";

export type GetUsuariosParams = {
  page?: number;
  search?: string;
  ordering?: string;
};

export const usuariosService = {
  getUsuarios: (params: GetUsuariosParams = {}): Promise<PaginatedResponse<Usuario>> =>
    api
      .get<PaginatedResponse<Usuario>>("/usuarios/usuarios/", { params })
      .then((r) => r.data),

  getUsuarioById: (id: number): Promise<Usuario> =>
    api.get<Usuario>(`/usuarios/usuarios/${id}/`).then((r) => r.data),

  createUsuario: (dto: CreateUsuarioDto): Promise<Usuario> =>
    api.post<Usuario>("/usuarios/usuarios/", dto).then((r) => r.data),

  updateUsuario: (id: number, dto: UpdateUsuarioDto): Promise<Usuario> =>
    api.put<Usuario>(`/usuarios/usuarios/${id}/`, dto).then((r) => r.data),

  patchUsuario: (id: number, dto: UpdateUsuarioDto): Promise<Usuario> =>
    api.patch<Usuario>(`/usuarios/usuarios/${id}/`, dto).then((r) => r.data),

  deleteUsuario: (id: number): Promise<void> =>
    api.delete(`/usuarios/usuarios/${id}/`).then(() => undefined),
};
