import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, ArrowDownCircle, ArrowUpCircle, Clock, AlertCircle, X, Check, Calendar, ChevronDown
} from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useCustomers, useSuppliers } from '../../hooks/useEntities';
import { useOpenInvoices } from '../../hooks/useLedger';
import { useRecordPaymentIn, useRecordPaymentOut, useCancelPayment } from '../../hooks/usePayments';
import { fromKurus, toKurus } from '../../utils/formatters';

// ─── Formatters ───────────────────────────────────────────────────────────────



// ─── Autocomplete Component ───────────────────────────────────────────────────

function Autocomplete({
  items,
  value,
  onChange,
  onSelect,
  placeholder,
  displayProp = 'name',
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
              key={item.id}
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

// ─── Base Payment Modal ───────────────────────────────────────────────────────

type BasePaymentModalProps = {
  type: 'in' | 'out';
  onClose: () => void;
};

function BasePaymentModal({ type, onClose }: BasePaymentModalProps) {
  const isIn = type === 'in';
  const { data: customers = [] } = useCustomers(true);
  const { data: suppliers = [] } = useSuppliers(true);
  const entities = (isIn ? customers : suppliers) as any[];

  const recordIn = useRecordPaymentIn();
  const recordOut = useRecordPaymentOut();
  const mutator = isIn ? recordIn : recordOut;

  const [entitySearch, setEntitySearch] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [allocations, setAllocations] = useState<number[]>([]);
  const [error, setError] = useState('');

  const { data: rawOpenInvoices } = useOpenInvoices(selectedEntityId || 0);
  const openInvoices = (rawOpenInvoices || []) as any[];

  const handleEntitySelect = (entity: any) => {
    setSelectedEntityId(entity.id);
    setEntitySearch(entity.title);
    setAllocations([]); // Reset allocations on entity change
  };

  const handleCheckbox = (invId: number, checked: boolean) => {
    if (checked) {
      setAllocations(prev => [...prev, invId]);
    } else {
      setAllocations(prev => prev.filter(id => id !== invId));
    }
  };

  const autoAllocate = () => {
    const totalOpen = openInvoices.reduce((sum, inv) => sum + (inv.remaining_kurus || 0), 0);
    setAmount((totalOpen / 100).toFixed(2));
    setAllocations(openInvoices.map(inv => inv.id));
  };

  // If allocations exist, we could sum their remaining_kurus to set the amount.
  // We'll let the user manually change amount, but we pass allocations to backend.

  const handleSave = async () => {
    if (!selectedEntityId) { setError('Lütfen bir cari seçin.'); return; }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) { setError('Geçerli bir tutar girin.'); return; }

    try {
      await mutator.mutateAsync({
        entityId: selectedEntityId,
        amount_kurus: toKurus(amount),
        payment_date: date,
        notes,
        allocations: allocations.map(invoiceId => ({ invoiceId })) // Backend may expect specific format
      });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Kayıt hatası');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md flex flex-col max-h-[90vh] shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <h2 className="text-base" style={{ fontWeight: 500 }}>
            {isIn ? 'Yeni Tahsilat' : 'Yeni Ödeme'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</p>}

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">{isIn ? 'Müşteri *' : 'Tedarikçi *'}</label>
            <Autocomplete
              items={entities}
              value={entitySearch}
              onChange={setEntitySearch}
              onSelect={handleEntitySelect}
              placeholder="Cari ara..."
              displayProp="title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Tutar (₺) *</label>
              <input
                type="number"
                step="0.01"
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Tarih *</label>
              <input
                type="date"
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Açıklama</label>
            <textarea
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none"
              rows={2}
              placeholder="İsteğe bağlı..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {selectedEntityId && openInvoices.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Açık Faturalar</label>
                <button onClick={autoAllocate} className="text-xs text-primary hover:underline font-medium">Otomatik Dağıt</button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {openInvoices.map(inv => {
                  const isChecked = allocations.includes(inv.id);
                  return (
                    <label key={inv.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                      <input
                        type="checkbox"
                        className="accent-primary w-4 h-4"
                        checked={isChecked}
                        onChange={e => handleCheckbox(inv.id, e.target.checked)}
                      />
                      <div className="flex-1 flex items-center justify-between text-sm">
                        <span className="font-mono text-xs text-muted-foreground">{inv.invoice_number || `#${inv.id}`}</span>
                        <span style={{ fontWeight: 600 }}>{fromKurus(inv.remaining_kurus)}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
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
  const cancelPayment = useCancelPayment();

  const handleSave = async () => {
    if (!neden.trim()) { setError('İptal nedeni zorunludur.'); return; }
    try {
      await cancelPayment.mutateAsync({ id: tx.id, reason: neden });
      onClose();
    } catch (e: any) { setError(e.message || 'İptal hatası'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 space-y-4 shadow-xl">
        <h2 className="text-base" style={{ fontWeight: 500 }}>İşlemi İptal Et</h2>
        <p className="text-sm text-muted-foreground">{tx.invoice_number || `İşlem #${tx.id}`} iptal edilecek. Bu işlem geri alınamaz ve cari bakiyesi güncellenecektir.</p>
        {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">İptal Nedeni *</label>
          <input className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 transition-colors" value={neden} onChange={e => setNeden(e.target.value)} autoFocus />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted">Vazgeç</button>
          <button onClick={handleSave} disabled={cancelPayment.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">İptal Et</button>
        </div>
      </div>
    </div>
  );
}

// ─── PaymentsPage ─────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [aktifTab, setAktifTab] = useState<'payment_in' | 'payment_out'>('payment_in');
  const [arama, setArama] = useState('');
  const [zamanFiltre, setZamanFiltre] = useState<'all' | 'this_month' | 'this_week'>('all');
  const [modalType, setModalType] = useState<'in' | 'out' | null>(null);
  const [iptalModalTx, setIptalModalTx] = useState<any>(null);

  const { data: rawTransactions = [] } = useTransactions({ type: aktifTab });
  const transactions = rawTransactions as any[];

  const monthStart = new Date(); monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);
  
  const { data: monthIn = [] } = useTransactions({ type: 'payment_in', fromDate: monthStartStr, status: 'active' });
  const { data: monthOut = [] } = useTransactions({ type: 'payment_out', fromDate: monthStartStr, status: 'active' });
  
  const { data: allSales = [] } = useTransactions({ type: 'sale', status: 'active' });
  const { data: allPurchases = [] } = useTransactions({ type: 'purchase', status: 'active' });

  const kpiTahsilat = (monthIn as any[]).reduce((s, t) => s + (t.amount_kurus || 0), 0);
  const kpiOdeme = (monthOut as any[]).reduce((s, t) => s + (t.amount_kurus || 0), 0);
  const kpiTahsilEdilmemis = (allSales as any[]).reduce((s, t) => s + (t.remaining_kurus || 0), 0);
  const kpiOdenmemis = (allPurchases as any[]).reduce((s, t) => s + (t.remaining_kurus || 0), 0);

  const filtered = useMemo(() => {
    let list = transactions;

    if (arama.trim()) {
      const q = arama.toLowerCase();
      list = list.filter(tx => 
        (tx.entity_name || '').toLowerCase().includes(q) || 
        (tx.invoice_number || '').toLowerCase().includes(q)
      );
    }

    if (zamanFiltre !== 'all') {
      const now = new Date();
      if (zamanFiltre === 'this_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        list = list.filter(tx => new Date(tx.transaction_date).getTime() >= start);
      } else if (zamanFiltre === 'this_week') {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0,0,0,0);
        list = list.filter(tx => new Date(tx.transaction_date).getTime() >= start.getTime());
      }
    }

    return list;
  }, [transactions, arama, zamanFiltre]);

  return (
    <div className="flex-1 overflow-auto px-8 py-6 bg-background text-foreground no-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">Ödemeler</h1>
          <p className="text-sm font-medium text-muted-foreground">Tahsilat ve ödeme işlemleri</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setModalType('out')} 
            className="px-4 py-2.5 text-sm font-medium border border-border/60 bg-card text-foreground rounded-xl hover:bg-muted/50 transition-all shadow-sm"
          >
            Yeni Ödeme
          </button>
          <button 
            onClick={() => setModalType('in')} 
            className="px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
          >
            Yeni Tahsilat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Bu Ay Tahsilat</span>
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-500/10">
              <ArrowDownCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{fromKurus(kpiTahsilat)}</span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Bu Ay Ödeme</span>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10">
              <ArrowUpCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{fromKurus(kpiOdeme)}</span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Tahsil Edilmemiş</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{fromKurus(kpiTahsilEdilmemis)}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">alacaklar</span>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Ödenmemiş Borç</span>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold tracking-tight">{fromKurus(kpiOdenmemis)}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400">borçlar</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-6">
          <div className="flex items-center bg-card border border-border/60 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => { setAktifTab('payment_in'); setArama(''); }}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${aktifTab === 'payment_in' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              Tahsilatlar
            </button>
            <button
              onClick={() => { setAktifTab('payment_out'); setArama(''); }}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${aktifTab === 'payment_out' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              Ödemeler
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-2xl justify-end">
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              className="w-44 bg-card border border-border/60 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-sm appearance-none cursor-pointer"
              value={zamanFiltre}
              onChange={e => setZamanFiltre(e.target.value as any)}
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="this_month">Bu Ay</option>
              <option value="this_week">Bu Hafta</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-border/60 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
              placeholder="Cari veya ödeme no..."
              value={arama}
              onChange={(e) => setArama(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs">tarih</th>
                <th className="px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs">ödeme no</th>
                <th className="px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs">cari</th>
                <th className="px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs">yön</th>
                <th className="px-6 py-3.5 text-right text-muted-foreground font-semibold uppercase tracking-wider text-xs">tutar</th>
                <th className="px-6 py-3.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-xs">bağlı fatura</th>
                <th className="px-6 py-3.5 text-center text-muted-foreground font-semibold uppercase tracking-wider text-xs">işlem</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.map((tx) => {
                const isCancelled = tx.status === 'cancelled';
                const isIn = tx.type === 'payment_in';
                const allocationCount = tx.allocations ? tx.allocations.length : 0;

                return (
                  <tr key={tx.id} className={`border-b last:border-b-0 border-border/30 hover:bg-muted/40 transition-colors group ${isCancelled ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('tr-TR') : '—'}</td>
                    <td className="px-6 py-4"><span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">{tx.invoice_number || `#${tx.id}`}</span></td>
                    <td className="px-6 py-4 font-medium text-foreground">{tx.entity_name || '—'}</td>
                    <td className="px-6 py-4">
                      {isIn ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                          <ArrowDownCircle className="w-3.5 h-3.5" /> Tahsilat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                          <ArrowUpCircle className="w-3.5 h-3.5" /> Ödeme
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold">{fromKurus(tx.amount_kurus || 0)}</td>
                    <td className="px-6 py-4">
                      {allocationCount > 0 ? (
                        <span className="text-xs font-medium text-primary hover:underline cursor-pointer">
                          {allocationCount === 1 && tx.allocations[0].invoice_number ? tx.allocations[0].invoice_number : `${allocationCount} fatura`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isCancelled ? (
                         <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground">İptal</span>
                      ) : (
                         <button 
                           onClick={() => setIptalModalTx(tx)} 
                           className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-lg transition-all"
                         >
                           İptal Et
                         </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-muted-foreground text-sm">Arama kriterine uygun işlem bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalType && <BasePaymentModal type={modalType as any} onClose={() => setModalType(null)} />}
      {iptalModalTx && <IptalModal tx={iptalModalTx} onClose={() => setIptalModalTx(null)} />}
    </div>
  );
}
