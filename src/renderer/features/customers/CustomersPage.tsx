import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Wallet, TrendingUp, Search, ChevronRight,
  Phone, MapPin, Plus, X, FileText, CreditCard, ShoppingCart,
} from 'lucide-react';
import { useCustomers, useCreateEntity } from '../../hooks/useEntities';
import { useEntityBalance, useOpenInvoices, useStatement } from '../../hooks/useLedger';
import { useRecordPaymentIn } from '../../hooks/usePayments';
import { useTransactions } from '../../hooks/useTransactions';
import { fromKurus, toKurus } from '../../utils/formatters';

// ─── Formatters ───────────────────────────────────────────────────────────────



// ─── Types ────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'active' | 'inactive';

interface Entity {
  id: number;
  title: string;
  phone?: string;
  city?: string;
  is_active: any;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// YeniMusteriModal
// ═══════════════════════════════════════════════════════════════════════════════

function YeniMusteriModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: '', phone: '', city: '', notes: '' });
  const [error, setError] = useState('');
  const createEntity = useCreateEntity();

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Müşteri adı zorunludur.'); return; }
    try {
      await createEntity.mutateAsync({ ...form, entity_type: 'customer' });
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Kayıt hatası');
    }
  };

  const field = (label: string, key: keyof typeof form, opts?: { textarea?: boolean; rows?: number }) => (
    <div>
      <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">{label}</label>
      {opts?.textarea ? (
        <textarea
          rows={opts.rows ?? 3}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none"
        />
      ) : (
        <input
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base" style={{ fontWeight: 500 }}>Yeni Müşteri</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {field('Müşteri Adı *', 'title')}
        {field('Telefon', 'phone')}
        {field('Şehir', 'city')}
        {field('Notlar', 'notes', { textarea: true, rows: 3 })}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg">İptal</button>
          <button
            onClick={handleSave}
            disabled={createEntity.isPending}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {createEntity.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TahsilatModal
// ═══════════════════════════════════════════════════════════════════════════════

function TahsilatModal({ entity, onClose }: { entity: Entity; onClose: () => void }) {
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), notes: '' });
  const [error, setError] = useState('');
  const { data: openInvoices } = useOpenInvoices(entity.id);
  const recordIn = useRecordPaymentIn();

  const handleSave = async () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) { setError('Geçerli bir tutar giriniz.'); return; }
    try {
      await recordIn.mutateAsync({
        entityId: entity.id,
        amount_kurus: toKurus(form.amount),
        payment_date: form.date,
        notes: form.notes,
      });
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Kayıt hatası');
    }
  };

  const totalOpen = (openInvoices as any[])?.reduce((s: number, inv: any) => s + (inv.remaining_kurus ?? 0), 0) ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base" style={{ fontWeight: 500 }}>Tahsilat — {entity.title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Tutar (₺) *</label>
          <input
            type="number" step="0.01" value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
            placeholder="0,00"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Tarih</label>
          <input
            type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Açıklama</label>
          <textarea
            rows={2} value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Açık Faturalar */}
        {(openInvoices as any[])?.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Açık Faturalar</label>
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
            <button
              onClick={() => setForm(f => ({ ...f, amount: (totalOpen / 100).toFixed(2) }))}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Otomatik Dağıt
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg">İptal</button>
          <button
            onClick={handleSave}
            disabled={recordIn.isPending}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {recordIn.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ExstreModal
// ═══════════════════════════════════════════════════════════════════════════════

function ExstreModal({ entity, onClose }: { entity: Entity; onClose: () => void }) {
  const { data: statement, isLoading } = useStatement(entity.id);
  const rows = ((statement as any)?.entries || (Array.isArray(statement) ? statement : [])) as any[];

  const typeLabel: Record<string, string> = {
    sale: 'Satış', purchase: 'Alış', payment_in: 'Tahsilat',
    payment_out: 'Ödeme', sale_return: 'İade',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base" style={{ fontWeight: 500 }}>Ekstre — {entity.title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
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
                {rows.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-10 text-center text-muted-foreground text-sm">Kayıt bulunamadı.</td></tr>
                ) : rows.map((r: any, i: number) => (
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

// ═══════════════════════════════════════════════════════════════════════════════
// ExpandedRow — balance + açık fatura hook'larını lazy çeker
// ═══════════════════════════════════════════════════════════════════════════════

function ExpandedRow({
  entity,
  onExstre,
  onTahsilat,
}: {
  entity: Entity;
  onExstre: () => void;
  onTahsilat: () => void;
}) {
  const navigate = useNavigate();
  const { data: balance } = useEntityBalance(entity.id);
  const balanceKurus = (balance as any)?.balance_kurus ?? 0;

  return (
    <tr>
      <td colSpan={7} className="p-0 border-b border-border/30">
        <div className="bg-muted/10 px-6 py-5 shadow-inner">
          <div className="grid grid-cols-4 gap-6 items-start">
            <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Müşteri</p>
              <p className="text-base font-medium">{entity.title}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">İletişim</p>
              <p className="text-base font-medium">{entity.phone || '—'}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Açık Bakiye</p>
              <p className="text-lg font-bold" style={{ color: balanceKurus > 0 ? 'var(--color-amber-600, #d97706)' : undefined }}>
                {balanceKurus > 0 ? fromKurus(balanceKurus) : '—'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={onExstre}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium border border-border/60 bg-card rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all shadow-sm"
                >
                  <FileText className="w-4 h-4" /> Ekstre
                </button>
                <button
                  onClick={onTahsilat}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium border border-border/60 bg-card rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all shadow-sm"
                >
                  <CreditCard className="w-4 h-4" /> Tahsilat
                </button>
              </div>
              <button
                onClick={() => navigate(`/sales?entityId=${entity.id}`)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" /> Yeni Satış
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CustomersPage
// ═══════════════════════════════════════════════════════════════════════════════

export default function CustomersPage() {
  const [filter, setFilter] = useState<FilterType>('active');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [exstreEntity, setExstreEntity] = useState<Entity | null>(null);
  const [tahsilatEntity, setTahsilatEntity] = useState<Entity | null>(null);

  const includeInactive = filter !== 'active';
  const { data: customers = [], isLoading, error } = useCustomers(includeInactive);

  // Bu ay payment_in
  const monthStart = new Date(); monthStart.setDate(1);
  const { data: monthPayments } = useTransactions({
    fromDate: monthStart.toISOString().slice(0, 10),
    type: 'payment_in',
    status: 'active',
  });
  const monthCollection = useMemo(
    () => (monthPayments as any[])?.reduce((s: number, t: any) => s + t.amount_kurus, 0) ?? 0,
    [monthPayments],
  );

  const filtered = useMemo(() => {
    let list = customers as Entity[];
    if (filter === 'active') list = list.filter(c => c.is_active);
    if (filter === 'inactive') list = list.filter(c => !c.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [customers, filter, search]);

  const activeCount = (customers as Entity[]).filter(c => c.is_active).length;
  const debtorCount = 0; // balance per-entity — placeholder

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Veriler yüklenirken hata: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto px-8 py-6 bg-background text-foreground no-scrollbar">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">Müşteriler</h1>
          <p className="text-sm font-medium text-muted-foreground">{(customers as Entity[]).length} kayıtlı müşteri</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Yeni Müşteri
        </button>
      </div>

      {/* ── KPI (3) ── */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Toplam Müşteri</span>
            <div className="p-2 rounded-lg bg-muted/50">
              <Users className="w-5 h-5 text-foreground/70" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{(customers as Entity[]).length}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">{activeCount} aktif</span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Açık Bakiye</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10">
              <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight text-muted-foreground/50">—</span>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">{debtorCount} borçlu</span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Bu Ay Tahsilat</span>
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-500/10">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-500" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{fromKurus(monthCollection)}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">nakit giriş</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Müşteri ara..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-border/60 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center bg-card border border-border/60 rounded-xl p-1 shadow-sm">
          {(['all', 'active', 'inactive'] as FilterType[]).map(f => {
            const labels = { all: 'Hepsi', active: 'Aktif', inactive: 'Pasif' };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${filter === f ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tablo ── */}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {[
                    { label: 'Müşteri Adı', cls: '' },
                    { label: 'Telefon', cls: '' },
                    { label: 'Şehir', cls: '' },
                    { label: 'Bakiye', cls: 'text-right' },
                    { label: 'Son İşlem', cls: 'text-right' },
                    { label: 'Durum', cls: 'text-center' },
                    { label: '', cls: '' },
                  ].map(h => (
                    <th key={h.label} className={`px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs ${h.cls}`}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground text-sm">
                      Arama kriterine uygun müşteri bulunamadı.
                    </td>
                  </tr>
              ) : filtered.map(c => {
                const isExpanded = expandedId === c.id;
                return (
                  <React.Fragment key={c.id}>
                    <tr
                      className="border-b last:border-b-0 border-border/30 hover:bg-muted/40 cursor-pointer transition-colors group"
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    >
                      <td className="px-6 py-4 text-sm font-medium">{c.title}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {c.phone ? (
                          <span className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 shrink-0" />{c.phone}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {c.city ? (
                          <span className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />{c.city}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-muted-foreground">—</td>
                      <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {c.is_active
                          ? <span className="text-xs font-medium px-2 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">Aktif</span>
                          : <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground">Pasif</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className={`w-4 h-4 text-muted-foreground inline-block transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <ExpandedRow
                        entity={c}
                        onExstre={() => setExstreEntity(c)}
                        onTahsilat={() => setTahsilatEntity(c)}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* ── Modaller ── */}
      {showNewModal && <YeniMusteriModal onClose={() => setShowNewModal(false)} />}
      {exstreEntity && <ExstreModal entity={exstreEntity} onClose={() => setExstreEntity(null)} />}
      {tahsilatEntity && <TahsilatModal entity={tahsilatEntity} onClose={() => setTahsilatEntity(null)} />}
    </div>
  );
}
