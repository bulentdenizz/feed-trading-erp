/**
 * InvoiceNumberService — Atomik, yıl-duyarlı fatura numarası üretici
 *
 * Format: {PREFIX}-{YIL}-{SIRA:04d}
 * Örnek : SAT-2026-0042
 *
 * Yıl değiştiğinde sıra otomatik olarak 1'e sıfırlanır.
 * Tüm okuma + yazma işlemi tek bir SQLite transaction içinde gerçekleşir;
 * SELECT-then-UPDATE yarış koşuluna (race condition) izin vermez.
 */

import Database from 'better-sqlite3';

export type InvoiceType = 'sale' | 'purchase' | 'payment_in' | 'payment_out';

interface SequenceRow {
  type: InvoiceType;
  prefix: string;
  last_number: number;
  year: number;
}

/** Varsayılan sequence tanımları */
const DEFAULT_SEQUENCES: Array<{ type: InvoiceType; prefix: string }> = [
  { type: 'sale',        prefix: 'SAT' },
  { type: 'purchase',    prefix: 'ALI' },
  { type: 'payment_in',  prefix: 'TAH' },
  { type: 'payment_out', prefix: 'ODE' },
];

export class InvoiceNumberService {
  private readonly db: Database.Database;

  /** Sıradaki numarayı atomik olarak artırır ve formatlanmış fatura numarasını döner */
  private readonly _next: Database.Transaction<(type: InvoiceType) => string>;

  constructor(db: Database.Database) {
    this.db = db;

    /**
     * Transaction fonksiyonunu constructor'da bir kez oluşturuyoruz.
     * better-sqlite3'te db.transaction() synchronous'tur; ACID garantisi sağlar.
     */
    this._next = this.db.transaction((type: InvoiceType): string => {
      const currentYear = new Date().getFullYear();

      // Mevcut sequence satırını kilitle ve oku
      const row = this.db
        .prepare<[InvoiceType], SequenceRow>(
          'SELECT type, prefix, last_number, year FROM invoice_sequences WHERE type = ?'
        )
        .get(type);

      if (!row) {
        throw new Error(
          `[InvoiceNumberService] Sequence bulunamadı: "${type}". ` +
          'initSequences() çağrıldığından emin olun.'
        );
      }

      // Yıl değişmişse sırayı sıfırla, aksi hâlde atomik artır
      if (row.year !== currentYear) {
        this.db
          .prepare(
            'UPDATE invoice_sequences SET last_number = 1, year = ? WHERE type = ?'
          )
          .run(currentYear, type);

        return `${row.prefix}-${currentYear}-${String(1).padStart(4, '0')}`;
      }

      // Atomik artış: UPDATE … SET last_number = last_number + 1
      this.db
        .prepare(
          'UPDATE invoice_sequences SET last_number = last_number + 1 WHERE type = ?'
        )
        .run(type);

      const newNumber = row.last_number + 1;
      return `${row.prefix}-${currentYear}-${String(newNumber).padStart(4, '0')}`;
    });
  }

  /**
   * Sonraki fatura numarasını üretir.
   *
   * @param type - İşlem tipi: 'sale' | 'purchase' | 'payment_in' | 'payment_out'
   * @returns Formatlanmış fatura numarası (örn. "SAT-2026-0042")
   * @throws Sequence kaydı eksikse hata fırlatır
   */
  next(type: InvoiceType): string {
    return this._next(type);
  }

  /**
   * Dört varsayılan sequence kaydını veritabanına ekler.
   * Kayıt zaten varsa atlar (INSERT OR IGNORE).
   *
   * Uygulama başlangıcında (initDb sonrası) bir kez çağrılmalıdır.
   */
  initSequences(): void {
    const currentYear = new Date().getFullYear();

    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO invoice_sequences (type, prefix, last_number, year)
      VALUES (?, ?, 0, ?)
    `);

    const insertAll = this.db.transaction(() => {
      for (const seq of DEFAULT_SEQUENCES) {
        insert.run(seq.type, seq.prefix, currentYear);
      }
    });

    insertAll();

    console.log('[InvoiceNumberService] Sequences initialized');
  }
}
