/**
 * Global TypeScript tip tanımlamaları — window.api
 *
 * Bu dosya renderer process'te window.api üzerinden erişilen
 * tüm IPC kanallarının tiplerini tanımlar.
 */

export {};

// ─── Ortak response tipleri (renderer'da kullanım için) ─────────────────────

export interface AuthData {
  userId: number;
  username: string;
  role: 'admin' | 'staff';
  token: string;
}

export interface EntityData {
  id: number;
  title: string;
  entity_type: 'customer' | 'supplier';
  phone: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  tax_number: string | null;
  category: string | null;
  is_active: number;
  created_at: string;
  balance_kurus: number;
}

export interface ItemData {
  id: number;
  name: string;
  sku: string | null;
  unit: string;
  category: string | null;
  low_stock_threshold: number;
  default_sale_price_kurus: number;
  default_buy_price_kurus: number;
  tax_rate_bps: number;
  is_active: number;
  created_at: string;
  current_stock: number;
}

export interface StockHistoryRow {
  id: number;
  item_id: number;
  movement_type: string;
  quantity_change: number;
  balance_after: number;
  unit_cost_kurus: number | null;
  notes: string | null;
  created_at: string;
  invoice_number: string | null;
  transaction_type: string | null;
}

export interface TransactionRow {
  id: number;
  invoice_number: string | null;
  transaction_type: string;
  entity_id: number;
  entity_title: string;
  amount_kurus: number;
  tax_amount_kurus: number;
  transaction_date: string;
  due_date: string | null;
  status: 'active' | 'cancelled';
  created_at: string;
}

export interface TransactionDetail extends TransactionRow {
  amount_excl_tax_kurus: number;
  description: string | null;
  cancels_transaction_id: number | null;
  cancelled_by_transaction_id: number | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_by: number;
  items: TransactionItemDetail[];
}

export interface TransactionItemDetail {
  id: number;
  item_id: number | null;
  item_name_snapshot: string;
  unit_snapshot: string;
  quantity: number;
  unit_price_kurus: number;
  tax_rate_bps: number;
  subtotal_kurus: number;
  cost_price_kurus_snapshot: number | null;
}

export interface PaymentResult {
  id: number;
  invoiceNumber: string;
  allocated: number;
  unallocated: number;
}

export interface OpenInvoiceRow {
  id: number;
  invoice_number: string | null;
  transaction_type: string;
  entity_id: number;
  amount_kurus: number;
  due_date: string | null;
  transaction_date: string;
  paid_kurus: number;
  remaining_kurus: number;
}

export interface StatementResult {
  entity: { id: number; title: string; entity_type: string };
  opening_balance_kurus: number;
  closing_balance_kurus: number;
  transactions: Array<TransactionRow & { running_balance_kurus: number }>;
}

export interface AgingBucket {
  items: Array<{
    entity_id: number;
    title: string;
    invoice_id: number;
    invoice_number: string | null;
    remaining_kurus: number;
    due_date: string | null;
    days_overdue: number;
  }>;
  total_kurus: number;
}

export interface AgingReport {
  current: AgingBucket;
  overdue_30: AgingBucket;
  overdue_60: AgingBucket;
  overdue_90: AgingBucket;
  overdue_plus: AgingBucket;
  grand_total_kurus: number;
}

// ─── window.api tip tanımı ───────────────────────────────────────────────────

declare global {
  interface Window {
    api: {
      auth: {
        login:    (username: string, password: string) => Promise<AuthData>;
        logout:   (token: string) => Promise<void>;
        validate: (token: string) => Promise<AuthData>;
      };

      entities: {
        list:       (token: string, type: 'customer' | 'supplier', includeInactive?: boolean) => Promise<EntityData[]>;
        get:        (token: string, id: number) => Promise<EntityData>;
        create:     (token: string, data: Record<string, unknown>) => Promise<EntityData>;
        update:     (token: string, id: number, data: Record<string, unknown>) => Promise<EntityData>;
        deactivate: (token: string, id: number) => Promise<void>;
        search:     (token: string, query: string, type?: 'customer' | 'supplier') => Promise<EntityData[]>;
      };

      items: {
        list:       (token: string, includeInactive?: boolean) => Promise<ItemData[]>;
        get:        (token: string, id: number) => Promise<ItemData>;
        create:     (token: string, data: Record<string, unknown>) => Promise<ItemData>;
        update:     (token: string, id: number, data: Record<string, unknown>) => Promise<ItemData>;
        deactivate: (token: string, id: number) => Promise<void>;
      };

      inventory: {
        getStock:   (token: string, itemId: number) => Promise<{ itemId: number; currentStock: number }>;
        getHistory: (token: string, itemId: number, limit?: number, offset?: number) => Promise<StockHistoryRow[]>;
        adjust:     (token: string, itemId: number, newQuantity: number, reason: string) => Promise<{ movementId: number | null; currentStock: number }>;
      };

      transactions: {
        list:            (token: string, filters?: Record<string, unknown>) => Promise<TransactionRow[]>;
        get:             (token: string, id: number) => Promise<TransactionDetail>;
        createSale:      (token: string, data: Record<string, unknown>) => Promise<{ id: number; invoiceNumber: string }>;
        createPurchase:  (token: string, data: Record<string, unknown>) => Promise<{ id: number; invoiceNumber: string }>;
        cancel:          (token: string, id: number, reason: string) => Promise<{ id: number; invoiceNumber: string }>;
      };

      payments: {
        recordIn:       (token: string, data: Record<string, unknown>) => Promise<PaymentResult>;
        recordOut:      (token: string, data: Record<string, unknown>) => Promise<PaymentResult>;
        cancel:         (token: string, id: number, reason: string) => Promise<void>;
        getHistory:     (token: string, entityId: number, limit?: number, offset?: number) => Promise<unknown[]>;
        getUnallocated: (token: string, entityId: number) => Promise<{ entityId: number; unallocated: number }>;
      };

      ledger: {
        getBalance:      (token: string, entityId: number) => Promise<{ entityId: number; balance_kurus: number }>;
        getStatement:    (token: string, entityId: number, fromDate?: string, toDate?: string) => Promise<StatementResult>;
        getOpenInvoices: (token: string, entityId: number) => Promise<OpenInvoiceRow[]>;
        getAgingReport:  (token: string, type: 'customer' | 'supplier') => Promise<AgingReport>;
      };
    };
  }
}