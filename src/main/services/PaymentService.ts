/**
 * PaymentService — Tahsilat ve ödeme yönetimi
 *
 * Ödeme kaydı = transactions (payment_in | payment_out)
 * Faturaya uygulama = payment_allocations
 *
 * entities.balance kolonu yoktur — bakiye v_entity_balances'tan hesaplanır.
 * Tüm çok-adımlı işlemler TEK db.transaction() içinde gerçekleşir.
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger';
import { InvoiceNumberService } from './InvoiceNumberService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AllocationInput {
  invoiceId: number;
  amountKurus: number;
}

export interface CreatePaymentInput {
  entityId: number;
  amountKurus: number;
  transactionDate?: string;
  description?: string;
  /** Belirtilmezse otomatik dağıtım (vadesi en eskisi önce) yapılır */
  allocations?: AllocationInput[];
}

export interface PaymentResult {
  id: number;
  invoiceNumber: string;
  /** Faturalara uygulanan toplam tutar */
  allocated: number;
  /** Dağıtılmamış avans tutarı */
  unallocated: number;
}

export interface AllocationRow {
  id: number;
  payment_transaction_id: number;
  invoice_transaction_id: number;
  amount_kurus: number;
  invoice_number: string | null;
  created_at: string;
}

export interface PaymentHistoryRow {
  id: number;
  invoice_number: string | null;
  transaction_type: 'payment_in' | 'payment_out';
  entity_id: number;
  amount_kurus: number;
  transaction_date: string;
  description: string | null;
  status: 'active' | 'cancelled';
  created_at: string;
  allocations: AllocationRow[];
}

interface OpenInvoiceRow {
  id: number;
  remaining_kurus: number;
  due_date: string | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class PaymentService {
  private readonly db: Database.Database;
  private readonly invoiceService: InvoiceNumberService;

  constructor(db: Database.Database, invoiceService: InvoiceNumberService) {
    this.db = db;
    this.invoiceService = invoiceService;
  }

  // ── recordPayment ────────────────────────────────────────────────────────────

  /**
   * Tahsilat (payment_in) veya ödeme (payment_out) kaydeder.
   *
   * - allocations verilmişse manuel dağıtım yapılır.
   * - allocations verilmemişse vadesi en eskiye göre otomatik dağıtım.
   * - Toplam dağıtım ödeme tutarını geçemez.
   * - Dağıtılmayan kısım avans olarak kalır (unallocated).
   */
  recordPayment(
    data: CreatePaymentInput,
    type: 'payment_in' | 'payment_out',
    userId: number,
  ): PaymentResult {
    if (!Number.isInteger(data.amountKurus) || data.amountKurus <= 0) {
      throw new Error('Ödeme tutarı pozitif tam sayı (kuruş) olmalı');
    }

    const execute = this.db.transaction((): PaymentResult => {
      const now = data.transactionDate ?? new Date().toISOString();

      // 1. Fatura numarası
      const invoiceNumber = this.invoiceService.next(type);

      // 2. transactions INSERT
      const txResult = this.db
        .prepare(`
          INSERT INTO transactions (
            invoice_number, transaction_type, entity_id,
            amount_kurus, tax_amount_kurus, amount_excl_tax_kurus,
            transaction_date, description, status, created_by
          ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, 'active', ?)
        `)
        .run(
          invoiceNumber,
          type,
          data.entityId,
          data.amountKurus,
          data.amountKurus,   // ödeme vergi hariç = toplam (KDV yok)
          now,
          data.description?.trim() ?? null,
          userId,
        );

      const paymentTxId = txResult.lastInsertRowid as number;

      // 3. Dağıtım
      let allocated = 0;

      if (data.allocations && data.allocations.length > 0) {
        // Manuel dağıtım
        allocated = this._applyManualAllocations(
          paymentTxId,
          data.allocations,
          data.amountKurus,
        );
      } else {
        // Otomatik dağıtım (eskiden yeniye)
        allocated = this._autoAllocate(paymentTxId, data.entityId, data.amountKurus);
      }

      const unallocated = data.amountKurus - allocated;

      // 4. audit_log
      this._insertAuditLog(paymentTxId, 'INSERT', userId, {
        invoiceNumber,
        type,
        entityId: data.entityId,
        amountKurus: data.amountKurus,
        allocated,
        unallocated,
      });

      logger.info('Ödeme kaydedildi', {
        paymentTxId,
        invoiceNumber,
        type,
        entityId: data.entityId,
        allocated,
        unallocated,
        userId,
      });

      return { id: paymentTxId, invoiceNumber, allocated, unallocated };
    });

    return execute();
  }

  // ── cancelPayment ────────────────────────────────────────────────────────────

  /**
   * Ödeme kaydını iptal eder.
   * - Sadece payment_in / payment_out iptal edilebilir.
   * - İlgili tüm payment_allocations silinir (faturalar tekrar açık olur).
   * - transactions.status = 'cancelled'
   */
  cancelPayment(txId: number, reason: string, userId: number): void {
    if (!reason || reason.trim().length < 3) {
      throw new Error('İptal nedeni en az 3 karakter olmalı');
    }

    const execute = this.db.transaction((): void => {
      const tx = this.db
        .prepare<[number], {
          id: number;
          transaction_type: string;
          status: string;
        } | undefined>(
          'SELECT id, transaction_type, status FROM transactions WHERE id = ?'
        )
        .get(txId);

      if (!tx) {
        throw new Error(`Ödeme kaydı bulunamadı: #${txId}`);
      }

      if (!['payment_in', 'payment_out'].includes(tx.transaction_type)) {
        throw new Error(
          `Sadece tahsilat/ödeme kayıtları iptal edilebilir. Tip: ${tx.transaction_type}`
        );
      }

      if (tx.status === 'cancelled') {
        throw new Error(`Ödeme zaten iptal edilmiş: #${txId}`);
      }

      // 1. payment_allocations'ları sil (faturalar tekrar açık olur)
      const deleted = this.db
        .prepare('DELETE FROM payment_allocations WHERE payment_transaction_id = ?')
        .run(txId);

      // 2. Ödemeyi iptal et
      const now = new Date().toISOString();
      this.db
        .prepare(`
          UPDATE transactions
          SET status = 'cancelled',
              cancel_reason = ?,
              cancelled_at = ?
          WHERE id = ?
        `)
        .run(reason.trim(), now, txId);

      // 3. audit_log
      this._insertAuditLog(txId, 'CANCEL', userId, {
        reason: reason.trim(),
        deletedAllocations: deleted.changes,
      });

      logger.info('Ödeme iptal edildi', {
        txId,
        userId,
        deletedAllocations: deleted.changes,
        reason,
      });
    });

    execute();
  }

  // ── getUnallocatedAmount ─────────────────────────────────────────────────────

  /**
   * Bir carinin dağıtılmamış avans ödeme tutarını döner.
   *
   * = SUM(aktif ödemeler) - SUM(faturalara uygulanmış kısım)
   */
  getUnallocatedAmount(entityId: number): number {
    const row = this.db
      .prepare<[number], { unallocated: number | null }>(`
        SELECT
          COALESCE(SUM(t.amount_kurus), 0)
          - COALESCE(
              (SELECT SUM(pa.amount_kurus)
               FROM payment_allocations pa
               JOIN transactions pt ON pt.id = pa.payment_transaction_id
               WHERE pt.entity_id = ?
                 AND pt.status = 'active'),
              0
            ) AS unallocated
        FROM transactions t
        WHERE t.entity_id = ?
          AND t.transaction_type IN ('payment_in', 'payment_out')
          AND t.status = 'active'
      `)
      .get(entityId, entityId);

    return Math.max(0, row?.unallocated ?? 0);
  }

  // ── getPaymentHistory ────────────────────────────────────────────────────────

  /**
   * Bir carinin ödeme geçmişini uygulama detaylarıyla döner.
   * Sadece payment_in / payment_out işlemleri.
   */
  getPaymentHistory(
    entityId: number,
    limit = 50,
    offset = 0,
  ): PaymentHistoryRow[] {
    const payments = this.db
      .prepare<[number, number, number]>(`
        SELECT
          id, invoice_number, transaction_type, entity_id,
          amount_kurus, transaction_date, description,
          status, created_at
        FROM transactions
        WHERE entity_id = ?
          AND transaction_type IN ('payment_in', 'payment_out')
        ORDER BY transaction_date DESC, id DESC
        LIMIT ? OFFSET ?
      `)
      .all(entityId, limit, offset) as Omit<PaymentHistoryRow, 'allocations'>[];

    // Her ödeme için allocation detayını ekle
    const fetchAllocations = this.db.prepare<[number], AllocationRow>(`
      SELECT
        pa.id,
        pa.payment_transaction_id,
        pa.invoice_transaction_id,
        pa.amount_kurus,
        t.invoice_number,
        pa.created_at
      FROM payment_allocations pa
      LEFT JOIN transactions t ON t.id = pa.invoice_transaction_id
      WHERE pa.payment_transaction_id = ?
      ORDER BY pa.id ASC
    `);

    return payments.map(payment => ({
      ...payment,
      allocations: fetchAllocations.all(payment.id) as AllocationRow[],
    }));
  }

  // ── Private Helpers ──────────────────────────────────────────────────────────

  /**
   * Otomatik dağıtım: vadesi en eski açık faturaya öncelik ver.
   * @returns Toplam dağıtılan tutar
   */
  private _autoAllocate(
    paymentTxId: number,
    entityId: number,
    amountKurus: number,
  ): number {
    const openInvoices = this.db
      .prepare<[number], OpenInvoiceRow>(`
        SELECT id, remaining_kurus, due_date
        FROM v_open_invoices
        WHERE entity_id = ?
        ORDER BY due_date ASC NULLS LAST, id ASC
      `)
      .all(entityId);

    let remaining = amountKurus;

    for (const invoice of openInvoices) {
      if (remaining <= 0) break;

      const applyAmount = Math.min(remaining, invoice.remaining_kurus);

      this.db
        .prepare(`
          INSERT INTO payment_allocations
            (payment_transaction_id, invoice_transaction_id, amount_kurus)
          VALUES (?, ?, ?)
          ON CONFLICT(payment_transaction_id, invoice_transaction_id)
          DO UPDATE SET amount_kurus = amount_kurus + excluded.amount_kurus
        `)
        .run(paymentTxId, invoice.id, applyAmount);

      remaining -= applyAmount;
    }

    return amountKurus - remaining; // dağıtılan
  }

  /**
   * Manuel dağıtım: kullanıcı hangi faturaya ne kadar uygulanacağını belirtir.
   * Toplam dağıtım ödeme tutarını geçemez.
   * @returns Toplam dağıtılan tutar
   */
  private _applyManualAllocations(
    paymentTxId: number,
    allocations: AllocationInput[],
    paymentAmount: number,
  ): number {
    let totalAllocated = 0;

    for (const alloc of allocations) {
      if (!Number.isInteger(alloc.amountKurus) || alloc.amountKurus <= 0) {
        throw new Error(
          `Geçersiz dağıtım tutarı: ${alloc.amountKurus} (fatura #${alloc.invoiceId})`
        );
      }

      totalAllocated += alloc.amountKurus;

      if (totalAllocated > paymentAmount) {
        throw new Error(
          `Dağıtım toplamı (${totalAllocated} kr) ödeme tutarını ` +
          `(${paymentAmount} kr) geçemez`
        );
      }

      // Faturanın gerçekten açık ve yeterli kalan borcu olduğunu kontrol et
      const openInvoice = this.db
        .prepare<[number], OpenInvoiceRow | undefined>(
          'SELECT id, remaining_kurus FROM v_open_invoices WHERE id = ?'
        )
        .get(alloc.invoiceId);

      if (!openInvoice) {
        throw new Error(
          `Fatura açık değil veya bulunamadı: #${alloc.invoiceId}`
        );
      }

      if (alloc.amountKurus > openInvoice.remaining_kurus) {
        throw new Error(
          `Dağıtım tutarı (${alloc.amountKurus} kr) faturanın kalan borcunu ` +
          `(${openInvoice.remaining_kurus} kr) geçiyor: fatura #${alloc.invoiceId}`
        );
      }

      this.db
        .prepare(`
          INSERT INTO payment_allocations
            (payment_transaction_id, invoice_transaction_id, amount_kurus)
          VALUES (?, ?, ?)
          ON CONFLICT(payment_transaction_id, invoice_transaction_id)
          DO UPDATE SET amount_kurus = amount_kurus + excluded.amount_kurus
        `)
        .run(paymentTxId, alloc.invoiceId, alloc.amountKurus);
    }

    return totalAllocated;
  }

  /** audit_log'a tek satır INSERT */
  private _insertAuditLog(
    recordId: number,
    action: 'INSERT' | 'CANCEL',
    userId: number,
    payload: Record<string, unknown>,
  ): void {
    this.db
      .prepare(`
        INSERT INTO audit_log (table_name, record_id, action, summary, payload_json, user_id)
        VALUES ('transactions', ?, ?, ?, ?, ?)
      `)
      .run(
        recordId,
        action,
        `PAYMENT ${action} #${recordId}`,
        JSON.stringify(payload),
        userId,
      );
  }
}
