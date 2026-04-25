/**
 * LedgerService — Cari defter işlemleri
 *
 * Bakiye hiçbir zaman entities tablosuna yazılmaz.
 * Tüm hesaplamalar v_entity_balances ve transactions tablosundan yapılır.
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger';
import { EntityType } from './EntityService';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TransactionLedgerRow {
  id: number;
  invoice_number: string | null;
  transaction_type: string;
  amount_kurus: number;
  tax_amount_kurus: number;
  transaction_date: string;
  due_date: string | null;
  description: string | null;
  /** Her satır için hesaplanan kümülatif bakiye (kronolojik) */
  running_balance_kurus: number;
}

export interface StatementResult {
  entity: {
    id: number;
    title: string;
    entity_type: EntityType;
  };
  opening_balance_kurus: number;
  closing_balance_kurus: number;
  transactions: TransactionLedgerRow[];
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

export interface AgingEntityItem {
  entity_id: number;
  title: string;
  invoice_id: number;
  invoice_number: string | null;
  remaining_kurus: number;
  due_date: string | null;
  days_overdue: number;
}

export interface AgingBucket {
  items: AgingEntityItem[];
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

// ─── İşlem yönü hesaplayıcı ──────────────────────────────────────────────────

/**
 * İşlem tipine göre bakiyeye etkisini döner.
 * sale/purchase → alacak/borç oluşur (+)
 * payment_in/out, iade → bakiyeyi azaltır (-)
 */
function transactionSign(type: string): 1 | -1 {
  switch (type) {
    case 'sale':
    case 'purchase':
      return 1;
    case 'payment_in':
    case 'payment_out':
    case 'sale_return':
    case 'purchase_return':
      return -1;
    default:
      return 1;
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class LedgerService {
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // ── Balance ─────────────────────────────────────────────────────────────────

  /**
   * Bir carinin güncel bakiyesini (kuruş) döner.
   * Entity bulunamazsa hata fırlatır.
   */
  getBalance(entityId: number): number {
    const row = this.db
      .prepare<[number], { balance_kurus: number } | undefined>(
        'SELECT balance_kurus FROM v_entity_balances WHERE entity_id = ?'
      )
      .get(entityId);

    if (row === undefined) {
      throw new Error(`Cari bulunamadı: #${entityId}`);
    }

    return row.balance_kurus;
  }

  // ── Statement ───────────────────────────────────────────────────────────────

  /**
   * Cari ekstresi: her işlem + o ana kadar birikmiş bakiye.
   *
   * @param entityId - Cari id
   * @param fromDate - ISO tarih (dahil), opsiyonel
   * @param toDate   - ISO tarih (dahil), opsiyonel
   */
  getStatement(
    entityId: number,
    fromDate?: string,
    toDate?: string,
  ): StatementResult {
    // Entity bilgisini al
    const entity = this.db
      .prepare<[number], { id: number; title: string; entity_type: EntityType } | undefined>(
        'SELECT id, title, entity_type FROM entities WHERE id = ?'
      )
      .get(entityId);

    if (!entity) {
      throw new Error(`Cari bulunamadı: #${entityId}`);
    }

    // Tarih aralığından önceki bakiyeyi hesapla (opening balance)
    let openingBalance = 0;
    if (fromDate) {
      const openingRow = this.db
        .prepare<[number, string], { total: number | null }>(`
          SELECT SUM(
            CASE transaction_type
              WHEN 'sale'            THEN  amount_kurus
              WHEN 'purchase'        THEN  amount_kurus
              WHEN 'payment_in'      THEN -amount_kurus
              WHEN 'payment_out'     THEN -amount_kurus
              WHEN 'sale_return'     THEN -amount_kurus
              WHEN 'purchase_return' THEN -amount_kurus
              ELSE 0
            END
          ) AS total
          FROM transactions
          WHERE entity_id = ?
            AND status = 'active'
            AND transaction_date < ?
        `)
        .get(entityId, fromDate);

      openingBalance = openingRow?.total ?? 0;
    }

    // İşlemleri kronolojik sırala
    const dateFilter = this._buildDateFilter(fromDate, toDate);
    const rawRows = this.db
      .prepare<unknown[]>(`
        SELECT
          id, invoice_number, transaction_type,
          amount_kurus, tax_amount_kurus,
          transaction_date, due_date, description
        FROM transactions
        WHERE entity_id = ?
          AND status = 'active'
          ${dateFilter.sql}
        ORDER BY transaction_date ASC, id ASC
      `)
      .all(entityId, ...dateFilter.params) as Omit<TransactionLedgerRow, 'running_balance_kurus'>[];

    // Running balance hesapla
    let running = openingBalance;
    const transactions: TransactionLedgerRow[] = rawRows.map(row => {
      running += transactionSign(row.transaction_type) * row.amount_kurus;
      return { ...row, running_balance_kurus: running };
    });

    logger.debug('Ekstre hesaplandı', { entityId, rowCount: transactions.length });

    return {
      entity,
      opening_balance_kurus: openingBalance,
      closing_balance_kurus: running,
      transactions,
    };
  }

  // ── Open Invoices ───────────────────────────────────────────────────────────

  /**
   * Bir carinin ödenmemiş/kısmen ödenmiş faturalarını döner.
   * Vadeye göre sıralanır (eskiden yeniye).
   */
  getOpenInvoices(entityId: number): OpenInvoiceRow[] {
    const rows = this.db
      .prepare<[number]>(`
        SELECT
          id, invoice_number, transaction_type, entity_id,
          amount_kurus, due_date, transaction_date,
          paid_kurus, remaining_kurus
        FROM v_open_invoices
        WHERE entity_id = ?
        ORDER BY due_date ASC NULLS LAST, transaction_date ASC
      `)
      .all(entityId) as OpenInvoiceRow[];

    return rows;
  }

  // ── Aging Report ─────────────────────────────────────────────────────────────

  /**
   * Vadesi geçmiş açık faturaları 5 gruba ayırır.
   * Her grup için entity listesi + toplam tutar döner.
   *
   * @param type - 'customer' | 'supplier'
   */
  getAgingReport(type: EntityType): AgingReport {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    // Tüm açık faturaları al + entity bilgisi + gecikmeli gün hesabı
    const rows = this.db
      .prepare<[EntityType, string]>(`
        SELECT
          oi.id           AS invoice_id,
          oi.invoice_number,
          oi.entity_id,
          oi.remaining_kurus,
          oi.due_date,
          e.title,
          CASE
            WHEN oi.due_date IS NULL THEN 0
            ELSE CAST(
              (julianday(?) - julianday(oi.due_date)) AS INTEGER
            )
          END AS days_overdue
        FROM v_open_invoices oi
        JOIN entities e ON e.id = oi.entity_id
        WHERE e.entity_type = ?
          AND e.is_active = 1
        ORDER BY oi.due_date ASC NULLS LAST
      `)
      .all(today, type) as Array<{
        invoice_id: number;
        invoice_number: string | null;
        entity_id: number;
        remaining_kurus: number;
        due_date: string | null;
        title: string;
        days_overdue: number;
      }>;

    const report: AgingReport = {
      current:      { items: [], total_kurus: 0 },
      overdue_30:   { items: [], total_kurus: 0 },
      overdue_60:   { items: [], total_kurus: 0 },
      overdue_90:   { items: [], total_kurus: 0 },
      overdue_plus: { items: [], total_kurus: 0 },
      grand_total_kurus: 0,
    };

    for (const row of rows) {
      const item: AgingEntityItem = {
        entity_id:       row.entity_id,
        title:           row.title,
        invoice_id:      row.invoice_id,
        invoice_number:  row.invoice_number,
        remaining_kurus: row.remaining_kurus,
        due_date:        row.due_date,
        days_overdue:    Math.max(0, row.days_overdue),
      };

      const bucket = this._agingBucket(row.days_overdue);
      report[bucket].items.push(item);
      report[bucket].total_kurus += row.remaining_kurus;
      report.grand_total_kurus   += row.remaining_kurus;
    }

    logger.debug('Yaşlandırma raporu hesaplandı', {
      type,
      total: report.grand_total_kurus,
      invoiceCount: rows.length,
    });

    return report;
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  private _agingBucket(
    daysOverdue: number,
  ): 'current' | 'overdue_30' | 'overdue_60' | 'overdue_90' | 'overdue_plus' {
    if (daysOverdue <= 0)  return 'current';
    if (daysOverdue <= 30) return 'overdue_30';
    if (daysOverdue <= 60) return 'overdue_60';
    if (daysOverdue <= 90) return 'overdue_90';
    return 'overdue_plus';
  }

  private _buildDateFilter(
    fromDate?: string,
    toDate?: string,
  ): { sql: string; params: string[] } {
    const clauses: string[] = [];
    const params: string[] = [];

    if (fromDate) {
      clauses.push('AND transaction_date >= ?');
      params.push(fromDate);
    }
    if (toDate) {
      clauses.push('AND transaction_date <= ?');
      params.push(toDate);
    }

    return { sql: clauses.join(' '), params };
  }
}
