import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entrevistasService } from "../services/entrevistasService";
import type {
  AsignarPruebaDto,
  CreateEntrevistaDto,
  ProgramarEntrevistaDto,
  UpdateEntrevistaDto,
} from "../types";

const BASE_KEY = ["entrevistas"] as const;
const ASIGNACIONES_KEY = ["pruebas-entrevista"] as const;

export function useGetEntrevistas(page = 1) {
  return useQuery({
    queryKey: [...BASE_KEY, page] as const,
    queryFn: () => entrevistasService.getEntrevistas(page),
  });
}

export function useGetEntrevistaById(id: number) {
  return useQuery({
    queryKey: [...BASE_KEY, id] as const,
    queryFn: () => entrevistasService.getEntrevistaById(id),
    enabled: Boolean(id),
  });
}

export function useGetPruebasEntrevista(entrevistaId: number) {
  return useQuery({
    queryKey: [...ASIGNACIONES_KEY, entrevistaId] as const,
    queryFn: () => entrevistasService.getPruebasEntrevista(entrevistaId),
    enabled: Boolean(entrevistaId),
  });
}

export function useCreateEntrevista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEntrevistaDto) => entrevistasService.createEntrevista(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

type UpdateVars = { id: number; dto: UpdateEntrevistaDto };

export function useUpdateEntrevista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: UpdateVars) => entrevistasService.updateEntrevista(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

export function useDeleteEntrevista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => entrevistasService.deleteEntrevista(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

export function useAsignarPrueba() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AsignarPruebaDto) => entrevistasService.asignarPrueba(dto),
    onSuccess: (_, dto) => {
      queryClient.invalidateQueries({
        queryKey: [...ASIGNACIONES_KEY, dto.entrevista],
      });
    },
  });
}

export function useRemoverAsignacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entrevistaId: _entrevistaId }: { id: number; entrevistaId: number }) =>
      entrevistasService.removerAsignacion(id),
    onSuccess: (_, { entrevistaId }) => {
      queryClient.invalidateQueries({
        queryKey: [...ASIGNACIONES_KEY, entrevistaId],
      });
    },
  });
}

export function useProgramarEntrevista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ProgramarEntrevistaDto) => entrevistasService.programarEntrevista(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

export function useGetInvitadosPorEntrevista(entrevistaId: number) {
  return useQuery({
    queryKey: ["invitados", entrevistaId] as const,
    queryFn: () => entrevistasService.getInvitadosPorEntrevista(entrevistaId),
    enabled: !!entrevistaId,
    retry: false,
  });
}
