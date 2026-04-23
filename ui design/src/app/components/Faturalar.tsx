import { useState } from "react";
import {
  Search,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Check,
  ChevronDown,
} from "lucide-react";

type FaturaDurum = "Ödendi" | "Bekliyor" | "Vadeli" | "Gecikmiş";
type FaturaTip = "satis" | "alis";

const satisFaturalari = [
  { id: 1, no: "SAT-2026-0042", cari: "Mehmet Çiftliği", tarih: "20 Nis 2026", vade: "04 May 2026", tutar: 12400, kalan: 0, durum: "Ödendi" as FaturaDurum },
  { id: 2, no: "SAT-2026-0041", cari: "Ayşe Hayvancılık", tarih: "20 Nis 2026", vade: "22 Nis 2026", tutar: 8750, kalan: 8750, durum: "Gecikmiş" as FaturaDurum },
  { id: 3, no: "SAT-2026-0040", cari: "Veli Mandıra", tarih: "19 Nis 2026", vade: "03 May 2026", tutar: 6300, kalan: 6300, durum: "Vadeli" as FaturaDurum },
  { id: 4, no: "SAT-2026-0039", cari: "Özer Tarım Ltd.", tarih: "18 Nis 2026", vade: "02 May 2026", tutar: 24500, kalan: 24500, durum: "Bekliyor" as FaturaDurum },
  { id: 5, no: "SAT-2026-0038", cari: "Ali Besicilik", tarih: "17 Nis 2026", vade: "01 May 2026", tutar: 15200, kalan: 0, durum: "Ödendi" as FaturaDurum },
  { id: 6, no: "SAT-2026-0037", cari: "Yılmaz Çiftlik", tarih: "16 Nis 2026", vade: "16 Nis 2026", tutar: 9800, kalan: 9800, durum: "Gecikmiş" as FaturaDurum },
  { id: 7, no: "SAT-2026-0036", cari: "Demir Hayvancılık", tarih: "15 Nis 2026", vade: "29 Nis 2026", tutar: 14200, kalan: 7000, durum: "Bekliyor" as FaturaDurum },
];

const alisFaturalari = [
  { id: 1, no: "ALI-2026-0018", cari: "Konya Yem A.Ş.", tarih: "19 Nis 2026", vade: "03 May 2026", tutar: 45200, kalan: 0, durum: "Ödendi" as FaturaDurum },
  { id: 2, no: "ALI-2026-0017", cari: "Bursa Tarım", tarih: "18 Nis 2026", vade: "02 May 2026", tutar: 22100, kalan: 22100, durum: "Bekliyor" as FaturaDurum },
  { id: 3, no: "ALI-2026-0016", cari: "İzmir Gıda Sanayi", tarih: "14 Nis 2026", vade: "28 Nis 2026", tutar: 38600, kalan: 38600, durum: "Vadeli" as FaturaDurum },
  { id: 4, no: "ALI-2026-0015", cari: "Samsun Deniz Ür. A.Ş.", tarih: "12 Nis 2026", vade: "12 Nis 2026", tutar: 12500, kalan: 12500, durum: "Gecikmiş" as FaturaDurum },
  { id: 5, no: "ALI-2026-0014", cari: "Ankara Hammadde Ltd.", tarih: "10 Nis 2026", vade: "24 Nis 2026", tutar: 28900, kalan: 0, durum: "Ödendi" as FaturaDurum },
];

const formatPara = (val: number) => `₺${val.toLocaleString("tr-TR")}`;

function DurumBadge({ durum }: { durum: FaturaDurum }) {
  const styles: Record<FaturaDurum, string> = {
    "Ödendi": "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
    "Bekliyor": "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    "Vadeli": "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    "Gecikmiş": "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-md ${styles[durum]}`}>{durum}</span>
  );
}

type YeniFaturaModalProps = {
  tip: FaturaTip;
  onClose: () => void;
  onSave: (f: typeof satisFaturalari[0]) => void;
};

function YeniFaturaModal({ tip, onClose, onSave }: YeniFaturaModalProps) {
  const [form, setForm] = useState({ cari: "", tarih: "", vade: "", tutar: "", aciklama: "" });
  const [errors, setErrors] = useState<{ cari?: string; tutar?: string }>({});

  const handleSave = () => {
    const errs: typeof errors = {};
    if (!form.cari.trim()) errs.cari = "Cari zorunludur";
    if (!form.tutar || parseFloat(form.tutar) <= 0) errs.tutar = "Geçerli bir tutar girin";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const tutar = parseFloat(form.tutar);
    onSave({
      id: Date.now(),
      no: `${tip === "satis" ? "SAT" : "ALI"}-2026-${String(Date.now()).slice(-4)}`,
      cari: form.cari,
      tarih: form.tarih || "22 Nis 2026",
      vade: form.vade || "—",
      tutar,
      kalan: tutar,
      durum: "Bekliyor",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base" style={{ fontWeight: 500 }}>
            {tip === "satis" ? "Yeni Satış Faturası" : "Yeni Alış Faturası"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">
              {tip === "satis" ? "Müşteri *" : "Tedarikçi *"}
            </label>
            <input
              className={`w-full bg-input-background border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors ${errors.cari ? "border-destructive" : "border-border"}`}
              placeholder={tip === "satis" ? "Müşteri adı" : "Tedarikçi adı"}
              value={form.cari}
              onChange={(e) => { setForm(f => ({ ...f, cari: e.target.value })); setErrors({}); }}
            />
            {errors.cari && <p className="text-xs text-destructive mt-1">{errors.cari}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Fatura Tarihi</label>
              <input
                type="date"
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                value={form.tarih}
                onChange={(e) => setForm(f => ({ ...f, tarih: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Vade Tarihi</label>
              <input
                type="date"
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                value={form.vade}
                onChange={(e) => setForm(f => ({ ...f, vade: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Tutar (₺) *</label>
            <input
              type="number"
              className={`w-full bg-input-background border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors ${errors.tutar ? "border-destructive" : "border-border"}`}
              placeholder="0.00"
              value={form.tutar}
              onChange={(e) => { setForm(f => ({ ...f, tutar: e.target.value })); setErrors({}); }}
            />
            {errors.tutar && <p className="text-xs text-destructive mt-1">{errors.tutar}</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Açıklama</label>
            <textarea
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none"
              rows={2}
              placeholder="İsteğe bağlı..."
              value={form.aciklama}
              onChange={(e) => setForm(f => ({ ...f, aciklama: e.target.value }))}
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

export function Faturalar() {
  const [aktifTab, setAktifTab] = useState<FaturaTip>("satis");
  const [satisList, setSatisList] = useState(satisFaturalari);
  const [alisList, setAlisList] = useState(alisFaturalari);
  const [arama, setArama] = useState("");
  const [durumFiltre, setDurumFiltre] = useState<"hepsi" | FaturaDurum>("hepsi");
  const [modal, setModal] = useState(false);

  const aktifListe = aktifTab === "satis" ? satisList : alisList;

  const filtered = aktifListe.filter((f) => {
    const aramaEsle = f.no.toLowerCase().includes(arama.toLowerCase()) || f.cari.toLowerCase().includes(arama.toLowerCase());
    const durumEsle = durumFiltre === "hepsi" || f.durum === durumFiltre;
    return aramaEsle && durumEsle;
  });

  const toplamTutar = aktifListe.reduce((s, f) => s + f.tutar, 0);
  const toplamKalan = aktifListe.reduce((s, f) => s + f.kalan, 0);
  const odenenSayi = aktifListe.filter((f) => f.durum === "Ödendi").length;
  const gecikmisler = aktifListe.filter((f) => f.durum === "Gecikmiş");

  const handleSave = (f: typeof satisFaturalari[0]) => {
    if (aktifTab === "satis") setSatisList((prev) => [f, ...prev]);
    else setAlisList((prev) => [f, ...prev]);
    setModal(false);
  };

  const durumFiltreler: Array<"hepsi" | FaturaDurum> = ["hepsi", "Bekliyor", "Vadeli", "Gecikmiş", "Ödendi"];

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Faturalar</h1>
          <p className="text-muted-foreground text-sm mt-1">Satış ve alış faturaları</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Fatura
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Toplam Fatura</span>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>{aktifListe.length}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              {aktifTab === "satis" ? "satış" : "alış"}
            </span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Toplam Tutar</span>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>₺{(toplamTutar / 1000).toFixed(0)}K</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
              {odenenSayi} ödendi
            </span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Tahsil Edilmedi</span>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>₺{(toplamKalan / 1000).toFixed(0)}K</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              bekliyor
            </span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Gecikmiş</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>{gecikmisler.length}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
              fatura
            </span>
          </div>
        </div>
      </div>

      {/* Gecikmiş uyarı */}
      {gecikmisler.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            <span style={{ fontWeight: 700 }}>{gecikmisler.length} fatura</span> vadesi geçmiş:{" "}
            {gecikmisler.map((f, i) => (
              <span key={f.id}>{f.cari} (<span style={{ fontWeight: 700 }}>{formatPara(f.kalan)}</span>){i < gecikmisler.length - 1 ? ", " : ""}</span>
            ))}
          </span>
        </div>
      )}

      {/* Tabs + toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => { setAktifTab("satis"); setArama(""); setDurumFiltre("hepsi"); }}
              className={`px-4 py-2 text-sm transition-colors ${aktifTab === "satis" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              Satış Faturaları
            </button>
            <button
              onClick={() => { setAktifTab("alis"); setArama(""); setDurumFiltre("hepsi"); }}
              className={`px-4 py-2 text-sm transition-colors ${aktifTab === "alis" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              Alış Faturaları
            </button>
          </div>

          {/* Durum filtresi */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            {durumFiltreler.map((d) => (
              <button
                key={d}
                onClick={() => setDurumFiltre(d)}
                className={`px-3 py-2 text-sm transition-colors ${durumFiltre === d ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
              >
                {d === "hepsi" ? "Hepsi" : d}
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
              <th className="px-4 py-3 font-normal" />
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map((f) => (
              <tr key={f.id} className="border-t border-border hover:bg-muted/40 transition-colors cursor-pointer">
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground font-mono">{f.no}</span>
                </td>
                <td className="px-4 py-3" style={{ fontWeight: 500 }}>{f.cari}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{f.tarih}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${f.durum === "Gecikmiş" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                    {f.vade}
                  </span>
                </td>
                <td className="px-4 py-3 text-right" style={{ fontWeight: 700 }}>{formatPara(f.tutar)}</td>
                <td className="px-4 py-3 text-right">
                  <span style={{ fontWeight: f.kalan > 0 ? 700 : 400 }} className={f.kalan > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}>
                    {f.kalan === 0 ? "—" : formatPara(f.kalan)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <DurumBadge durum={f.durum} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto transition-colors">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  Arama kriterine uygun fatura bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && <YeniFaturaModal tip={aktifTab} onClose={() => setModal(false)} onSave={handleSave} />}
    </div>
  );
}
