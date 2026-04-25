import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../api';
import { itemKeys } from './useItems';
import { ledgerKeys } from './useLedger';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const txKeys = {
  all:     ()                              => ['transactions']                       as const,
  list:    (filters?: Record<string, unknown>) => ['transactions', 'list', filters ?? {}] as const,
  detail:  (id: number)                   => ['transactions', 'detail', id]         as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useTransactions(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: txKeys.list(filters),
    queryFn:  () => transactionApi.list(filters),
    staleTime: 15_000,
  });
}

export function useTransaction(id: number) {
  return useQuery({
    queryKey: txKeys.detail(id),
    queryFn:  () => transactionApi.get(id),
    enabled:  id > 0,
    staleTime: 30_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => transactionApi.createSale(data),
    onSuccess: (_result, variables) => {
      // İşlem listesi
      queryClient.invalidateQueries({ queryKey: txKeys.all() });
      // Stok (satış çıkışı yaptı)
      queryClient.invalidateQueries({ queryKey: itemKeys.all() });
      // Cari bakiye
      if (variables.entityId) {
        queryClient.invalidateQueries({
          queryKey: ledgerKeys.balance(variables.entityId as number),
        });
        queryClient.invalidateQueries({
          queryKey: ledgerKeys.openInvoices(variables.entityId as number),
        });
      }
    },
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => transactionApi.createPurchase(data),
    onSuccess: (_result, variables) => {
      // İşlem listesi
      queryClient.invalidateQueries({ queryKey: txKeys.all() });
      // Stok (alış girişi yaptı)
      queryClient.invalidateQueries({ queryKey: itemKeys.all() });
      // Cari bakiye
      if (variables.entityId) {
        queryClient.invalidateQueries({
          queryKey: ledgerKeys.balance(variables.entityId as number),
        });
        queryClient.invalidateQueries({
          queryKey: ledgerKeys.openInvoices(variables.entityId as number),
        });
      }
    },
  });
}

export function useCancelTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      transactionApi.cancel(id, reason),
    onSuccess: (_result, variables) => {
      // İptal edilen işlemin detail cache'ini temizle
      queryClient.invalidateQueries({ queryKey: txKeys.detail(variables.id) });
      // Liste ve stok tamamen yenilenir
      queryClient.invalidateQueries({ queryKey: txKeys.all() });
      queryClient.invalidateQueries({ queryKey: itemKeys.all() });
      // Tüm ledger cache'leri (iptal bakiyeleri etkiler)
      queryClient.invalidateQueries({ queryKey: ledgerKeys.all() });
    },
  });
}
