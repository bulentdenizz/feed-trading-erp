import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Wallet, TrendingDown, Search, ChevronRight,
  Phone, MapPin, Plus, X, FileText, CreditCard, ShoppingCart,
} from 'lucide-react';
import { useSuppliers, useCreateEntity } from '../../hooks/useEntities';
import { useEntityBalance, useOpenInvoices, useStatement } from '../../hooks/useLedger';
import { useRecordPaymentOut } from '../../hooks/usePayments';
import { useTransactions } from '../../hooks/useTransactions';
import { fromKurus, toKurus } from '../../utils/formatters';



type FilterType = 'all' | 'active' | 'inactive';

interface Entity {
  id: number;
  title: string;
  phone?: string;
  city?: string;
  category?: string;
  is_active: any;
  created_at: string;
}

const CATEGORIES = ['Büyükbaş Yem', 'Küçükbaş Yem', 'Kanatlı Yem', 'Yem Katkı'];

// ── YeniTedarikciModal ────────────────────────────────────────────────────────

function YeniTedarikciModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: '', phone: '', city: '', category: '', notes: '' });
  const [error, setError] = useState('');
  const createEntity = useCreateEntity();

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Tedarikçi adı zorunludur.'); return; }
    try {
      await createEntity.mutateAsync({ ...form, entity_type: 'supplier' });
      onClose();
    } catch (e: any) { setError(e.message ?? 'Kayıt hatası'); }
  };

  const inputCls = 'w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors';
  const labelCls = 'text-xs text-muted-foreground uppercase tracking-wide block mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base" style={{ fontWeight: 500 }}>Yeni Tedarikçi</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div>
          <label className={labelCls}>Tedarikçi Adı *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Telefon</label>
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Şehir</label>
          <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Kategori</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
            <option value="">Seçiniz</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Notlar</label>
          <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls + ' resize-none'} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg">İptal</button>
          <button onClick={handleSave} disabled={createEntity.isPending} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {createEntity.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── OdemeModal ────────────────────────────────────────────────────────────────

function OdemeModal({ entity, onClose }: { entity: Entity; onClose: () => void }) {
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), notes: '' });
  const [error, setError] = useState('');
  const { data: openInvoices } = useOpenInvoices(entity.id);
  const recordOut = useRecordPaymentOut();

  const totalOpen = (openInvoices as any[])?.reduce((s: number, inv: any) => s + (inv.remaining_kurus ?? 0), 0) ?? 0;

  const handleSave = async () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) { setError('Geçerli bir tutar giriniz.'); return; }
    try {
      await recordOut.mutateAsync({ entityId: entity.id, amount_kurus: toKurus(form.amount), payment_date: form.date, notes: form.notes });
      onClose();
    } catch (e: any) { setError(e.message ?? 'Kayıt hatası'); }
  };

  const inputCls = 'w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors';
  const labelCls = 'text-xs text-muted-foreground uppercase tracking-wide block mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base" style={{ fontWeight: 500 }}>Ödeme Yap — {entity.title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div>
          <label className={labelCls}>Tutar (₺) *</label>
          <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} placeholder="0,00" />
        </div>
        <div>
          <label className={labelCls}>Tarih</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Açıklama</label>
          <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls + ' resize-none'} />
        </div>
        {(openInvoices as any[])?.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>Açık Faturalar</label>
              <span className="text-xs text-muted-foreground">Toplam: {fromKurus(totalOpen)}</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {(openInvoices as any[]).map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md bg-muted/40">
                  <span className="text-muted-foreground">{inv.invoice_number || `#${inv.id}`}</span>
                  <div className="flex items-center gap-3">
                    <span>{fromKurus(inv.remaining_kurus)}</span>
                    {inv.due_date && <span className="text-muted-foreground">{new Date(inv.due_date).toLocaleDateString('tr-TR')}</span>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setForm(f => ({ ...f, amount: (totalOpen / 100).toFixed(2) }))} className="mt-2 text-xs text-primary hover:underline">
              Otomatik Dağıt
            </button>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg">İptal</button>
          <button onClick={handleSave} disabled={recordOut.isPending} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {recordOut.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ExstreModal ───────────────────────────────────────────────────────────────

function ExstreModal({ entity, onClose }: { entity: Entity; onClose: () => void }) {
  const { data: statement, isLoading } = useStatement(entity.id);
  const rows = ((statement as any)?.entries || (Array.isArray(statement) ? statement : [])) as any[];
  const typeLabel: Record<string, string> = { sale: 'Satış', purchase: 'Alış', payment_in: 'Tahsilat', payment_out: 'Ödeme', sale_return: 'İade' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base" style={{ fontWeight: 500 }}>Ekstre — {entity.title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Tarih', 'Tür', 'Tutar', 'Çalışan Bakiye'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-muted-foreground font-normal uppercase tracking-wide" style={{ fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={4} className="px-3 py-10 text-center text-muted-foreground text-sm">Kayıt bulunamadı.</td></tr>
                  : rows.map((r: any, i: number) => (
                    <tr key={i} className="border-t border-border hover:bg-muted/40 transition-colors">
                      <td className="px-3 py-2 text-sm text-muted-foreground">{r.date ? new Date(r.date).toLocaleDateString('tr-TR') : '—'}</td>
                      <td className="px-3 py-2 text-sm">{typeLabel[r.type] ?? r.type ?? '—'}</td>
                      <td className="px-3 py-2 text-sm" style={{ fontWeight: 700 }}>{fromKurus(r.amount_kurus ?? 0)}</td>
                      <td className="px-3 py-2 text-sm">{fromKurus(r.running_balance_kurus ?? 0)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ExpandedRow ───────────────────────────────────────────────────────────────

function ExpandedRow({ entity, onExstre, onOdeme }: { entity: Entity; onExstre: () => void; onOdeme: () => void }) {
  const navigate = useNavigate();
  const { data: balance } = useEntityBalance(entity.id);
  const balanceKurus = (balance as any)?.balance_kurus ?? 0;

  return (
    <tr>
      <td colSpan={7} className="border-t border-border">
        <div className="bg-muted/30 px-6 py-4">
          <div className="grid grid-cols-4 gap-4 items-start">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tedarikçi</p>
              <p className="text-sm" style={{ fontWeight: 500 }}>{entity.title}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">İletişim</p>
              <p className="text-sm text-muted-foreground">{entity.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Toplam Borç</p>
              <p className="text-sm" style={{ fontWeight: 700, color: balanceKurus > 0 ? '#dc2626' : undefined }}>
                {balanceKurus > 0 ? fromKurus(balanceKurus) : '—'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onExstre} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <FileText className="w-3.5 h-3.5" /> Ekstre
              </button>
              <button onClick={onOdeme} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <CreditCard className="w-3.5 h-3.5" /> Ödeme Yap
              </button>
              <button onClick={() => navigate(`/purchases?entityId=${entity.id}`)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                <ShoppingCart className="w-3.5 h-3.5" /> Yeni Alış
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── SuppliersPage ─────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [filter, setFilter] = useState<FilterType>('active');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [exstreEntity, setExstreEntity] = useState<Entity | null>(null);
  const [odemeEntity, setOdemeEntity] = useState<Entity | null>(null);

  const includeInactive = filter !== 'active';
  const { data: suppliers = [], isLoading, error } = useSuppliers(includeInactive);

  const monthStart = new Date(); monthStart.setDate(1);
  const { data: monthPayments } = useTransactions({ fromDate: monthStart.toISOString().slice(0, 10), type: 'payment_out', status: 'active' });
  const monthTotal = useMemo(() => (monthPayments as any[])?.reduce((s: number, t: any) => s + t.amount_kurus, 0) ?? 0, [monthPayments]);

  const filtered = useMemo(() => {
    let list = suppliers as Entity[];
    if (filter === 'active') list = list.filter(c => c.is_active);
    if (filter === 'inactive') list = list.filter(c => !c.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q));
    }
    return list;
  }, [suppliers, filter, search]);

  const activeCount = (suppliers as Entity[]).filter(c => c.is_active).length;

  if (error) return <div className="p-6"><p className="text-sm text-red-600">Veriler yüklenirken hata: {(error as Error).message}</p></div>;

  return (
    <div className="flex-1 overflow-auto p-6 bg-background text-foreground">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium mb-0.5">Tedarikçiler</h1>
          <p className="text-sm text-muted-foreground">{(suppliers as Entity[]).length} kayıtlı tedarikçi</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Yeni Tedarikçi
        </button>
      </div>

      {/* KPI (3) */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Toplam Tedarikçi</span>
            <Truck className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>{(suppliers as Entity[]).length}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">{activeCount} aktif</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Toplam Borç</span>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>—</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">borçlu</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Bu Ay Ödeme</span>
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>{fromKurus(monthTotal)}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">nakit çıkış</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tedarikçi ara..." className="w-full pl-9 pr-3 py-2 text-sm bg-input-background border border-border rounded-lg outline-none focus:border-primary transition-colors" />
        </div>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          {(['all', 'active', 'inactive'] as FilterType[]).map(f => {
            const labels = { all: 'Hepsi', active: 'Aktif', inactive: 'Pasif' };
            return (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-sm transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  { label: 'Tedarikçi Adı', cls: '' },
                  { label: 'Telefon', cls: '' },
                  { label: 'Şehir', cls: '' },
                  { label: 'Alacak', cls: 'text-right' },
                  { label: 'Son İşlem', cls: 'text-right' },
                  { label: 'Kategori', cls: '' },
                  { label: '', cls: '' },
                ].map(h => (
                  <th key={h.label} className={`px-4 py-2.5 text-left text-muted-foreground font-normal uppercase tracking-wide ${h.cls}`} style={{ fontSize: 11 }}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">Arama kriterine uygun tedarikçi bulunamadı.</td></tr>
              ) : filtered.map(c => {
                const isExpanded = expandedId === c.id;
                return (
                  <React.Fragment key={c.id}>
                    <tr className="border-t border-border hover:bg-muted/40 cursor-pointer transition-colors" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                      <td className="px-4 py-3 text-sm" style={{ fontWeight: 500 }}>{c.title}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {c.phone ? <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 shrink-0" />{c.phone}</span> : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {c.city ? <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 shrink-0" />{c.city}</span> : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">—</td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('tr-TR')}</td>
                      <td className="px-4 py-3">
                        {c.category
                          ? <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">{c.category}</span>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <ExpandedRow entity={c} onExstre={() => setExstreEntity(c)} onOdeme={() => setOdemeEntity(c)} />
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modaller */}
      {showNewModal && <YeniTedarikciModal onClose={() => setShowNewModal(false)} />}
      {exstreEntity && <ExstreModal entity={exstreEntity} onClose={() => setExstreEntity(null)} />}
      {odemeEntity && <OdemeModal entity={odemeEntity} onClose={() => setOdemeEntity(null)} />}
    </div>
  );
}
