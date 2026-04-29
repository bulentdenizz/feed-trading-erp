import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, Plus, FileText, Clock, CheckCircle,
  AlertCircle, X, Check, ChevronDown, Trash2
} from 'lucide-react';
import { useTransactions, useCancelTransaction, useCreateSale, useCreatePurchase } from '../../hooks/useTransactions';
import { useCustomers, useSuppliers } from '../../hooks/useEntities';
import { useItems } from '../../hooks/useItems';
import { fromKurus, toKurus } from '../../utils/formatters';

// ─── Formatters ───────────────────────────────────────────────────────────────



// ─── Types ────────────────────────────────────────────────────────────────────

type FaturaDurum = 'Ödendi' | 'Bekliyor' | 'Vadeli' | 'Gecikmiş' | 'İptal';
type FaturaTip = 'sale' | 'purchase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDurum(tx: any): FaturaDurum {
  if (tx.status === 'cancelled') return 'İptal';
  if (tx.remaining_kurus === 0) return 'Ödendi';
  if (!tx.due_date) return 'Bekliyor';
  if (new Date(tx.due_date) < new Date()) return 'Gecikmiş';
  return 'Vadeli';
}

function DurumBadge({ durum }: { durum: FaturaDurum }) {
  const styles: Record<FaturaDurum, string> = {
    'Ödendi': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
    'Bekliyor': 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    'Vadeli': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    'Gecikmiş': 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
    'İptal': 'bg-muted text-muted-foreground',
  };
  return <span className={`text-xs px-1.5 py-0.5 rounded-md ${styles[durum]}`}>{durum}</span>;
}

// ─── Autocomplete Component ───────────────────────────────────────────────────

function Autocomplete({
  items,
  value,
  onChange,
  onSelect,
  placeholder,
  displayProp = 'name'
}: {
  items: any[];
  value: string;
  onChange: (v: string) => void;
  onSelect: (item: any) => void;
  placeholder: string;
  displayProp?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = items.filter(i => (i[displayProp] || '').toLowerCase().includes(value.toLowerCase()));

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && filteredItems.length > 0 && (
        <ul className="absolute z-10 w-full bg-card border border-border rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
          {filteredItems.map(item => (
            <li
              key={item.id || item.item_id}
              className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
              onClick={() => { onSelect(item); setIsOpen(false); }}
            >
              {item[displayProp]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


// ─── YeniFaturaModal ──────────────────────────────────────────────────────────

function YeniFaturaModal({ tip, onClose }: { tip: FaturaTip; onClose: () => void }) {
  const [entitySearch, setEntitySearch] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10));
  const [odemeTuru, setOdemeTuru] = useState<'nakit' | 'vadeli'>('nakit');
  const [vade, setVade] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [lines, setLines] = useState([{ id: Date.now(), itemId: null as number | null, itemName: '', qty: '', price: '', tax: 0 }]);
  const [error, setError] = useState('');

  const { data: customers = [] } = useCustomers(true);
  const { data: suppliers = [] } = useSuppliers(true);
  const { data: items = [] } = useItems(true);
  const createSale = useCreateSale();
  const createPurchase = useCreatePurchase();

  const isSale = tip === 'sale';
  const entities = (isSale ? customers : suppliers) as any[];
  const mutator = isSale ? createSale : createPurchase;

  const handleEntitySelect = (entity: any) => {
    setSelectedEntityId(entity.id);
    setEntitySearch(entity.title);
  };

  const handleItemSelect = (index: number, item: any) => {
    const newLines = [...lines];
    newLines[index].itemId = item.item_id || item.id;
    newLines[index].itemName = item.name;
    newLines[index].price = ((isSale ? item.default_sale_price_kurus : item.default_buy_price_kurus) / 100).toString() || '';
    setLines(newLines);
  };

  const handleLineChange = (index: number, field: string, value: string | number) => {
    const newLines = [...lines];
    (newLines[index] as any)[field] = value;
    setLines(newLines);
  };

  const addLine = () => setLines([...lines, { id: Date.now(), itemId: null, itemName: '', qty: '', price: '', tax: 0 }]);
  const removeLine = (id: number) => setLines(lines.filter(l => l.id !== id));

  const totals = lines.reduce((acc, line) => {
    const qty = parseFloat(line.qty) || 0;
    const priceKurus = toKurus(line.price) || 0;
    const lineTotal = qty * priceKurus;
    const tax = Math.round(lineTotal * line.tax / 100);
    return { subtotal: acc.subtotal + lineTotal, tax: acc.tax + tax, total: acc.total + lineTotal + tax };
  }, { subtotal: 0, tax: 0, total: 0 });


  const handleSave = async () => {
    if (!selectedEntityId) { setError('Lütfen bir cari seçin.'); return; }
    if (lines.some(l => !l.itemId || !l.qty || !l.price)) { setError('Tüm satırların ürün, miktar ve fiyat bilgileri doldurulmalıdır.'); return; }

    const formattedLines = lines.map(l => ({
      itemId: l.itemId!,
      quantity: parseFloat(l.qty),
      unitPriceKurus: toKurus(l.price),
      taxRateBps: l.tax * 100, // %8 -> 800 bps
    }));

    try {
      await mutator.mutateAsync({
        entityId: selectedEntityId,
        transactionDate: tarih,
        dueDate: odemeTuru === 'vadeli' ? vade || undefined : undefined,
        description: aciklama,
        lineItems: formattedLines
      });
      onClose();
    } catch (e: any) { setError(e.message || 'Kayıt hatası'); }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <h2 className="text-base" style={{ fontWeight: 500 }}>
            {isSale ? 'Yeni Satış Faturası' : 'Yeni Alış Faturası'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">{isSale ? 'Müşteri *' : 'Tedarikçi *'}</label>
              <Autocomplete items={entities} value={entitySearch} onChange={setEntitySearch} onSelect={handleEntitySelect} placeholder="Seçiniz..." displayProp="title" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Fatura Tarihi *</label>
              <input type="date" className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors" value={tarih} onChange={e => setTarih(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Ödeme Türü</label>
              <div className="flex items-center gap-4 h-[38px]">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="odeme" checked={odemeTuru === 'nakit'} onChange={() => setOdemeTuru('nakit')} className="accent-primary" /> Nakit
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="odeme" checked={odemeTuru === 'vadeli'} onChange={() => setOdemeTuru('vadeli')} className="accent-primary" /> Vadeli
                </label>
              </div>
            </div>
            {odemeTuru === 'vadeli' && (
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Vade Tarihi *</label>
                <input type="date" className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors" value={vade} onChange={e => setVade(e.target.value)} />
              </div>
            )}
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-3 py-2 font-medium w-1/3">Ürün</th>
                  <th className="px-3 py-2 font-medium w-24">Miktar</th>
                  <th className="px-3 py-2 font-medium w-28">Birim F. (₺)</th>
                  <th className="px-3 py-2 font-medium w-20">KDV %</th>
                  <th className="px-3 py-2 font-medium text-right">Ara Toplam</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line, idx) => {
                  const qty = parseFloat(line.qty) || 0;
                  const price = toKurus(line.price) || 0;
                  const subTotal = qty * price;
                  return (
                    <tr key={line.id}>
                      <td className="px-2 py-2">
                        <Autocomplete items={items as any[]} value={line.itemName} onChange={v => handleLineChange(idx, 'itemName', v)} onSelect={i => handleItemSelect(idx, i)} placeholder="Ürün ara..." displayProp="name" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" className="w-full bg-input-background border border-border rounded-md px-2 py-1.5 outline-none focus:border-primary text-sm" placeholder="0" value={line.qty} onChange={e => handleLineChange(idx, 'qty', e.target.value)} />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" step="0.01" className="w-full bg-input-background border border-border rounded-md px-2 py-1.5 outline-none focus:border-primary text-sm" placeholder="0.00" value={line.price} onChange={e => handleLineChange(idx, 'price', e.target.value)} />
                      </td>
                      <td className="px-2 py-2">
                        <select className="w-full bg-input-background border border-border rounded-md px-2 py-1.5 outline-none focus:border-primary text-sm" value={line.tax} onChange={e => handleLineChange(idx, 'tax', parseInt(e.target.value))}>
                          <option value={0}>0</option>
                          <option value={8}>8</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right" style={{ fontWeight: 500 }}>{fromKurus(subTotal)}</td>
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => removeLine(line.id)} disabled={lines.length === 1} className="text-muted-foreground hover:text-red-500 disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="p-2 border-t border-border bg-muted/20">
              <button onClick={addLine} className="w-full py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Satır Ekle
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Açıklama</label>
            <textarea className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none" rows={2} placeholder="İsteğe bağlı..." value={aciklama} onChange={e => setAciklama(e.target.value)} />
          </div>

          <div className="flex flex-col items-end gap-1 text-sm bg-muted/30 p-4 rounded-xl border border-border">
            <div className="flex items-center justify-between w-48 text-muted-foreground"><span>KDV Hariç:</span><span>{fromKurus(totals.subtotal)}</span></div>
            <div className="flex items-center justify-between w-48 text-muted-foreground mb-2"><span>KDV:</span><span>{fromKurus(totals.tax)}</span></div>
            <div className="flex items-center justify-between w-48 text-lg pt-2 border-t border-border/50" style={{ fontWeight: 700 }}><span>TOPLAM:</span><span className="text-primary">{fromKurus(totals.total)}</span></div>
          </div>
        </div>

        <div className="p-6 border-t border-border shrink-0 flex items-center justify-end gap-2 bg-muted/10 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors bg-background">İptal</button>
          <button onClick={handleSave} disabled={mutator.isPending} className="px-6 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium disabled:opacity-50">
            {mutator.isPending ? 'Kaydediliyor...' : <><Check className="w-4 h-4" /> Kaydet</>}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── IptalModal ───────────────────────────────────────────────────────────────

function IptalModal({ tx, onClose }: { tx: any; onClose: () => void }) {
  const [neden, setNeden] = useState('');
  const [error, setError] = useState('');
  const cancelTx = useCancelTransaction();

  const handleSave = async () => {
    if (!neden.trim()) { setError('İptal nedeni zorunludur.'); return; }
    try {
      await cancelTx.mutateAsync({ id: tx.id, reason: neden });
      onClose();
    } catch (e: any) { setError(e.message || 'İptal hatası'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 space-y-4 shadow-xl">
        <h2 className="text-base" style={{ fontWeight: 500 }}>Faturayı İptal Et</h2>
        <p className="text-sm text-muted-foreground">{tx.invoice_number || `Fatura #${tx.id}`} iptal edilecek. Bu işlem geri alınamaz.</p>
        {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">İptal Nedeni *</label>
          <input className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 transition-colors" value={neden} onChange={e => setNeden(e.target.value)} autoFocus />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted">Vazgeç</button>
          <button onClick={handleSave} disabled={cancelTx.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">İptal Et</button>
        </div>
      </div>
    </div>
  );
}


// ─── InvoicesPage ─────────────────────────────────────────────────────────────

export function InvoicesPage({ defaultTab }: { defaultTab: FaturaTip }) {
  const [aktifTab, setAktifTab] = useState<FaturaTip>(defaultTab);
  const [arama, setArama] = useState('');
  const [durumFiltre, setDurumFiltre] = useState<'hepsi' | FaturaDurum>('hepsi');
  const [modal, setModal] = useState(false);
  const [iptalModalTx, setIptalModalTx] = useState<any>(null);

  const { data: rawTransactions = [] } = useTransactions({ type: aktifTab });
  const transactions = rawTransactions as any[];

  // Hesaplamalar
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const isCancelled = tx.status === 'cancelled';
      const durum = getDurum(tx);

      // Arama filtresi (invoice_number veya cari adı)
      const aramaEsle = (tx.invoice_number || '').toLowerCase().includes(arama.toLowerCase()) ||
                        (tx.entity_name || '').toLowerCase().includes(arama.toLowerCase());

      // Durum filtresi
      const durumEsle = durumFiltre === 'hepsi' ? !isCancelled : durum === durumFiltre && !isCancelled;

      return aramaEsle && (durumFiltre === 'hepsi' || durumEsle);
    });
  }, [transactions, arama, durumFiltre]);

  // KPI hesaplamaları (tüm aktif faturalar üzerinden)
  const activeTx = transactions.filter(t => t.status !== 'cancelled');
  const toplamTutar = activeTx.reduce((s, t) => s + (t.amount_kurus || 0), 0);
  const toplamKalan = activeTx.reduce((s, t) => s + (t.remaining_kurus || 0), 0);
  const odenenSayi = activeTx.filter(t => getDurum(t) === 'Ödendi').length;
  const gecikmisler = activeTx.filter(t => getDurum(t) === 'Gecikmiş');

  const durumFiltreler: Array<'hepsi' | FaturaDurum> = ['hepsi', 'Bekliyor', 'Vadeli', 'Gecikmiş', 'Ödendi'];

  return (
    <div className="flex-1 overflow-auto p-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium mb-0.5">Faturalar</h1>
          <p className="text-muted-foreground text-sm">Satış ve alış faturaları</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Yeni Fatura
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Toplam Tutar</span>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>{fromKurus(toplamTutar)}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">{activeTx.length} fatura</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Ödendi</span>
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>{odenenSayi} <span className="text-base text-muted-foreground font-normal">adet</span></span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">{fromKurus(toplamTutar - toplamKalan)}</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Bekleyen</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>{fromKurus(toplamKalan)}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">{activeTx.length - odenenSayi} fatura</span>
          </div>
        </div>
      </div>

      {/* Gecikmiş uyarı */}
      {gecikmisler.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 mb-6 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span><strong style={{ fontWeight: 700 }}>{gecikmisler.length} gecikmiş fatura var.</strong> Lütfen ödemeleri kontrol edin.</span>
        </div>
      )}

      {/* Tabs + toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center border-b border-border w-max px-2 space-x-4">
            <button
              onClick={() => { setAktifTab('sale'); setArama(''); setDurumFiltre('hepsi'); }}
              className={`pb-2 px-2 text-sm transition-colors relative ${aktifTab === 'sale' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Satışlar
              {aktifTab === 'sale' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-t-full" />}
            </button>
            <button
              onClick={() => { setAktifTab('purchase'); setArama(''); setDurumFiltre('hepsi'); }}
              className={`pb-2 px-2 text-sm transition-colors relative ${aktifTab === 'purchase' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Alışlar
              {aktifTab === 'purchase' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-t-full" />}
            </button>
          </div>

          {/* Durum filtresi */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden ml-4">
            {durumFiltreler.map((d) => (
              <button
                key={d}
                onClick={() => setDurumFiltre(d)}
                className={`px-3 py-1.5 text-sm transition-colors ${durumFiltre === d ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
              >
                {d === 'hepsi' ? 'Hepsi' : d}
              </button>
            ))}
          </div>
        </div>

        {/* Arama */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-56 bg-input-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
            placeholder="Fatura no veya cari..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border" style={{ fontSize: 11 }}>
              <th className="px-4 py-3 font-normal uppercase tracking-wide">fatura no</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide">cari</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide">tarih</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide">vade</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide text-right">tutar</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide text-right">kalan</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide text-center">durum</th>
              <th className="px-4 py-3 font-normal text-center">işlem</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map((tx) => {
              const durum = getDurum(tx);
              const isGecikmis = durum === 'Gecikmiş';
              const isCancelled = tx.status === 'cancelled';

              return (
                <tr key={tx.id} className={`border-t border-border hover:bg-muted/40 transition-colors ${isCancelled ? 'opacity-50 grayscale' : ''}`}>
                  <td className="px-4 py-3"><span className="text-xs text-muted-foreground font-mono">{tx.invoice_number || `#${tx.id}`}</span></td>
                  <td className="px-4 py-3" style={{ fontWeight: 500 }}>{tx.entity_name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('tr-TR') : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${isGecikmis ? 'text-red-700 dark:text-red-400 font-bold' : 'text-muted-foreground'}`}>
                      {tx.due_date ? new Date(tx.due_date).toLocaleDateString('tr-TR') : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" style={{ fontWeight: 700 }}>{fromKurus(tx.amount_kurus || 0)}</td>
                  <td className="px-4 py-3 text-right">
                    <span style={{ fontWeight: (tx.remaining_kurus || 0) > 0 ? 700 : 400 }} className={(tx.remaining_kurus || 0) > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}>
                      {(tx.remaining_kurus || 0) === 0 ? '—' : fromKurus(tx.remaining_kurus)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isCancelled ? <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">İptal</span> : <DurumBadge durum={durum} />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!isCancelled && (tx.remaining_kurus || 0) > 0 && (
                       <button onClick={() => setIptalModalTx(tx)} className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors px-2 py-1 rounded">
                         İptal Et
                       </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">Arama kriterine uygun fatura bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && <YeniFaturaModal tip={aktifTab} onClose={() => setModal(false)} />}
      {iptalModalTx && <IptalModal tx={iptalModalTx} onClose={() => setIptalModalTx(null)} />}
    </div>
  );
}
