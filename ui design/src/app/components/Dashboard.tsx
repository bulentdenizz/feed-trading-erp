import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Package,
  FileText,
  Wallet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// --- Mock Data ---
const kpiCards = [
  {
    label: "Günlük Ciro",
    value: "₺48.250",
    change: "+12%",
    up: true,
    icon: Wallet,
  },
  {
    label: "Açık Bakiye",
    value: "₺312.800",
    change: "-3%",
    up: false,
    icon: Users,
  },
  {
    label: "Stok Değeri",
    value: "₺1.245.000",
    change: "+5%",
    up: true,
    icon: Package,
  },
  {
    label: "Bekleyen Fatura",
    value: "14",
    change: "+2",
    up: true,
    icon: FileText,
  },
];

const revenueData = [
  { ay: "Oca", gelir: 285000, gider: 210000 },
  { ay: "Şub", gelir: 310000, gider: 225000 },
  { ay: "Mar", gelir: 342000, gider: 240000 },
  { ay: "Nis", gelir: 295000, gider: 218000 },
  { ay: "May", gelir: 380000, gider: 260000 },
  { ay: "Haz", gelir: 410000, gider: 275000 },
  { ay: "Tem", gelir: 365000, gider: 250000 },
  { ay: "Ağu", gelir: 420000, gider: 290000 },
  { ay: "Eyl", gelir: 445000, gider: 300000 },
  { ay: "Eki", gelir: 390000, gider: 270000 },
  { ay: "Kas", gelir: 460000, gider: 310000 },
  { ay: "Ara", gelir: 485000, gider: 330000 },
];

const categoryData = [
  { name: "Büyükbaş Yem", value: 42 },
  { name: "Küçükbaş Yem", value: 28 },
  { name: "Kanatlı Yem", value: 18 },
  { name: "Yem Katkı", value: 12 },
];

const COLORS = ["#16A34A", "#3b82f6", "#f59e0b", "#8b5cf6"];

const weeklyData = [
  { gun: "Pzt", satis: 32000 },
  { gun: "Sal", satis: 45000 },
  { gun: "Çar", satis: 28000 },
  { gun: "Per", satis: 51000 },
  { gun: "Cum", satis: 62000 },
  { gun: "Cmt", satis: 38000 },
  { gun: "Paz", satis: 12000 },
];

const recentTransactions = [
  { id: 1, cari: "Mehmet Çiftliği", tip: "Satış", tutar: "₺12.400", tarih: "20 Nis", durum: "Ödendi" },
  { id: 2, cari: "Ayşe Hayvancılık", tip: "Satış", tutar: "₺8.750", tarih: "20 Nis", durum: "Bekliyor" },
  { id: 3, cari: "Konya Yem A.Ş.", tip: "Alış", tutar: "₺45.200", tarih: "19 Nis", durum: "Ödendi" },
  { id: 4, cari: "Veli Mandıra", tip: "Satış", tutar: "₺6.300", tarih: "19 Nis", durum: "Vadeli" },
  { id: 5, cari: "Bursa Tarım", tip: "Alış", tutar: "₺22.100", tarih: "18 Nis", durum: "Ödendi" },
];

const vadeler = [
  { cari: "Ayşe Hayvancılık", tutar: "₺18.500", vade: "22 Nis", gun: 2 },
  { cari: "Ali Besicilik", tutar: "₺32.000", vade: "25 Nis", gun: 5 },
  { cari: "Yılmaz Çiftlik", tutar: "₺9.800", vade: "28 Nis", gun: 8 },
  { cari: "Demir Hayvancılık", tutar: "₺14.200", vade: "30 Nis", gun: 10 },
];

function formatCurrency(val: number) {
  return `₺${(val / 1000).toFixed(0)}K`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name === "gelir" ? "Gelir" : p.name === "gider" ? "Gider" : "Satış"}:{" "}
          <span style={{ fontWeight: 700 }}>₺{(p.value / 1000).toFixed(0)}K</span>
        </p>
      ))}
    </div>
  );
};

export function Dashboard() {
  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1>Gösterge Paneli</h1>
        <p className="text-muted-foreground text-sm mt-1">20 Nisan 2026, Pazartesi</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs uppercase tracking-wide">
                  {card.label}
                </span>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl" style={{ fontWeight: 700 }}>{card.value}</span>
                <span
                  className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-md ${
                    card.up
                      ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                  }`}
                >
                  {card.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {card.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {/* Revenue Chart - spans 2 cols */}
        <div className="col-span-2 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm" style={{ fontWeight: 500 }}>Gelir / Gider</h3>
              <p className="text-muted-foreground text-xs mt-0.5">Son 12 ay</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                Gelir
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                Gider
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="ay" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="gelir" stroke="#16A34A" strokeWidth={2} fill="url(#gradGelir)" />
              <Area type="monotone" dataKey="gider" stroke="#3b82f6" strokeWidth={2} fill="url(#gradGider)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm mb-1" style={{ fontWeight: 500 }}>Kategori Dağılımı</h3>
          <p className="text-muted-foreground text-xs mb-3">Satış bazında</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  {cat.name}
                </span>
                <span style={{ fontWeight: 700 }}>%{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {/* Weekly bar */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm mb-1" style={{ fontWeight: 500 }}>Haftalık Satış</h3>
          <p className="text-muted-foreground text-xs mb-3">Bu hafta</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="gun" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="satis" fill="#16A34A" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent transactions */}
        <div className="col-span-2 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm" style={{ fontWeight: 500 }}>Son İşlemler</h3>
              <p className="text-muted-foreground text-xs mt-0.5">Son 5 hareket</p>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-muted-foreground" style={{ fontSize: 11 }}>
                <th className="pb-2 font-normal">cari</th>
                <th className="pb-2 font-normal">tip</th>
                <th className="pb-2 font-normal text-right">tutar</th>
                <th className="pb-2 font-normal text-right">tarih</th>
                <th className="pb-2 font-normal text-right">durum</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="border-t border-border">
                  <td className="py-2.5">{tx.cari}</td>
                  <td className="py-2.5">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-md ${
                        tx.tip === "Satış"
                          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                      }`}
                    >
                      {tx.tip}
                    </span>
                  </td>
                  <td className="py-2.5 text-right" style={{ fontWeight: 700 }}>{tx.tutar}</td>
                  <td className="py-2.5 text-right text-muted-foreground text-xs">{tx.tarih}</td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-md ${
                        tx.durum === "Ödendi"
                          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : tx.durum === "Bekliyor"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                      }`}
                    >
                      {tx.durum}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming dues */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm" style={{ fontWeight: 500 }}>Yaklaşan Vadeler</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Önümüzdeki 10 gün</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {vadeler.map((v) => (
            <div key={v.cari} className="border border-border rounded-lg p-3">
              <p className="text-sm">{v.cari}</p>
              <p className="text-lg mt-1" style={{ fontWeight: 700 }}>{v.tutar}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{v.vade}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md ${
                    v.gun <= 3
                      ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                      : v.gun <= 7
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                  }`}
                >
                  {v.gun} gün
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
