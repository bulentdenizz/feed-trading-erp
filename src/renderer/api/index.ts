/**
 * Renderer API Sarmalayıcı
 *
 * Token'ı authStore'dan otomatik olarak ekler.
 * Renderer bileşenlerinde window.api doğrudan kullanmak yerine
 * bu modüldeki fonksiyonlar kullanılmalıdır.
 */

import { useAuthStore } from '../store/authStore';

// ─── Yardımcı: token'ı store'dan al, fonksiyona ilet ────────────────────────
// NOT: Preload katmanındaki invoke() zaten { ok, data } zarfını açıyor.
// withToken burada sadece token enjeksiyonu yapar; çift unwrap YAPMA.

async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
  return fn(token);
}

// ─── Entity API ─────────────────────────────────────────────────────────────

export const entityApi = {
  list: (type: 'customer' | 'supplier', includeInactive?: boolean) =>
    withToken(token => window.api.entities.list(token, type, includeInactive)),

  get: (id: number) =>
    withToken(token => window.api.entities.get(token, id)),

  create: (data: Record<string, unknown>) =>
    withToken(token => window.api.entities.create(token, data)),

  update: (id: number, data: Record<string, unknown>) =>
    withToken(token => window.api.entities.update(token, id, data)),

  deactivate: (id: number) =>
    withToken(token => window.api.entities.deactivate(token, id)),

  search: (query: string, type?: 'customer' | 'supplier') =>
    withToken(token => window.api.entities.search(token, query, type)),
};

// ─── Item API ────────────────────────────────────────────────────────────────

export const itemApi = {
  list: (includeInactive?: boolean) =>
    withToken(token => window.api.items.list(token, includeInactive)),

  get: (id: number) =>
    withToken(token => window.api.items.get(token, id)),

  create: (data: Record<string, unknown>) =>
    withToken(token => window.api.items.create(token, data)),

  update: (id: number, data: Record<string, unknown>) =>
    withToken(token => window.api.items.update(token, id, data)),

  deactivate: (id: number) =>
    withToken(token => window.api.items.deactivate(token, id)),
};

// ─── Inventory API ───────────────────────────────────────────────────────────

export const inventoryApi = {
  getStock: (itemId: number) =>
    withToken(token => window.api.inventory.getStock(token, itemId)),

  getHistory: (itemId: number, limit?: number, offset?: number) =>
    withToken(token => window.api.inventory.getHistory(token, itemId, limit, offset)),

  adjust: (itemId: number, newQuantity: number, reason: string) =>
    withToken(token => window.api.inventory.adjust(token, itemId, newQuantity, reason)),
};

// ─── Transaction API ─────────────────────────────────────────────────────────

export const transactionApi = {
  list: (filters?: Record<string, unknown>) =>
    withToken(token => window.api.transactions.list(token, filters)),

  get: (id: number) =>
    withToken(token => window.api.transactions.get(token, id)),

  createSale: (data: Record<string, unknown>) =>
    withToken(token => window.api.transactions.createSale(token, data)),

  createPurchase: (data: Record<string, unknown>) =>
    withToken(token => window.api.transactions.createPurchase(token, data)),

  cancel: (id: number, reason: string) =>
    withToken(token => window.api.transactions.cancel(token, id, reason)),
};

// ─── Payment API ─────────────────────────────────────────────────────────────

export const paymentApi = {
  recordIn: (data: Record<string, unknown>) =>
    withToken(token => window.api.payments.recordIn(token, data)),

  recordOut: (data: Record<string, unknown>) =>
    withToken(token => window.api.payments.recordOut(token, data)),

  cancel: (id: number, reason: string) =>
    withToken(token => window.api.payments.cancel(token, id, reason)),

  getHistory: (entityId: number, limit?: number, offset?: number) =>
    withToken(token => window.api.payments.getHistory(token, entityId, limit, offset)),

  getUnallocated: (entityId: number) =>
    withToken(token => window.api.payments.getUnallocated(token, entityId)),
};

// ─── Ledger API ──────────────────────────────────────────────────────────────

export const ledgerApi = {
  getBalance: (entityId: number) =>
    withToken(token => window.api.ledger.getBalance(token, entityId)),

  getStatement: (entityId: number, fromDate?: string, toDate?: string) =>
    withToken(token => window.api.ledger.getStatement(token, entityId, fromDate, toDate)),

  getOpenInvoices: (entityId: number) =>
    withToken(token => window.api.ledger.getOpenInvoices(token, entityId)),

  getAgingReport: (type: 'customer' | 'supplier') =>
    withToken(token => window.api.ledger.getAgingReport(token, type)),
};
