/**
 * Payment IPC Handlers — Tahsilat ve ödeme yönetimi
 */

import { ipcMain } from 'electron';
import { getDb } from '../db/index';
import { PaymentService } from '../services/PaymentService';
import { InvoiceNumberService } from '../services/InvoiceNumberService';
import { sessionStore } from '../utils/sessionStore';
import { logger } from '../utils/logger';

export function registerPaymentHandlers(): void {
  const db             = getDb();
  const invoiceService = new InvoiceNumberService(db);
  const paymentService = new PaymentService(db, invoiceService);

  // ── payments:recordIn — müşteri tahsilatı ─────────────────────────────────
  ipcMain.handle('payments:recordIn', async (_event, { token, data }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const result = paymentService.recordPayment(data, 'payment_in', session.userId);
      return { ok: true, data: result };
    } catch (err: any) {
      logger.warn('payments:recordIn başarısız', { error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── payments:recordOut — tedarikçi ödemesi ────────────────────────────────
  ipcMain.handle('payments:recordOut', async (_event, { token, data }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const result = paymentService.recordPayment(data, 'payment_out', session.userId);
      return { ok: true, data: result };
    } catch (err: any) {
      logger.warn('payments:recordOut başarısız', { error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── payments:cancel ────────────────────────────────────────────────────────
  ipcMain.handle('payments:cancel', async (_event, { token, id, reason }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      if (!reason || String(reason).trim().length < 3) {
        return { ok: false, code: 'VALIDATION', message: 'İptal nedeni en az 3 karakter olmalı' };
      }

      paymentService.cancelPayment(Number(id), String(reason).trim(), session.userId);
      return { ok: true };
    } catch (err: any) {
      logger.warn('payments:cancel başarısız', { id, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── payments:getHistory ────────────────────────────────────────────────────
  ipcMain.handle('payments:getHistory', async (_event, { token, entityId, limit, offset }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const data = paymentService.getPaymentHistory(
        Number(entityId),
        limit  !== undefined ? Number(limit)  : 50,
        offset !== undefined ? Number(offset) : 0,
      );
      return { ok: true, data };
    } catch (err: any) {
      logger.warn('payments:getHistory başarısız', { entityId, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── payments:getUnallocated ────────────────────────────────────────────────
  ipcMain.handle('payments:getUnallocated', async (_event, { token, entityId }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const unallocated = paymentService.getUnallocatedAmount(Number(entityId));
      return { ok: true, data: { entityId: Number(entityId), unallocated } };
    } catch (err: any) {
      logger.warn('payments:getUnallocated başarısız', { entityId, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  logger.info('Payment handler\'ları kaydedildi');
}
