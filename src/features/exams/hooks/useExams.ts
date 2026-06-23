import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examsService } from "../services/examsService";
import type {
  CreatePruebaDto,
  UpdatePruebaDto,
  CreateSeccionDto,
  UpdateSeccionDto,
  CreatePreguntaDto,
  UpdatePreguntaDto,
  CreateOpcionDto,
  UpdateOpcionDto,
} from "../types";

const BASE_KEY = ["pruebas"] as const;
const CONTENIDO_KEY = ["pruebas-contenido"] as const;

export function useGetPruebas(page = 1) {
  return useQuery({
    queryKey: [...BASE_KEY, "list", page] as const,
    queryFn: () => examsService.getPruebas(page),
  });
}

export function useGetPruebaById(id: number) {
  return useQuery({
    queryKey: [...BASE_KEY, "detail", id] as const,
    queryFn: () => examsService.getPruebaById(id),
    enabled: Boolean(id),
  });
}

export function useCreatePrueba() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePruebaDto) => examsService.createPrueba(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

type UpdateVars = { id: number; dto: UpdatePruebaDto };

export function useUpdatePrueba() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: UpdateVars) => examsService.updatePrueba(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

export function useDeletePrueba() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => examsService.deletePrueba(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASE_KEY });
    },
  });
}

// ── Contenido de la prueba: secciones / preguntas / opciones ──

export function useGetSecciones(pruebaId: number) {
  return useQuery({
    queryKey: [...CONTENIDO_KEY, pruebaId] as const,
    queryFn: () => examsService.getSecciones(pruebaId),
    enabled: Boolean(pruebaId),
  });
}

/** Invalida el árbol de contenido para que se refresque tras cualquier cambio. */
function useInvalidarContenido() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CONTENIDO_KEY });
}

export function useCreateSeccion() {
  const invalidar = useInvalidarContenido();
  return useMutation({
    mutationFn: (dto: CreateSeccionDto) => examsService.createSeccion(dto),
    onSuccess: invalidar,
  });
}

export function useUpdateSeccion() {
  const invalidar = useInvalidarContenido();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateSeccionDto }) =>
      examsService.updateSeccion(id, dto),
    onSuccess: invalidar,
  });
}

export function useDeleteSeccion() {
  const invalidar = useInvalidarContenido();
  return useMutation({
    mutationFn: (id: number) => examsService.deleteSeccion(id),
    onSuccess: invalidar,
  });
}

export function useCreatePregunta() {
  const invalidar = useInvalidarContenido();
  return useMutation({
    mutationFn: (dto: CreatePreguntaDto) => examsService.createPregunta(dto),
    onSuccess: invalidar,
  });
}

export function useUpdatePregunta() {
  const invalidar = useInvalidarContenido();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdatePreguntaDto }) =>
      examsService.updatePregunta(id, dto),
    onSuccess: invalidar,
  });
}

export function useDeletePregunta() {
  const invalidar = useInvalidarContenido();
  return useMutation({
    mutationFn: (id: number) => examsService.deletePregunta(id),
    onSuccess: invalidar,
  });
}

export function useCreateOpcion() {
  const invalidar = useInvalidarContenido();
  return useMutation({
    mutationFn: (dto: CreateOpcionDto) => examsService.createOpcion(dto),
    onSuccess: invalidar,
  });
}

export function useUpdateOpcion() {
  const invalidar = useInvalidarContenido();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateOpcionDto }) =>
      examsService.updateOpcion(id, dto),
    onSuccess: invalidar,
  });
}

export function useDeleteOpcion() {
  const invalidar = useInvalidarContenido();
  return useMutation({
    mutationFn: (id: number) => examsService.deleteOpcion(id),
    onSuccess: invalidar,
  });
}
