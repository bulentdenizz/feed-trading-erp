import { contextBridge, ipcRenderer } from 'electron'

// ─── Yardımcı: sonucu kontrol et, ok=false ise hata fırlat ──────────────────

async function invoke<T = unknown>(channel: string, args: Record<string, unknown>): Promise<T> {
  const result = await ipcRenderer.invoke(channel, args);
  if (!result.ok) throw new Error(result.message ?? 'Bilinmeyen hata');
  return result.data as T;
}

// ─── Tek 'api' objesi ────────────────────────────────────────────────────────

contextBridge.exposeInMainWorld('api', {

  auth: {
    login: (username: string, password: string) =>
      invoke('auth:login', { username, password }),

    logout: (token: string) =>
      ipcRenderer.invoke('auth:logout', { token }).then((r) => {
        if (!r.ok) throw new Error(r.message);
      }),

    validate: (token: string) =>
      invoke('auth:validate', { token }),
  },

  entities: {
    list: (token: string, type: string, includeInactive?: boolean) =>
      invoke('entities:list', { token, type, includeInactive }),

    get: (token: string, id: number) =>
      invoke('entities:get', { token, id }),

    create: (token: string, data: Record<string, unknown>) =>
      invoke('entities:create', { token, data }),

    update: (token: string, id: number, data: Record<string, unknown>) =>
      invoke('entities:update', { token, id, data }),

    deactivate: (token: string, id: number) =>
      invoke('entities:deactivate', { token, id }),

    search: (token: string, query: string, type?: string) =>
      invoke('entities:search', { token, query, type }),
  },

  items: {
    list: (token: string, includeInactive?: boolean) =>
      invoke('items:list', { token, includeInactive }),

    get: (token: string, id: number) =>
      invoke('items:get', { token, id }),

    create: (token: string, data: Record<string, unknown>) =>
      invoke('items:create', { token, data }),

    update: (token: string, id: number, data: Record<string, unknown>) =>
      invoke('items:update', { token, id, data }),

    deactivate: (token: string, id: number) =>
      invoke('items:deactivate', { token, id }),
  },

  inventory: {
    getStock: (token: string, itemId: number) =>
      invoke('inventory:getStock', { token, itemId }),

    getHistory: (token: string, itemId: number, limit?: number, offset?: number) =>
      invoke('inventory:getHistory', { token, itemId, limit, offset }),

    adjust: (token: string, itemId: number, newQuantity: number, reason: string) =>
      invoke('inventory:adjust', { token, itemId, newQuantity, reason }),
  },

  transactions: {
    list: (token: string, filters?: Record<string, unknown>) =>
      invoke('transactions:list', { token, filters }),

    get: (token: string, id: number) =>
      invoke('transactions:get', { token, id }),

    createSale: (token: string, data: Record<string, unknown>) =>
      invoke('transactions:createSale', { token, data }),

    createPurchase: (token: string, data: Record<string, unknown>) =>
      invoke('transactions:createPurchase', { token, data }),

    cancel: (token: string, id: number, reason: string) =>
      invoke('transactions:cancel', { token, id, reason }),
  },

  payments: {
    recordIn: (token: string, data: Record<string, unknown>) =>
      invoke('payments:recordIn', { token, data }),

    recordOut: (token: string, data: Record<string, unknown>) =>
      invoke('payments:recordOut', { token, data }),

    cancel: (token: string, id: number, reason: string) =>
      invoke('payments:cancel', { token, id, reason }),

    getHistory: (token: string, entityId: number, limit?: number, offset?: number) =>
      invoke('payments:getHistory', { token, entityId, limit, offset }),

    getUnallocated: (token: string, entityId: number) =>
      invoke('payments:getUnallocated', { token, entityId }),
  },

  ledger: {
    getBalance: (token: string, entityId: number) =>
      invoke('ledger:getBalance', { token, entityId }),

    getStatement: (token: string, entityId: number, fromDate?: string, toDate?: string) =>
      invoke('ledger:getStatement', { token, entityId, fromDate, toDate }),

    getOpenInvoices: (token: string, entityId: number) =>
      invoke('ledger:getOpenInvoices', { token, entityId }),

    getAgingReport: (token: string, type: 'customer' | 'supplier') =>
      invoke('ledger:getAgingReport', { token, type }),
  },
})
