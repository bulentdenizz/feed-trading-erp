import React from 'react';
import { useAuthStore } from '../store/authStore';
import KpiCard from '../components/ui/KpiCard';
import DataTable from '../components/ui/DataTable';
import DurumBadge from '../components/ui/DurumBadge';
import '../styles/theme.css';

const DashboardPage: React.FC = () => {
  const { username, role, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const kpiData = [
    { title: 'Toplam Satış', value: '₺125,000', subtitle: 'Bu Ay' },
    { title: 'Toplam Müşteri', value: '156', subtitle: 'Aktif' },
    { title: 'Toplam Stok', value: '4,230', subtitle: 'Ürün' },
    { title: 'Bekleyen Faturalar', value: '12', subtitle: 'İşlem' },
  ];

  const tableData = [
    { id: 1, name: 'Müşteri A', amount: '₺5,000', status: 'Paid', date: '2024-04-20' },
    { id: 2, name: 'Müşteri B', amount: '₺3,500', status: 'Pending', date: '2024-04-21' },
    { id: 3, name: 'Müşteri C', amount: '₺7,200', status: 'Overdue', date: '2024-04-19' },
  ];

  const tableColumns = [
    { key: 'name', label: 'Müşteri' },
    { key: 'amount', label: 'Tutar' },
    { key: 'status', label: 'Durum' },
    { key: 'date', label: 'Tarih' },
  ];

  return (
    <div className="bg-background min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Hoşgeldiniz, <strong>{username}</strong> ({role})
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-destructive text-destructive-foreground px-4 py-2 rounded font-medium hover:opacity-90"
        >
          Çıkış Yap
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiData.map((kpi, index) => (
          <KpiCard
            key={index}
            title={kpi.title}
            value={kpi.value}
            subtitle={kpi.subtitle}
          />
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Son İşlemler</h2>
        <DataTable columns={tableColumns} data={tableData} />
      </div>

      {/* Status Examples */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Durum Badgeleri Örneği</h3>
        <div className="flex flex-wrap gap-2">
          <DurumBadge status="Aktif" variant="success" />
          <DurumBadge status="Bekleme" variant="warning" />
          <DurumBadge status="Hatası" variant="destructive" />
          <DurumBadge status="Bilgi" variant="info" />
          <DurumBadge status="Varsayılan" variant="default" />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
