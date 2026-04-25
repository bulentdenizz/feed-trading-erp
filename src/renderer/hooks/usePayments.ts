import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../api';
import { ledgerKeys } from './useLedger';
import { txKeys } from './useTransactions';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const paymentKeys = {
  all:         ()                                           => ['payments']                              as const,
  history:     (entityId: number, limit?: number, offset?: number) =>
    ['payments', 'history', entityId, limit ?? 50, offset ?? 0]  as const,
  unallocated: (entityId: number)                          => ['payments', 'unallocated', entityId]     as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePaymentHistory(entityId: number, limit = 50, offset = 0) {
  return useQuery({
    queryKey: paymentKeys.history(entityId, limit, offset),
    queryFn:  () => paymentApi.getHistory(entityId, limit, offset),
    enabled:  entityId > 0,
    staleTime: 15_000,
  });
}

export function useUnallocatedAmount(entityId: number) {
  return useQuery({
    queryKey: paymentKeys.unallocated(entityId),
    queryFn:  () => paymentApi.getUnallocated(entityId),
    enabled:  entityId > 0,
    staleTime: 10_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Ortak invalidation: ödeme sonrası bakiye + açık faturalar + ödeme geçmişi yenilenir.
 */
function invalidateAfterPayment(
  queryClient: ReturnType<typeof useQueryClient>,
  entityId?: number,
) {
  queryClient.invalidateQueries({ queryKey: paymentKeys.all() });
  queryClient.invalidateQueries({ queryKey: txKeys.all() });
  if (entityId) {
    queryClient.invalidateQueries({ queryKey: ledgerKeys.balance(entityId) });
    queryClient.invalidateQueries({ queryKey: ledgerKeys.openInvoices(entityId) });
    queryClient.invalidateQueries({ queryKey: ledgerKeys.statement(entityId) });
    queryClient.invalidateQueries({ queryKey: paymentKeys.unallocated(entityId) });
  } else {
    // entityId bilinmiyorsa tüm ledger cache'ini temizle
    queryClient.invalidateQueries({ queryKey: ledgerKeys.all() });
  }
}

export function useRecordPaymentIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => paymentApi.recordIn(data),
    onSuccess: (_result, variables) => {
      invalidateAfterPayment(queryClient, variables.entityId as number | undefined);
    },
  });
}

export function useRecordPaymentOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => paymentApi.recordOut(data),
    onSuccess: (_result, variables) => {
      invalidateAfterPayment(queryClient, variables.entityId as number | undefined);
    },
  });
}

export function useCancelPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      paymentApi.cancel(id, reason),
    onSuccess: () => {
      // İptal sonrası tüm ödeme ve ledger cache'leri geçersiz
      queryClient.invalidateQueries({ queryKey: paymentKeys.all() });
      queryClient.invalidateQueries({ queryKey: ledgerKeys.all() });
      queryClient.invalidateQueries({ queryKey: txKeys.all() });
    },
  });
}
