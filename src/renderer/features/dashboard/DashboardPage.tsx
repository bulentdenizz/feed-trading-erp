import React, { useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Wallet, Users, Package } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useAgingReport } from '../../hooks/useLedger';
import { useItems } from '../../hooks/useItems';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Yardımcı ────────────────────────────────────────────────────────────────

import { fromKurus } from '../../utils/formatters';

function daysBetween(a: Date, b: Date) {
  return Math.ceil((a.getTime() - b.getTime()) / 86_400_000);
}

// ─── Mock veri (backend reports API henüz yok) ───────────────────────────────

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const MOCK_REVENUE: { month: string; gelir: number; gider: number }[] = MONTHS.map((month, i) => ({
  month,
  gelir: 180_000 + Math.sin(i * 0.8) * 60_000 + Math.random() * 30_000,
  gider: 120_000 + Math.cos(i * 0.6) * 40_000 + Math.random() * 20_000,
}));

const MOCK_CATEGORY = [
  { name: 'Karma Yem', value: 42 },
  { name: 'Kesif Yem', value: 28 },
  { name: 'Kaba Yem', value: 19 },
  { name: 'Vitamin', value: 11 },
];

const MOCK_WEEKLY: { gun: string; satis: number }[] = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(gun => ({
  gun,
  satis: 40_000 + Math.random() * 80_000,
}));

const MOCK_DUE = [
  { title: 'Ahmet Çiftlik', amount_kurus: 384_500, due_date: new Date(Date.now() + 2 * 86_400_000).toISOString() },
  { title: 'Koç Hayvancılık', amount_kurus: 215_000, due_date: new Date(Date.now() + 5 * 86_400_000).toISOString() },
  { title: 'Yılmaz Tarım', amount_kurus: 127_800, due_date: new Date(Date.now() + 9 * 86_400_000).toISOString() },
  { title: 'Bozkurt Çiftliği', amount_kurus: 96_250, due_date: new Date(Date.now() + 14 * 86_400_000).toISOString() },
];

const PIE_COLORS = ['#16A34A', '#3b82f6', '#f59e0b', '#8b5cf6'];

// ─── Alt bileşenler ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fromKurus(p.value)}
        </p>
      ))}
    </div>
  );
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p style={{ color: '#16A34A' }}>Satış: {fromKurus(payload[0]?.value)}</p>
    </div>
  );
};

// ─── Ana bileşen ─────────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const { username } = useAuthStore();
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date();

  // ── Gerçek veriler ─────────────────────────────────────────────────────────
  const { data: sales }       = useTransactions({ fromDate: todayStr, type: 'sale', status: 'active' });
  const { data: payments }    = useTransactions({ fromDate: todayStr, type: 'payment_in', status: 'active' });
  const { data: agingReport } = useAgingReport('customer');
  const { data: items }       = useItems(false);
  const { data: recentTx }    = useTransactions({ limit: 5 });

  // ── KPI hesaplama ──────────────────────────────────────────────────────────
  const todaySalesTotal    = useMemo(() => sales?.reduce((s, t) => s + t.amount_kurus, 0) ?? 0, [sales]);
  const todayPaymentsTotal = useMemo(() => payments?.reduce((s, t) => s + t.amount_kurus, 0) ?? 0, [payments]);
  const totalReceivables   = useMemo(() => agingReport?.grand_total_kurus ?? 0, [agingReport]);
  const lowStockCount      = useMemo(
    () => items?.filter(it => it.current_stock <= it.low_stock_threshold).length ?? 0,
    [items],
  );

  // ── Son İşlemler tablosu ──────────────────────────────────────────────────
  const typeLabel: Record<string, string> = {
    sale: 'Satış', purchase: 'Alış', payment_in: 'Tahsilat', payment_out: 'Ödeme',
    sale_return: 'İade', purchase_return: 'Alış İade',
  };

  const typeBadge = (type: string) => {
    if (type === 'sale' || type === 'sale_return')
      return <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">{typeLabel[type] ?? type}</span>;
    if (type === 'purchase' || type === 'purchase_return')
      return <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">{typeLabel[type] ?? type}</span>;
    return <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{typeLabel[type] ?? type}</span>;
  };

  const statusBadge = (t: any) => {
    if (t.status === 'cancelled')
      return <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">İptal</span>;
    if (t.due_date) {
      const isOverdue = new Date(t.due_date) < today;
      return isOverdue
        ? <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">Gecikmiş</span>
        : <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">Vadeli</span>;
    }
    return <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">Ödendi</span>;
  };

  // ── Yaklaşan vadeler ───────────────────────────────────────────────────────
  const upcomingDues = useMemo(() => {
    if (!agingReport) return MOCK_DUE;
    const items30 = agingReport.overdue_30?.items ?? [];
    return items30
      .slice(0, 4)
      .map((it: any) => ({ title: it.title, amount_kurus: it.remaining_kurus, due_date: it.due_date }));
  }, [agingReport]);

  const dueBadge = (dueDate: string) => {
    const days = daysBetween(new Date(dueDate), today);
    if (days <= 3) return <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">{days}g</span>;
    if (days <= 7) return <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">{days}g</span>;
    return <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">{days}g</span>;
  };

  return (
    <div className="flex-1 overflow-auto px-8 py-6 bg-background text-foreground no-scrollbar">

      {/* ── Başlık ── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">Gösterge Paneli</h1>
          <p className="text-sm font-medium text-muted-foreground">
            {today.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            {username ? ` — Hoşgeldiniz, ${username}` : ''}
          </p>
        </div>
      </div>

      {/* ── KPI Grid (4) ── */}
      <div className="grid grid-cols-4 gap-6 mb-8">

        {/* Bugünkü Satış */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Bugünkü Satış</span>
            <div className="p-2 rounded-lg bg-muted/50">
              <Wallet className="w-5 h-5 text-foreground/70" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{fromKurus(todaySalesTotal)}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">tahakkuk</span>
          </div>
        </div>

        {/* Bugünkü Tahsilat */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Bugünkü Tahsilat</span>
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-500/10">
              <Wallet className="w-5 h-5 text-green-600 dark:text-green-500" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{fromKurus(todayPaymentsTotal)}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">nakit girişi</span>
          </div>
        </div>

        {/* Açık Alacak */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Açık Alacak</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{fromKurus(totalReceivables)}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">toplam bekleyen</span>
          </div>
        </div>

        {/* Kritik Stok */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Kritik Stok</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10">
              <Package className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{lowStockCount} Ürün</span>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">eşik altında</span>
          </div>
        </div>
      </div>

      {/* ── Chart Row 1 ── */}
      <div className="grid grid-cols-3 gap-6 mb-8">

        {/* Gelir/Gider AreaChart — col-span-2 */}
        <div className="col-span-2 bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Gelir / Gider (Son 12 Ay)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_REVENUE} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradGelir" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A34A" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradGider" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="gelir" name="Gelir" stroke="#16A34A" strokeWidth={1.5} fill="url(#gradGelir)" dot={false} />
              <Area type="monotone" dataKey="gider" name="Gider" stroke="#3b82f6" strokeWidth={1.5} fill="url(#gradGider)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Kategori Dağılımı PieChart — col-span-1 */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Kategori Dağılımı</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={MOCK_CATEGORY}
                dataKey="value"
                innerRadius={55}
                outerRadius={80}
                stroke="none"
                paddingAngle={4}
              >
                {MOCK_CATEGORY.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {MOCK_CATEGORY.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <span style={{ fontWeight: 700 }}>%{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chart Row 2 ── */}
      <div className="grid grid-cols-3 gap-6 mb-8">

        {/* Haftalık Satış BarChart — col-span-1 */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Haftalık Satış</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MOCK_WEEKLY} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="gun" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} dx={-10} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
              <Bar dataKey="satis" fill="#16A34A" barSize={28} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Son İşlemler tablosu — col-span-2 */}
        <div className="col-span-2 bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-border/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Son İşlemler</h2>
            <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Tümünü Gör
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {['Cari', 'Tip', 'Tarih', 'Durum', 'Tutar'].map(h => (
                    <th
                      key={h}
                      className={`px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs ${h === 'Tutar' ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentTx || []).length > 0 ? (recentTx || []).map(t => (
                  <tr key={t.id} className="border-b last:border-b-0 border-border/30 hover:bg-muted/40 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 text-sm font-medium">{t.entity_title || '—'}</td>
                    <td className="px-6 py-4">{typeBadge(t.transaction_type)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {new Date(t.transaction_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">{statusBadge(t)}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold">{fromKurus(t.amount_kurus)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">
                      Henüz işlem kaydı yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Yaklaşan Vadeler (grid-cols-4) ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Yaklaşan Vadeler</h2>
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Raporlara Git
          </button>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {(upcomingDues.length > 0 ? upcomingDues : MOCK_DUE).map((due: any, i: number) => (
            <div key={i} className="border border-border/60 rounded-2xl p-5 bg-card shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3 group">
              <p className="text-sm font-medium truncate text-muted-foreground group-hover:text-foreground transition-colors">{due.title}</p>
              <p className="text-2xl font-bold tracking-tight">{fromKurus(due.amount_kurus)}</p>
              <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/40">
                <span className="text-xs font-medium text-muted-foreground">
                  {new Date(due.due_date).toLocaleDateString('tr-TR')}
                </span>
                {dueBadge(due.due_date)}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;
