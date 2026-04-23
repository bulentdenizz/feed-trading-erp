import { useState } from "react";
import {
  Search,
  Plus,
  Phone,
  MapPin,
  TrendingDown,
  Truck,
  Wallet,
  ChevronRight,
  X,
  Check,
} from "lucide-react";

const tedarikcilar = [
  { id: 1, ad: "Konya Yem A.Ş.", telefon: "0332 111 22 33", sehir: "Konya", borc: 45200, sonIslem: "19 Nis 2026", durum: "Aktif", kategori: "Büyükbaş Yem" },
  { id: 2, ad: "Bursa Tarım", telefon: "0224 222 33 44", sehir: "Bursa", borc: 22100, sonIslem: "18 Nis 2026", durum: "Aktif", kategori: "Yem Katkı" },
  { id: 3, ad: "Ankara Hammadde Ltd.", telefon: "0312 333 44 55", sehir: "Ankara", borc: 0, sonIslem: "15 Nis 2026", durum: "Aktif", kategori: "Kanatlı Yem" },
  { id: 4, ad: "İzmir Gıda Sanayi", telefon: "0232 444 55 66", sehir: "İzmir", borc: 67800, sonIslem: "14 Nis 2026", durum: "Aktif", kategori: "Büyükbaş Yem" },
  { id: 5, ad: "Eskişehir Tarım Koop.", telefon: "0222 555 66 77", sehir: "Eskişehir", borc: 0, sonIslem: "10 Nis 2026", durum: "Pasif", kategori: "Küçükbaş Yem" },
  { id: 6, ad: "Samsun Deniz Ür. A.Ş.", telefon: "0362 666 77 88", sehir: "Samsun", borc: 12500, sonIslem: "12 Nis 2026", durum: "Aktif", kategori: "Yem Katkı" },
];

const formatPara = (val: number) =>
  val === 0 ? "—" : `₺${val.toLocaleString("tr-TR")}`;

type Tedarikci = typeof tedarikcilar[0];

function YeniTedarikciModal({ onClose, onSave }: { onClose: () => void; onSave: (t: Tedarikci) => void }) {
  const [form, setForm] = useState({ ad: "", telefon: "", sehir: "", kategori: "" });
  const [errors, setErrors] = useState<{ ad?: string }>({});

  const handleSave = () => {
    if (!form.ad.trim()) {
      setErrors({ ad: "Tedarikçi adı zorunludur" });
      return;
    }
    onSave({
      id: Date.now(),
      ad: form.ad,
      telefon: form.telefon,
      sehir: form.sehir,
      borc: 0,
      sonIslem: "—",
      durum: "Aktif",
      kategori: form.kategori || "—",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base" style={{ fontWeight: 500 }}>Yeni Tedarikçi</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Tedarikçi Adı *</label>
            <input
              className={`w-full bg-input-background border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors ${errors.ad ? "border-destructive" : "border-border"}`}
              placeholder="Firma veya kişi adı"
              value={form.ad}
              onChange={(e) => { setForm(f => ({ ...f, ad: e.target.value })); setErrors({}); }}
            />
            {errors.ad && <p className="text-xs text-destructive mt-1">{errors.ad}</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Telefon</label>
            <input
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              placeholder="0xxx xxx xx xx"
              value={form.telefon}
              onChange={(e) => setForm(f => ({ ...f, telefon: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Şehir</label>
            <input
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              placeholder="İl"
              value={form.sehir}
              onChange={(e) => setForm(f => ({ ...f, sehir: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Ürün Kategorisi</label>
            <select
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
              value={form.kategori}
              onChange={(e) => setForm(f => ({ ...f, kategori: e.target.value }))}
            >
              <option value="">Seçiniz</option>
              <option value="Büyükbaş Yem">Büyükbaş Yem</option>
              <option value="Küçükbaş Yem">Küçükbaş Yem</option>
              <option value="Kanatlı Yem">Kanatlı Yem</option>
              <option value="Yem Katkı">Yem Katkı</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5" />
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

export function Tedarikcilar() {
  const [liste, setListe] = useState(tedarikcilar);
  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState<"hepsi" | "Aktif" | "Pasif">("hepsi");
  const [modal, setModal] = useState(false);
  const [secili, setSecili] = useState<Tedarikci | null>(null);

  const filtered = liste.filter((t) => {
    const aramaEsle = t.ad.toLowerCase().includes(arama.toLowerCase()) || t.telefon.includes(arama);
    const filtreEsle = filtre === "hepsi" || t.durum === filtre;
    return aramaEsle && filtreEsle;
  });

  const toplamBorc = liste.reduce((s, t) => s + t.borc, 0);
  const aktifSayi = liste.filter((t) => t.durum === "Aktif").length;
  const borclu = liste.filter((t) => t.borc > 0).length;

  const handleSave = (t: Tedarikci) => {
    setListe((prev) => [...prev, t]);
    setModal(false);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Tedarikçiler</h1>
          <p className="text-muted-foreground text-sm mt-1">{liste.length} kayıtlı tedarikçi</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Tedarikçi
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Toplam Tedarikçi</span>
            <Truck className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>{liste.length}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
              {aktifSayi} aktif
            </span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Açık Borç</span>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>₺{toplamBorc.toLocaleString("tr-TR")}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
              {borclu} borçlu
            </span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Bu Ay Ödeme</span>
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>₺94.500</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              6 tedarikçi
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full bg-input-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
            placeholder="Ad veya telefon ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
          />
        </div>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          {(["hepsi", "Aktif", "Pasif"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`px-3 py-2 text-sm transition-colors ${filtre === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              {f === "hepsi" ? "Hepsi" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border" style={{ fontSize: 11 }}>
              <th className="px-4 py-3 font-normal uppercase tracking-wide">tedarikçi adı</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide">telefon</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide">şehir</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide">kategori</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide text-right">borç</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide text-right">son işlem</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide text-center">durum</th>
              <th className="px-4 py-3 font-normal" />
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map((t) => (
              <tr
                key={t.id}
                className="border-t border-border hover:bg-muted/40 cursor-pointer transition-colors"
                onClick={() => setSecili(secili?.id === t.id ? null : t)}
              >
                <td className="px-4 py-3">
                  <span style={{ fontWeight: 500 }}>{t.ad}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    {t.telefon || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {t.sehir || "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                    {t.kategori}
                  </span>
                </td>
                <td className="px-4 py-3 text-right" style={{ fontWeight: t.borc > 0 ? 700 : 400 }}>
                  <span className={t.borc > 0 ? "text-red-700 dark:text-red-400" : "text-muted-foreground"}>
                    {formatPara(t.borc)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground text-xs">{t.sonIslem}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-md ${
                      t.durum === "Aktif"
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.durum}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${secili?.id === t.id ? "rotate-90" : ""}`} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  Arama kriterine uygun tedarikçi bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {secili && (
          <div className="border-t border-border bg-muted/30 px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tedarikçi</p>
                <p className="text-sm" style={{ fontWeight: 500 }}>{secili.ad}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Kategori</p>
                <p className="text-sm">{secili.kategori}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Açık Borç</p>
                <p className="text-sm" style={{ fontWeight: 700 }}>{formatPara(secili.borc)}</p>
              </div>
              <div className="flex items-end gap-2">
                <button className="px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Ekstre
                </button>
                <button className="px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Ödeme Yap
                </button>
                <button className="px-3 py-1.5 text-xs border border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition-colors">
                  Yeni Alış
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {modal && <YeniTedarikciModal onClose={() => setModal(false)} onSave={handleSave} />}
    </div>
  );
}
