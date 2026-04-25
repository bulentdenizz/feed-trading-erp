/**
 * EntityService — Cari (müşteri/tedarikçi) yönetimi
 *
 * Kural: entities tablosuna balance kolonu yoktur ve eklenmez.
 * Bakiye her zaman v_entity_balances view'ından okunur.
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EntityType = 'customer' | 'supplier';

export interface EntityRow {
  id: number;
  title: string;
  entity_type: EntityType;
  phone: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  tax_number: string | null;
  category: string | null;
  is_active: number;
  created_at: string;
  created_by: number | null;
}

export interface EntityWithBalance extends EntityRow {
  balance_kurus: number;
}

export interface CreateEntityData {
  title: string;
  entity_type: EntityType;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
  tax_number?: string;
  category?: string;
}

export interface UpdateEntityData {
  title?: string;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
  tax_number?: string;
  category?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class EntityService {
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // ── Write Operations ────────────────────────────────────────────────────────

  /**
   * Yeni cari oluşturur.
   * @returns Oluşturulan entity'nin id'si
   */
  createEntity(data: CreateEntityData, userId: number): number {
    const title = data.title?.trim();
    if (!title) {
      throw new Error('Cari adı boş olamaz');
    }

    if (data.entity_type !== 'customer' && data.entity_type !== 'supplier') {
      throw new Error('Geçersiz cari tipi. "customer" veya "supplier" olmalı');
    }

    const execute = this.db.transaction((): number => {
      const result = this.db
        .prepare(`
          INSERT INTO entities
            (title, entity_type, phone, address, city, notes,
             tax_number, category, is_active, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `)
        .run(
          title,
          data.entity_type,
          data.phone?.trim() ?? null,
          data.address?.trim() ?? null,
          data.city?.trim() ?? null,
          data.notes?.trim() ?? null,
          data.tax_number?.trim() ?? null,
          data.category?.trim() ?? null,
          userId,
        );

      return result.lastInsertRowid as number;
    });

    const id = execute();

    logger.info('Cari oluşturuldu', { id, title, entity_type: data.entity_type, userId });

    return id;
  }

  /**
   * Cari bilgilerini günceller.
   * entity_type değiştirilemez — bu alan güncelleme verisinden yoksayılır.
   */
  updateEntity(id: number, data: UpdateEntityData, userId: number): void {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) {
      const title = data.title.trim();
      if (!title) throw new Error('Cari adı boş olamaz');
      fields.push('title = ?');
      values.push(title);
    }
    if (data.phone     !== undefined) { fields.push('phone = ?');      values.push(data.phone?.trim() || null); }
    if (data.address   !== undefined) { fields.push('address = ?');    values.push(data.address?.trim() || null); }
    if (data.city      !== undefined) { fields.push('city = ?');       values.push(data.city?.trim() || null); }
    if (data.notes     !== undefined) { fields.push('notes = ?');      values.push(data.notes?.trim() || null); }
    if (data.tax_number !== undefined) { fields.push('tax_number = ?'); values.push(data.tax_number?.trim() || null); }
    if (data.category  !== undefined) { fields.push('category = ?');   values.push(data.category?.trim() || null); }

    if (fields.length === 0) return; // Güncellenecek alan yok

    values.push(id); // WHERE id = ?

    this.db
      .prepare(`UPDATE entities SET ${fields.join(', ')} WHERE id = ?`)
      .run(...values);

    logger.info('Cari güncellendi', { id, fields: fields.map(f => f.split(' ')[0]), userId });
  }

  /**
   * Cariyi pasif yapar (soft-delete).
   * Açık faturası olan cari deaktive edilemez.
   */
  deactivateEntity(id: number, userId: number): void {
    const execute = this.db.transaction((): void => {
      // Açık fatura kontrolü (v_open_invoices)
      const openInvoice = this.db
        .prepare<[number]>(
          'SELECT id FROM v_open_invoices WHERE entity_id = ? LIMIT 1'
        )
        .get(id);

      if (openInvoice) {
        throw new Error(
          `Bu cari kapatılamaz: açık/ödenmemiş faturası bulunuyor (cari #${id})`
        );
      }

      this.db
        .prepare('UPDATE entities SET is_active = 0 WHERE id = ?')
        .run(id);
    });

    execute();

    logger.info('Cari pasif yapıldı', { id, userId });
  }

  // ── Read Operations ─────────────────────────────────────────────────────────

  /**
   * Tek cari + bakiyesini döner.
   * Bulunamazsa null döner.
   */
  getEntity(id: number): EntityWithBalance | null {
    const row = this.db
      .prepare<[number]>(`
        SELECT
          e.id, e.title, e.entity_type, e.phone, e.address, e.city,
          e.notes, e.tax_number, e.category, e.is_active,
          e.created_at, e.created_by,
          COALESCE(vb.balance_kurus, 0) AS balance_kurus
        FROM entities e
        LEFT JOIN v_entity_balances vb ON vb.entity_id = e.id
        WHERE e.id = ?
      `)
      .get(id) as EntityWithBalance | undefined;

    return row ?? null;
  }

  /**
   * Cari listesini bakiyesiyle döner.
   * @param type - 'customer' | 'supplier'
   * @param includeInactive - Pasif carileri dahil et (default: false)
   */
  listEntities(type: EntityType, includeInactive = false): EntityWithBalance[] {
    const rows = this.db
      .prepare<[EntityType, number]>(`
        SELECT
          vb.entity_id AS id,
          vb.title,
          vb.entity_type,
          vb.phone,
          vb.city,
          vb.is_active,
          vb.balance_kurus,
          e.address, e.notes, e.tax_number, e.category,
          e.created_at, e.created_by
        FROM v_entity_balances vb
        JOIN entities e ON e.id = vb.entity_id
        WHERE vb.entity_type = ?
          AND (? = 1 OR vb.is_active = 1)
        ORDER BY vb.title COLLATE NOCASE ASC
      `)
      .all(type, includeInactive ? 1 : 0) as EntityWithBalance[];

    return rows;
  }

  /**
   * Başlığa göre cari arar.
   * @param query - En az 2 karakter
   * @param type  - Opsiyonel tip filtresi
   */
  searchEntities(query: string, type?: EntityType): EntityWithBalance[] {
    if (!query || query.trim().length < 2) {
      throw new Error('Arama terimi en az 2 karakter olmalı');
    }

    const pattern = `%${query.trim()}%`;

    if (type) {
      return this.db
        .prepare<[string, EntityType]>(`
          SELECT
            vb.entity_id AS id,
            vb.title, vb.entity_type, vb.phone, vb.city,
            vb.is_active, vb.balance_kurus,
            e.address, e.notes, e.tax_number, e.category,
            e.created_at, e.created_by
          FROM v_entity_balances vb
          JOIN entities e ON e.id = vb.entity_id
          WHERE vb.title LIKE ? AND vb.entity_type = ?
          ORDER BY vb.title COLLATE NOCASE ASC
        `)
        .all(pattern, type) as EntityWithBalance[];
    }

    return this.db
      .prepare<[string]>(`
        SELECT
          vb.entity_id AS id,
          vb.title, vb.entity_type, vb.phone, vb.city,
          vb.is_active, vb.balance_kurus,
          e.address, e.notes, e.tax_number, e.category,
          e.created_at, e.created_by
        FROM v_entity_balances vb
        JOIN entities e ON e.id = vb.entity_id
        WHERE vb.title LIKE ?
        ORDER BY vb.title COLLATE NOCASE ASC
      `)
      .all(pattern) as EntityWithBalance[];
  }
}
