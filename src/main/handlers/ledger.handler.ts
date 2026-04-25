/**
 * Ledger IPC Handlers — Bakiye, ekstre, açık fatura ve yaşlandırma raporu
 */

import { ipcMain } from 'electron';
import { getDb } from '../db/index';
import { LedgerService, AgingReport } from '../services/LedgerService';
import { EntityType } from '../services/EntityService';
import { sessionStore } from '../utils/sessionStore';
import { logger } from '../utils/logger';

export function registerLedgerHandlers(): void {
  const db            = getDb();
  const ledgerService = new LedgerService(db);

  // ── ledger:getBalance ──────────────────────────────────────────────────────
  ipcMain.handle('ledger:getBalance', async (_event, { token, entityId }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const balance = ledgerService.getBalance(Number(entityId));
      return { ok: true, data: { entityId: Number(entityId), balance_kurus: balance } };
    } catch (err: any) {
      logger.warn('ledger:getBalance başarısız', { entityId, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── ledger:getStatement ────────────────────────────────────────────────────
  ipcMain.handle('ledger:getStatement', async (_event, { token, entityId, fromDate, toDate }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const data = ledgerService.getStatement(
        Number(entityId),
        fromDate ?? undefined,
        toDate   ?? undefined,
      );
      return { ok: true, data };
    } catch (err: any) {
      logger.warn('ledger:getStatement başarısız', { entityId, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── ledger:getOpenInvoices ─────────────────────────────────────────────────
  ipcMain.handle('ledger:getOpenInvoices', async (_event, { token, entityId }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const data = ledgerService.getOpenInvoices(Number(entityId));
      return { ok: true, data };
    } catch (err: any) {
      logger.warn('ledger:getOpenInvoices başarısız', { entityId, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── ledger:getAgingReport ──────────────────────────────────────────────────
  ipcMain.handle('ledger:getAgingReport', async (_event, { token, type }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      if (type !== 'customer' && type !== 'supplier') {
        return { ok: false, code: 'VALIDATION', message: 'Geçersiz tip. "customer" veya "supplier" olmalı' };
      }

      const data: AgingReport = ledgerService.getAgingReport(type as EntityType);
      return { ok: true, data };
    } catch (err: any) {
      logger.warn('ledger:getAgingReport başarısız', { type, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  logger.info('Ledger handler\'ları kaydedildi');
}
