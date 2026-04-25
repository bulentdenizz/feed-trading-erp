import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entityApi } from '../api';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const entityKeys = {
  all:       ()           => ['entities']                         as const,
  lists:     ()           => ['entities', 'list']                 as const,
  byType:    (type: string) => ['entities', 'list', type]         as const,
  detail:    (id: number) => ['entities', 'detail', id]           as const,
  search:    (q: string, type?: string) => ['entities', 'search', q, type ?? ''] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useCustomers(includeInactive = false) {
  return useQuery({
    queryKey: entityKeys.byType('customer'),
    queryFn:  () => entityApi.list('customer', includeInactive),
    staleTime: 30_000,
  });
}

export function useSuppliers(includeInactive = false) {
  return useQuery({
    queryKey: entityKeys.byType('supplier'),
    queryFn:  () => entityApi.list('supplier', includeInactive),
    staleTime: 30_000,
  });
}

export function useEntity(id: number) {
  return useQuery({
    queryKey: entityKeys.detail(id),
    queryFn:  () => entityApi.get(id),
    enabled:  id > 0,
    staleTime: 30_000,
  });
}

export function useEntitySearch(query: string, type?: 'customer' | 'supplier') {
  return useQuery({
    queryKey: entityKeys.search(query, type),
    queryFn:  () => entityApi.search(query, type),
    enabled:  query.trim().length >= 2,
    staleTime: 10_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => entityApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
    },
  });
}

export function useUpdateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      entityApi.update(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: entityKeys.detail(variables.id) });
    },
  });
}

export function useDeactivateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => entityApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all() });
    },
  });
}
