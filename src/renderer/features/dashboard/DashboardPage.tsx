import React, { useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import KpiCard from '../../components/ui/KpiCard';
import DataTable from '../../components/ui/DataTable';
import DurumBadge from '../../components/ui/DurumBadge';
import { Wallet, Users, Package } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useAgingReport } from '../../hooks/useLedger';
import { useItems } from '../../hooks/useItems';
import '../../styles/theme.css';

function fromKurus(kurus: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(kurus / 100);
}

const DashboardPage: React.FC = () => {
  const { username } = useAuthStore();
  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: sales, isLoading: loadingSales, error: errorSales } = useTransactions({ fromDate: todayStr, type: 'sale', status: 'active' });
  const { data: payments, isLoading: loadingPayments, error: errorPayments } = useTransactions({ fromDate: todayStr, type: 'payment_in', status: 'active' });
  const { data: agingReport, isLoading: loadingAging, error: errorAging } = useAgingReport('customer');
  const { data: items, isLoading: loadingItems, error: errorItems } = useItems(false);
  const { data: recentTx, isLoading: loadingRecent, error: errorRecent } = useTransactions({ limit: 10 });

  const isLoading = loadingSales || loadingPayments || loadingAging || loadingItems || loadingRecent;
  const error = errorSales || errorPayments || errorAging || errorItems || errorRecent;

  const todaySalesTotal = useMemo(() => sales?.reduce((acc, tx) => acc + tx.amount_kurus, 0) || 0, [sales]);
  const todayPaymentsTotal = useMemo(() => payments?.reduce((acc, tx) => acc + tx.amount_kurus, 0) || 0, [payments]);
  const totalReceivables = useMemo(() => agingReport?.grand_total_kurus || 0, [agingReport]);
  const lowStockCount = useMemo(() => items?.filter(item => item.current_stock <= item.low_stock_threshold).length || 0, [items]);

  const topOverdueEntities = useMemo(() => {
    if (!agingReport) return [];
    const allOverdueItems = [
      ...agingReport.overdue_30.items,
      ...agingReport.overdue_60.items,
      ...agingReport.overdue_90.items,
      ...agingReport.overdue_plus.items,
    ];

    const entityTotals = new Map<number, { title: string; total_kurus: number }>();
    allOverdueItems.forEach(item => {
      const current = entityTotals.get(item.entity_id);
      if (current) {
        current.total_kurus += item.remaining_kurus;
      } else {
        entityTotals.set(item.entity_id, { title: item.title, total_kurus: item.remaining_kurus });
      }
    });

    return Array.from(entityTotals.values())
      .sort((a, b) => b.total_kurus - a.total_kurus)
      .slice(0, 5);
  }, [agingReport]);

  const tableData = useMemo(() => {
    return recentTx?.map(t => {
      let statusBadge = <DurumBadge status="Ödendi" variant="success" />;
      if (t.status === 'cancelled') {
        statusBadge = <DurumBadge status="İptal" variant="destructive" />;
      } else if (t.transaction_type === 'sale' || t.transaction_type === 'purchase') {
        if (t.due_date) {
          const isOverdue = new Date(t.due_date) < new Date(todayStr);
          statusBadge = isOverdue 
            ? <DurumBadge status="Gecikmiş" variant="destructive" /> 
            : <DurumBadge status="Vadeli" variant="info" />;
        }
      }

      const typeMap: Record<string, string> = {
        sale: 'Satış',
        purchase: 'Alış',
        payment_in: 'Tahsilat',
        payment_out: 'Ödeme',
        sale_return: 'Satış İade',
        purchase_return: 'Alış İade',
      };

      return {
        id: t.id,
        date: new Date(t.transaction_date).toLocaleDateString('tr-TR'),
        invoiceNumber: t.invoice_number || '-',
        entity: t.entity_title,
        type: typeMap[t.transaction_type] || t.transaction_type,
        amount: fromKurus(t.amount_kurus),
        status: statusBadge,
      };
    }) || [];
  }, [recentTx, todayStr]);

  const tableColumns = [
    { key: 'date', label: 'Tarih' },
    { key: 'invoiceNumber', label: 'Fatura No' },
    { key: 'entity', label: 'Cari' },
    { key: 'type', label: 'Tür' },
    { key: 'amount', label: 'Tutar' },
    { key: 'status', label: 'Durum' },
  ];

  if (error) {
    return (
      <div className="p-8 text-destructive">
        <h2 className="text-xl font-bold mb-2">Veriler yüklenirken hata oluştu:</h2>
        <p>{error instanceof Error ? error.message : 'Bilinmeyen hata'}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Gösterge Paneli</h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            {' '}— Hoşgeldiniz, <strong>{username}</strong>
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <KpiCard title="Bugünkü Satış" value={fromKurus(todaySalesTotal)} icon={<Wallet className="w-4 h-4 text-primary" />} subtitle="Tahakkuk" />
            <KpiCard title="Bugünkü Tahsilat" value={fromKurus(todayPaymentsTotal)} icon={<Wallet className="w-4 h-4 text-green-600" />} subtitle="Nakit Girişi" />
            <KpiCard title="Açık Alacak" value={fromKurus(totalReceivables)} icon={<Users className="w-4 h-4 text-blue-500" />} subtitle="Toplam Bekleyen" />
            <KpiCard title="Kritik Stok" value={`${lowStockCount} Ürün`} icon={<Package className="w-4 h-4 text-amber-500" />} subtitle="Eşik altında" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-lg font-bold">Son İşlemler</h2>
                <p className="text-muted-foreground text-sm">Sistemdeki son hareketler</p>
              </div>
              <DataTable columns={tableColumns} data={tableData} />
            </div>

            <div>
              <div className="mb-4">
                <h2 className="text-lg font-bold">Vadesi Geçen Alacaklar</h2>
                <p className="text-muted-foreground text-sm">En yüksek bakiyeli 5 cari</p>
              </div>
              <div className="card space-y-3">
                {topOverdueEntities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">Gecikmiş ödeme bulunmuyor.</p>
                ) : (
                  topOverdueEntities.map((entity, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-border last:border-0 pb-3 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{entity.title}</p>
                        <p className="text-xs text-destructive mt-0.5">Vadesi Geçmiş</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{fromKurus(entity.total_kurus)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
