import { useQuery } from '@tanstack/react-query';
import { ledgerApi } from '../api';

// ─── Query Keys ───────────────────────────────────────────────────────────────
// Bu key'ler useTransactions.ts ve usePayments.ts tarafından da import edilir.

export const ledgerKeys = {
  all:          ()                                          => ['ledger']                               as const,
  balance:      (entityId: number)                         => ['ledger', 'balance', entityId]          as const,
  openInvoices: (entityId: number)                         => ['ledger', 'open-invoices', entityId]    as const,
  statement:    (entityId: number, from?: string, to?: string) =>
    ['ledger', 'statement', entityId, from ?? '', to ?? '']                                            as const,
  aging:        (type: string)                             => ['ledger', 'aging', type]                as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useEntityBalance(entityId: number) {
  return useQuery({
    queryKey: ledgerKeys.balance(entityId),
    queryFn:  () => ledgerApi.getBalance(entityId),
    enabled:  entityId > 0,
    staleTime: 10_000,
  });
}

export function useOpenInvoices(entityId: number) {
  return useQuery({
    queryKey: ledgerKeys.openInvoices(entityId),
    queryFn:  () => ledgerApi.getOpenInvoices(entityId),
    enabled:  entityId > 0,
    staleTime: 15_000,
  });
}

export function useStatement(entityId: number, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ledgerKeys.statement(entityId, fromDate, toDate),
    queryFn:  () => ledgerApi.getStatement(entityId, fromDate, toDate),
    enabled:  entityId > 0,
    staleTime: 15_000,
  });
}

export function useAgingReport(type: 'customer' | 'supplier') {
  return useQuery({
    queryKey: ledgerKeys.aging(type),
    queryFn:  () => ledgerApi.getAgingReport(type),
    staleTime: 60_000, // yaşlandırma raporu daha az sıklıkla değişir
  });
}
