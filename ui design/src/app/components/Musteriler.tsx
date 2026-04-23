import { useState } from "react";
import {
  Search,
  Plus,
  Phone,
  MapPin,
  TrendingUp,
  Users,
  Wallet,
  ChevronRight,
  X,
  Check,
} from "lucide-react";

const musteriler = [
  { id: 1, ad: "Mehmet Çiftliği", telefon: "0532 111 22 33", sehir: "Konya", bakiye: 18500, sonIslem: "20 Nis 2026", durum: "Aktif", tip: "Müşteri" },
  { id: 2, ad: "Ayşe Hayvancılık", telefon: "0544 222 33 44", sehir: "Ankara", bakiye: 32000, sonIslem: "20 Nis 2026", durum: "Aktif", tip: "Müşteri" },
  { id: 3, ad: "Veli Mandıra", telefon: "0555 333 44 55", sehir: "Bursa", bakiye: 6300, sonIslem: "19 Nis 2026", durum: "Aktif", tip: "Müşteri" },
  { id: 4, ad: "Ali Besicilik", telefon: "0512 444 55 66", sehir: "İzmir", bakiye: 0, sonIslem: "15 Nis 2026", durum: "Aktif", tip: "Müşteri" },
  { id: 5, ad: "Yılmaz Çiftlik", telefon: "0533 555 66 77", sehir: "Samsun", bakiye: 9800, sonIslem: "18 Nis 2026", durum: "Aktif", tip: "Müşteri" },
  { id: 6, ad: "Demir Hayvancılık", telefon: "0545 666 77 88", sehir: "Kayseri", bakiye: 14200, sonIslem: "17 Nis 2026", durum: "Pasif", tip: "Müşteri" },
  { id: 7, ad: "Özer Tarım Ltd.", telefon: "0531 777 88 99", sehir: "Adana", bakiye: 45600, sonIslem: "16 Nis 2026", durum: "Aktif", tip: "Müşteri" },
  { id: 8, ad: "Kaya Çiftçilik", telefon: "0543 888 99 00", sehir: "Erzurum", bakiye: 0, sonIslem: "10 Nis 2026", durum: "Aktif", tip: "Müşteri" },
];

const formatPara = (val: number) =>
  val === 0 ? "—" : `₺${val.toLocaleString("tr-TR")}`;

type Musteri = typeof musteriler[0];

function YeniMusteriModal({ onClose, onSave }: { onClose: () => void; onSave: (m: Musteri) => void }) {
  const [form, setForm] = useState({ ad: "", telefon: "", sehir: "", notlar: "" });
  const [errors, setErrors] = useState<{ ad?: string }>({});

  const handleSave = () => {
    if (!form.ad.trim()) {
      setErrors({ ad: "Müşteri adı zorunludur" });
      return;
    }
    onSave({
      id: Date.now(),
      ad: form.ad,
      telefon: form.telefon,
      sehir: form.sehir,
      bakiye: 0,
      sonIslem: "—",
      durum: "Aktif",
      tip: "Müşteri",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base" style={{ fontWeight: 500 }}>Yeni Müşteri</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Müşteri Adı *</label>
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
              placeholder="05xx xxx xx xx"
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
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Notlar</label>
            <textarea
              className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none"
              rows={3}
              placeholder="İsteğe bağlı notlar..."
              value={form.notlar}
              onChange={(e) => setForm(f => ({ ...f, notlar: e.target.value }))}
            />
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

export function Musteriler() {
  const [liste, setListe] = useState(musteriler);
  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState<"hepsi" | "Aktif" | "Pasif">("hepsi");
  const [modal, setModal] = useState(false);
  const [secili, setSecili] = useState<Musteri | null>(null);

  const filtered = liste.filter((m) => {
    const aramaEsle = m.ad.toLowerCase().includes(arama.toLowerCase()) || m.telefon.includes(arama);
    const filtreEsle = filtre === "hepsi" || m.durum === filtre;
    return aramaEsle && filtreEsle;
  });

  const toplamBakiye = liste.reduce((s, m) => s + m.bakiye, 0);
  const aktifSayi = liste.filter((m) => m.durum === "Aktif").length;
  const bakiyeli = liste.filter((m) => m.bakiye > 0).length;

  const handleSave = (m: Musteri) => {
    setListe((prev) => [...prev, m]);
    setModal(false);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Müşteriler</h1>
          <p className="text-muted-foreground text-sm mt-1">{liste.length} kayıtlı müşteri</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Müşteri
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Toplam Müşteri</span>
            <Users className="w-4 h-4 text-muted-foreground" />
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
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Açık Bakiye</span>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>₺{toplamBakiye.toLocaleString("tr-TR")}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              {bakiyeli} borçlu
            </span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Bu Ay Tahsilat</span>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl" style={{ fontWeight: 700 }}>₺78.400</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
              +14%
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
              <th className="px-4 py-3 font-normal uppercase tracking-wide">müşteri adı</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide">telefon</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide">şehir</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide text-right">bakiye</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide text-right">son işlem</th>
              <th className="px-4 py-3 font-normal uppercase tracking-wide text-center">durum</th>
              <th className="px-4 py-3 font-normal" />
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map((m) => (
              <tr
                key={m.id}
                className="border-t border-border hover:bg-muted/40 cursor-pointer transition-colors"
                onClick={() => setSecili(secili?.id === m.id ? null : m)}
              >
                <td className="px-4 py-3">
                  <span style={{ fontWeight: 500 }}>{m.ad}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    {m.telefon || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {m.sehir || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right" style={{ fontWeight: m.bakiye > 0 ? 700 : 400 }}>
                  <span className={m.bakiye > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}>
                    {formatPara(m.bakiye)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground text-xs">{m.sonIslem}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-md ${
                      m.durum === "Aktif"
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.durum}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${secili?.id === m.id ? "rotate-90" : ""}`} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  Arama kriterine uygun müşteri bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Expanded row detail */}
        {secili && (
          <div className="border-t border-border bg-muted/30 px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Müşteri</p>
                <p className="text-sm" style={{ fontWeight: 500 }}>{secili.ad}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">İletişim</p>
                <p className="text-sm">{secili.telefon || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Açık Bakiye</p>
                <p className="text-sm" style={{ fontWeight: 700 }}>{formatPara(secili.bakiye)}</p>
              </div>
              <div className="flex items-end gap-2">
                <button className="px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Ekstre
                </button>
                <button className="px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Tahsilat
                </button>
                <button className="px-3 py-1.5 text-xs border border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition-colors">
                  Yeni Satış
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {modal && <YeniMusteriModal onClose={() => setModal(false)} onSave={handleSave} />}
    </div>
  );
}
