import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi, inventoryApi } from '../api';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const itemKeys = {
  all:     ()          => ['items']                     as const,
  list:    (inactive?: boolean) => ['items', 'list', inactive ?? false] as const,
  detail:  (id: number) => ['items', 'detail', id]     as const,
  stock:   (id: number) => ['items', 'stock', id]      as const,
  history: (id: number, limit?: number, offset?: number) =>
    ['items', 'history', id, limit ?? 50, offset ?? 0] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useItems(includeInactive = false) {
  return useQuery({
    queryKey: itemKeys.list(includeInactive),
    queryFn:  () => itemApi.list(includeInactive),
    staleTime: 30_000,
  });
}

export function useItem(id: number) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn:  () => itemApi.get(id),
    enabled:  id > 0,
    staleTime: 30_000,
  });
}

export function useItemStock(itemId: number) {
  return useQuery({
    queryKey: itemKeys.stock(itemId),
    queryFn:  () => inventoryApi.getStock(itemId),
    enabled:  itemId > 0,
    staleTime: 10_000,
  });
}

export function useStockHistory(itemId: number, limit = 50, offset = 0) {
  return useQuery({
    queryKey: itemKeys.history(itemId, limit, offset),
    queryFn:  () => inventoryApi.getHistory(itemId, limit, offset),
    enabled:  itemId > 0,
    staleTime: 10_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => itemApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all() });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      itemApi.update(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.list() });
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(variables.id) });
    },
  });
}

export function useDeactivateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => itemApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all() });
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      newQuantity,
      reason,
    }: {
      itemId: number;
      newQuantity: number;
      reason: string;
    }) => inventoryApi.adjust(itemId, newQuantity, reason),
    onSuccess: (_result, variables) => {
      // Stok ve item detail cache'ini temizle
      queryClient.invalidateQueries({ queryKey: itemKeys.stock(variables.itemId) });
      queryClient.invalidateQueries({ queryKey: itemKeys.history(variables.itemId) });
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(variables.itemId) });
      queryClient.invalidateQueries({ queryKey: itemKeys.list() });
    },
  });
}
