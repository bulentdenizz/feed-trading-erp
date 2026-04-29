/**
 * Kuruş bazlı para değerini lokalize TRY string formatına çevirir.
 * Örn: 123456 -> "₺1.234,56"
 */
export function fromKurus(kurus: number): string {
  if (isNaN(kurus)) return '₺0,00';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(kurus / 100);
}

/**
 * Kullanıcı girdisini (string veya number) kuruş integer değerine çevirir.
 * Örn: "1.234,56" -> 123456
 *      "1234.56" -> 123456
 *      25.50 -> 2550
 */
export function toKurus(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }

  if (!input || typeof input !== 'string') return 0;

  // Türkçe binlik ayracı (.) kaldır, ondalık ayıracı (,) (.) yap.
  // Not: Eğer değer 1,234.56 şeklinde ingilizce bir input ise, logic hata yapabilir.
  // Bu yüzden standart kullanıcı girdisi olan 1.234,56 veya 1234.56 pattern'ini destekleyeceğiz.
  let normalized = input.trim();
  
  // Eğer string içinde ',' varsa, büyük ihtimalle Türkçe formattır
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, ''); // tüm noktaları (binlik) kaldır
    normalized = normalized.replace(',', '.');  // virgülü ondalık formata çevir
  }
  
  const parsed = parseFloat(normalized);
  if (isNaN(parsed)) return 0;

  return Math.round(parsed * 100);
}

/**
 * ISO tarih stringini gün ay yıl formatına çevirir.
 * Örn: "2026-04-20T10:30:00Z" -> "20 Nis 2026"
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return '—';
  }
}

/**
 * ISO tarih stringini kısa formatına çevirir.
 * Örn: "2026-04-20" -> "20 Nis"
 */
export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  } catch (e) {
    return '—';
  }
}

/**
 * Verilen tarih string'i ile bugün arasındaki gün sayısını hesaplar.
 * Negatif değer gecikmeyi ifade eder.
 */
export function getDaysUntil(dueDateStr: string): number {
  const due = new Date(dueDateStr);
  const today = new Date();
  
  // Saat kısımlarını sıfırla ki sadece gün farkını ölçelim
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffMs = due.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * İşlem durum etiketini hesaplar.
 */
export function getTransactionStatusLabel(remaining: number, dueDate?: string | null): string {
  if (remaining === 0) return 'Ödendi';
  if (!dueDate) return 'Bekliyor';
  
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  if (due.getTime() < today.getTime()) {
    return 'Gecikmiş';
  }
  
  return 'Vadeli';
}
