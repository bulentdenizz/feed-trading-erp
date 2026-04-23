import { useState } from "react";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  TrendingUp,
  X,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type UrunDurum = "normal" | "kritik" | "tukenmis";

const urunler = [
  { id: 1, ad: "Büyükbaş Besi Yemi", sku: "BBY-001", kategori: "Büyükbaş Yem", birim: "ton", stok: 24.5, kritikEsik: 5, alisFiyati: 8200, satisFiyati: 9500, durum: "Aktif" as const },
  { id: 2, ad: "Dana Büyütme Yemi", sku: "DBY-001", kategori: "Büyükbaş Yem", birim: "ton", stok: 3.2, kritikEsik: 5, alisFiyati: 9100, satisFiyati: 10400, durum: "Aktif" as const },
  { id: 3, ad: "Koyun Yemi Karma", sku: "KYK-001", kategori: "Küçükbaş Yem", birim: "ton", stok: 18.0, kritikEsik: 4, alisFiyati: 7600, satisFiyati: 8800, durum: "Aktif" as const },
  { id: 4, ad: "Keçi Süt Yemi", sku: "KSY-001", kategori: "Küçükbaş Yem", birim: "ton", stok: 0, kritikEsik: 3, alisFiyati: 8400, satisFiyati: 9700, durum: "Aktif" as const },
  { id: 5, ad: "Broiler Başlangıç Yemi", sku: "BBR-001", kategori: "Kanatlı Yem", birim: "kg", stok: 1850, kritikEsik: 500, alisFiyati: 12.5, satisFiyati: 14.8, durum: "Aktif" as const },
  { id: 6, ad: "Yumurta Tavuğu Yemi", sku: "YTY-001", kategori: "Kanatlı Yem", birim: "kg", stok: 2400, kritikEsik: 500, alisFiyati: 11.8, satisFiyati: 13.9, durum: "Aktif" as const },
  { id: 7, ad: "Vitamin-Mineral Karması", sku: "VMK-001", kategori: "Yem Katkı", birim: "kg", stok: 320, kritikEsik: 100, alisFiyati: 85, satisFiyati: 110, durum: "Aktif" as const },
  { id: 8, ad: "Büyüme Hormonu Katkı", sku: "BHK-001", kategori: "Yem Katkı", birim: "kg", stok: 85, kritikEsik: 100, alisFiyati: 220, satisFiyati: 280, durum: "Pasif" as const },
];

const kategoriler = ["Hepsi", "Büyükbaş Yem", "Küçükbaş Yem", "Kanatlı Yem", "Yem Katkı"];

function getStokDurum(stok: number, kritik: number): UrunDurum {
  if (stok === 0) return "tukenmis";
  if (stok <= kritik) return "kritik";
  return "normal";
}

function StokBadge({ durum }: { durum: UrunDurum }) {
  if (durum === "tukenmis")
    return <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">Tükendi</span>;
  if (durum === "kritik")
    return <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">Kritik</span>;
  return <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">Normal</span>;
}

type Urun = typeof urunler[0];

function YeniUrunModal({ onClose, onSave }: { onClose: () => void; onSave: (u: Urun) => void }) {
  const [form, setForm] = useState({ ad: "", sku: "", kategori: "Büyükbaş Yem", birim: "ton", stok: "", alisFiyati: "", satisFiyati: "", kritikEsik: "" });
  const [errors, setErrors] = useState<{ ad?: string }>({});

  const handleSave = () => {
    if (!form.ad.trim()) { setErrors({ ad: "Ürün adı zorunludur" }); return; }
    onSave({
      id: Date.now(),
      ad: form.ad,
      sku: form.sku || `SKU-${Date.now()}`,
      kategori: form.kategori,
      birim: form.birim,
      stok: parseFloat(form.stok) || 0,
      kritikEsik: parseFloat(form.kritikEsik) || 5,
      alisFiyati: parseFloat(form.alisFiyati) || 0,
      satisFiyati: parseFloat(form.satisFiyati) || 0,
      durum: "Aktif",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base" style={{ fontWeight: 500 }}>Yeni Ürün</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Ürün Adı *</label>
            <input
              className={`w-full bg-input-background border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors ${errors.ad ? "border-destructive" : "border-border"}`}
              placeholder="Ürün adı"
              value={form.ad}
              onChange={(e) => { setForm(f => ({ ...f, ad: e.target.value })); setErrors({}); }}
            />
            {errors.ad && <p className="text-xs text-destructive mt-1">{errors.ad}</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">SKU</label>
            <input
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              placeholder="Otomatik oluşturulur"
              value={form.sku}
              onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Kategori</label>
            <select
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              value={form.kategori}
              onChange={(e) => setForm(f => ({ ...f, kategori: e.target.value }))}
            >
              <option value="Büyükbaş Yem">Büyükbaş Yem</option>
              <option value="Küçükbaş Yem">Küçükbaş Yem</option>
              <option value="Kanatlı Yem">Kanatlı Yem</option>
              <option value="Yem Katkı">Yem Katkı</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Birim</label>
            <select
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              value={form.birim}
              onChange={(e) => setForm(f => ({ ...f, birim: e.target.value }))}
            >
              <option value="ton">ton</option>
              <option value="kg">kg</option>
              <option value="adet">adet</option>
              <option value="çuval">çuval</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Açılış Stoku</label>
            <input
              type="number"
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              placeholder="0"
              value={form.stok}
              onChange={(e) => setForm(f => ({ ...f, stok: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Kritik Stok Eşiği</label>
            <input
              type="number"
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              placeholder="5"
              value={form.kritikEsik}
              onChange={(e) => setForm(f => ({ ...f, kritikEsik: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Alış Fiyatı (₺)</label>
            <input
              type="number"
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              placeholder="0.00"
              value={form.alisFiyati}
              onChange={(e) => setForm(f => ({ ...f, alisFiyati: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Satış Fiyatı (₺)</label>
            <input
              type="number"
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              placeholder="0.00"
              value={form.satisFiyati}
              onChange={(e) => setForm(f => ({ ...f, satisFiyati: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
            İptal
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

export function Stok() {
  const [liste, setListe] = useState(urunler);
  const [arama, setArama] = useState("");
  const [kategori, setKategori] = useState("Hepsi");
  const [modal, setModal] = useState(false);
  const [sortField, setSortField] = useState<"ad" | "stok" | "satisFiyati" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const kritikSayi = liste.filter((u) => getStokDurum(u.stok, u.kritikEsik) === "kritik").length;
  const tukenenSayi = liste.filter((u) => u.stok === 0).length;
  const toplamDeger = liste.reduce((s, u) => s + u.stok * u.alisFiyati, 0);

  const filtered = liste
    .filter((u) => {
      const aramaEsle = u.ad.toLowerCase().includes(arama.toLowerCase()) || u.sku.toLowerCase().includes(arama.toLowerCase());
      const katEsle = kategori === "Hepsi" || u.kategori === kategori;
      return aramaEsle && katEsle;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortField === "ad") return mul * a.ad.localeCompare(b.ad, "tr");
      if (sortField === "stok") return mul * (a.stok - b.stok);
      if (sortField === "satisFiyati") return mul * (a.satisFiyati - b.satisFiyati);
      return 0;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (
      sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />
    ) : null;

  const handleSave = (u: Urun) => {
    setListe((prev) => [...prev, u]);
    setModal(false);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Stok</h1>
          <p className="text-muted-foreground text-sm mt-1">{liste.length} ürün kayıtlı</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Ürün
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Toplam Ürün</span>
            <Package className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>{liste.length}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">aktif</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Stok Değeri</span>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>
              ₺{(toplamDeger / 1000).toFixed(0)}K
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">alış bazlı</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Kritik Stok</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>{kritikSayi}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">ürün</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Tükenen</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>{tukenenSayi}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">ürün</span>
          </div>
        </div>
      </div>

      {/* Kritik uyarı */}
      {(kritikSayi > 0 || tukenenSayi > 0) && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 rounded-xl text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {tukenenSayi > 0 && <><span style={{ fontWeight: 700 }}>{tukenenSayi} ürün</span> tükendi. </>}
            {kritikSayi > 0 && <><span style={{ fontWeight: 700 }}>{kritikSayi} ürün</span> kritik stok seviyesinde.</>}
            {" "}Tedarikçilerinizle iletişime geçin.
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full bg-input-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
            placeholder="Ürün adı veya SKU..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
          />
        </div>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          {kategoriler.map((k) => (
            <button
              key={k}
              onClick={() => setKategori(k)}
              className={`px-3 py-2 text-sm transition-colors ${kategori === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border" style={{ fontSize: 11 }}>
              <th className="px-4 py-3 font-normal uppercase tracking-wide cursor-pointer select-none" onClick={() => handleSort("ad")}>
                ürün adı <SortIcon field="ad" />
              </th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide">sku</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide">kategori</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide text-right cursor-pointer select-none" onClick={() => handleSort("stok")}>
                stok <SortIcon field="stok" />
              </th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide text-right">alış fiyatı</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide text-right cursor-pointer select-none" onClick={() => handleSort("satisFiyati")}>
                satış fiyatı <SortIcon field="satisFiyati" />
              </th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide text-center">stok durumu</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map((u) => {
              const stokDurum = getStokDurum(u.stok, u.kritikEsik);
              return (
                <tr key={u.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <span style={{ fontWeight: 500 }}>{u.ad}</span>
                      {u.durum === "Pasif" && (
                        <span className="ml-2 text-xs px-1 py-0.5 rounded bg-muted text-muted-foreground">Pasif</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.sku}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                      {u.kategori}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      style={{ fontWeight: 700 }}
                      className={
                        stokDurum === "tukenmis"
                          ? "text-red-700 dark:text-red-400"
                          : stokDurum === "kritik"
                          ? "text-amber-700 dark:text-amber-400"
                          : ""
                      }
                    >
                      {u.stok.toLocaleString("tr-TR")} {u.birim}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground" style={{ fontWeight: 700 }}>
                    ₺{u.alisFiyati.toLocaleString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ fontWeight: 700 }}>
                    ₺{u.satisFiyati.toLocaleString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StokBadge durum={stokDurum} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  Arama kriterine uygun ürün bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && <YeniUrunModal onClose={() => setModal(false)} onSave={handleSave} />}
    </div>
  );
}
