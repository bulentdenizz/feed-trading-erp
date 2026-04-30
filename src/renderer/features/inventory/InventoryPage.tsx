import React, { useState, useMemo } from 'react';
import {
  Package, TrendingUp, AlertTriangle, Search,
  ChevronUp, ChevronDown, Plus, X,
} from 'lucide-react';
import { useItems, useCreateItem, useAdjustStock } from '../../hooks/useItems';
import { fromKurus, toKurus } from '../../utils/formatters';

// ─── Formatters ───────────────────────────────────────────────────────────────



// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = 'ad' | 'stok' | 'satisFiyati' | null;
type SortDir = 'asc' | 'desc';

interface Item {
  item_id: number;
  id?: number;
  name: string;
  sku?: string;
  unit?: string;
  category?: string;
  current_stock: number;
  low_stock_threshold: number;
  default_sale_price_kurus: number;
  default_buy_price_kurus: number;
  is_active: any;
}

const CATEGORIES = ['Büyükbaş Yem', 'Küçükbaş Yem', 'Kanatlı Yem', 'Yem Katkı'];
const UNITS = ['ton', 'kg', 'adet', 'çuval'];

// ─── StokBadge ────────────────────────────────────────────────────────────────

function StokBadge({ item }: { item: Item }) {
  if (item.current_stock === 0) {
    return <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">Tükendi</span>;
  }
  if (item.current_stock <= item.low_stock_threshold) {
    return <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">Kritik</span>;
  }
  return <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">Normal</span>;
}

// ─── YeniUrunModal ────────────────────────────────────────────────────────────

function YeniUrunModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', sku: '', category: '', unit: 'kg',
    stok: '', acilismaliyeti: '', esik: '5',
    alisFiyati: '', satisFiyati: '',
  });
  const [error, setError] = useState('');
  const createItem = useCreateItem();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Ürün adı zorunludur.'); return; }
    const openingStock = parseFloat(form.stok) || 0;
    if (openingStock > 0 && !form.acilismaliyeti) { setError('Açılış stoku girildiğinde maliyet zorunludur.'); return; }
    try {
      await createItem.mutateAsync({
        name: form.name,
        sku: form.sku || undefined,
        category: form.category || undefined,
        unit: form.unit,
        low_stock_threshold: parseFloat(form.esik) || 5,
        default_buy_price_kurus: form.alisFiyati ? toKurus(form.alisFiyati) : 0,
        default_sale_price_kurus: form.satisFiyati ? toKurus(form.satisFiyati) : 0,
        openingStock,
        openingCostKurus: form.acilismaliyeti ? toKurus(form.acilismaliyeti) : 0,
      });
      onClose();
    } catch (e: any) { setError(e.message ?? 'Kayıt hatası'); }
  };

  const inputCls = 'w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors';
  const labelCls = 'text-xs text-muted-foreground uppercase tracking-wide block mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base" style={{ fontWeight: 500 }}>Yeni Ürün</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Ürün Adı *</label>
            <input value={form.name} onChange={set('name')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>SKU</label>
            <input value={form.sku} onChange={set('sku')} placeholder="Otomatik oluşturulur" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Kategori</label>
            <select value={form.category} onChange={set('category')} className={inputCls}>
              <option value="">Seçiniz</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Birim</label>
            <select value={form.unit} onChange={set('unit')} className={inputCls}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Açılış Stoku</label>
            <input type="number" value={form.stok} onChange={set('stok')} className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className={labelCls}>Açılış Maliyeti (₺/birim)</label>
            <input type="number" step="0.01" value={form.acilismaliyeti} onChange={set('acilismaliyeti')} className={inputCls} placeholder="0,00" />
          </div>
          <div>
            <label className={labelCls}>Kritik Stok Eşiği</label>
            <input type="number" value={form.esik} onChange={set('esik')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Alış Fiyatı (₺)</label>
            <input type="number" step="0.01" value={form.alisFiyati} onChange={set('alisFiyati')} className={inputCls} placeholder="0,00" />
          </div>
          <div>
            <label className={labelCls}>Satış Fiyatı (₺)</label>
            <input type="number" step="0.01" value={form.satisFiyati} onChange={set('satisFiyati')} className={inputCls} placeholder="0,00" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg">İptal</button>
          <button onClick={handleSave} disabled={createItem.isPending} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {createItem.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AyarlaModal ──────────────────────────────────────────────────────────────

function AyarlaModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const [yeniMiktar, setYeniMiktar] = useState(String(item.current_stock));
  const [neden, setNeden] = useState('');
  const [error, setError] = useState('');
  const adjustStock = useAdjustStock();

  const handleSave = async () => {
    if (isNaN(parseFloat(yeniMiktar))) { setError('Geçerli miktar giriniz.'); return; }
    if (!neden.trim()) { setError('Neden alanı zorunludur.'); return; }
    try {
      await adjustStock.mutateAsync({ itemId: item.item_id ?? (item as any).id, newQuantity: parseFloat(yeniMiktar), reason: neden });
      onClose();
    } catch (e: any) { setError(e.message ?? 'Hata'); }
  };

  const inputCls = 'w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors';
  const labelCls = 'text-xs text-muted-foreground uppercase tracking-wide block mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base" style={{ fontWeight: 500 }}>Stok Düzelt — {item.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div>
          <label className={labelCls}>Mevcut Stok</label>
          <p className="text-sm text-muted-foreground">{item.current_stock} {item.unit}</p>
        </div>
        <div>
          <label className={labelCls}>Yeni Miktar</label>
          <input type="number" step="0.01" value={yeniMiktar} onChange={e => setYeniMiktar(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Neden *</label>
          <input value={neden} onChange={e => setNeden(e.target.value)} className={inputCls} placeholder="Sayım farkı, hasar..." />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg">İptal</button>
          <button onClick={handleSave} disabled={adjustStock.isPending} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {adjustStock.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── InventoryPage ────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('Hepsi');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showNewModal, setShowNewModal] = useState(false);
  const [ayarlaItem, setAyarlaItem] = useState<Item | null>(null);

  const { data: rawItems = [], isLoading, error } = useItems(true);
  const items = rawItems as unknown as Item[];

  // KPI
  const aktifItems = useMemo(() => items.filter(i => i.is_active), [items]);
  const stokDegeri = useMemo(() => aktifItems.reduce((s, i) => s + i.current_stock * i.default_buy_price_kurus, 0), [aktifItems]);
  const kritikSayi = useMemo(() => aktifItems.filter(i => i.current_stock > 0 && i.current_stock <= i.low_stock_threshold).length, [aktifItems]);
  const tukenenSayi = useMemo(() => aktifItems.filter(i => i.current_stock === 0).length, [aktifItems]);

  // Benzersiz kategoriler
  const kategoriler = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category).filter(Boolean))] as string[];
    return ['Hepsi', ...cats];
  }, [items]);

  // Filtrele + sırala
  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q));
    }
    if (kategori !== 'Hepsi') list = list.filter(i => i.category === kategori);
    if (sortField) {
      list = [...list].sort((a, b) => {
        let va = 0, vb = 0;
        if (sortField === 'ad') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        if (sortField === 'stok') { va = a.current_stock; vb = b.current_stock; }
        if (sortField === 'satisFiyati') { va = a.default_sale_price_kurus; vb = b.default_sale_price_kurus; }
        return sortDir === 'asc' ? va - vb : vb - va;
      });
    }
    return list;
  }, [items, search, kategori, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30 inline ml-0.5" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
  };

  const stokDegeriStr = stokDegeri >= 100_000_00
    ? `₺${(stokDegeri / 100_000_00).toFixed(1)}M`
    : stokDegeri >= 100_000
    ? `₺${(stokDegeri / 100_000).toFixed(0)}k`
    : fromKurus(stokDegeri);

  if (error) return <div className="p-6"><p className="text-sm text-red-600">Hata: {(error as Error).message}</p></div>;

  return (
    <div className="flex-1 overflow-auto px-8 py-6 bg-background text-foreground no-scrollbar">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">Stok</h1>
          <p className="text-sm font-medium text-muted-foreground">{aktifItems.length} ürün kayıtlı</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)} 
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Yeni Ürün
        </button>
      </div>

      {/* KPI (4) */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Toplam Ürün</span>
            <div className="p-2 rounded-lg bg-muted/50">
              <Package className="w-5 h-5 text-foreground/70" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{aktifItems.length}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">aktif</span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Stok Değeri</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{stokDegeriStr}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">alış bazlı</span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Kritik Stok</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{kritikSayi}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">ürün</span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Tükenen</span>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{tukenenSayi}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400">ürün</span>
          </div>
        </div>
      </div>

      {/* Kritik uyarı banner */}
      {(kritikSayi > 0 || tukenenSayi > 0) && (
        <div className="flex items-center gap-2 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400 mb-5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {tukenenSayi > 0 && <><strong>{tukenenSayi} ürün</strong> tamamen tükendi. </>}
            {kritikSayi > 0 && <><strong>{kritikSayi} ürün</strong> kritik stok seviyesinde.</>}
            {' '}Sipariş vermeyi düşünün.
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1 max-w-4xl">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Ürün adı veya SKU..." 
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-border/60 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-sm" 
            />
          </div>
          <div className="flex items-center bg-card border border-border/60 rounded-xl p-1 shadow-sm overflow-x-auto no-scrollbar">
            {kategoriler.map(k => (
              <button 
                key={k} 
                onClick={() => setKategori(k)} 
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${kategori === k ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs cursor-pointer select-none" onClick={() => handleSort('ad')}>
                    Ürün Adı <SortIcon field="ad" />
                  </th>
                  <th className="px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs">SKU</th>
                  <th className="px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs">Kategori</th>
                  <th className="px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs cursor-pointer select-none" onClick={() => handleSort('stok')}>
                    Stok <SortIcon field="stok" />
                  </th>
                  <th className="px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs">Alış Fiyatı</th>
                  <th className="px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs cursor-pointer select-none" onClick={() => handleSort('satisFiyati')}>
                    Satış Fiyatı <SortIcon field="satisFiyati" />
                  </th>
                  <th className="px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs">Durum</th>
                  <th className="px-6 py-3.5"></th>
                </tr>
              </thead>
            <tbody className="text-sm">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center text-muted-foreground text-sm">Arama kriterine uygun ürün bulunamadı.</td></tr>
              ) : filtered.map(item => {
                const id = item.item_id ?? (item as any).id;
                const stokColor = item.current_stock === 0
                  ? 'text-red-600'
                  : item.current_stock <= item.low_stock_threshold
                  ? 'text-amber-600'
                  : '';
                return (
                  <tr key={id} className="border-b last:border-b-0 border-border/30 hover:bg-muted/40 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-medium text-foreground">{item.name}</span>
                      {!item.is_active && <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">Pasif</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground font-mono">{item.sku || '—'}</td>
                    <td className="px-6 py-4">
                      {item.category
                        ? <span className="text-xs font-medium px-2 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">{item.category}</span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className={`px-6 py-4 font-bold ${stokColor}`}>
                      {item.current_stock} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-bold">
                      {item.default_buy_price_kurus > 0 ? fromKurus(item.default_buy_price_kurus) : '—'}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {item.default_sale_price_kurus > 0 ? fromKurus(item.default_sale_price_kurus) : '—'}
                    </td>
                    <td className="px-6 py-4"><StokBadge item={item} /></td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setAyarlaItem(item)}
                        className="text-xs font-medium text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        Düzelt
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modaller */}
      {showNewModal && <YeniUrunModal onClose={() => setShowNewModal(false)} />}
      {ayarlaItem && <AyarlaModal item={ayarlaItem} onClose={() => setAyarlaItem(null)} />}
    </div>
  );
}
