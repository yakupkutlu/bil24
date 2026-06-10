export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateTicketCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'BOS-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateQRData(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatTime(time: string): string {
  return time.substring(0, 5);
}

export function formatDateTime(date: string, time: string): string {
  return `${formatDate(date)} ${formatTime(time)}`;
}

// basePrice: veritabanından gelen KDV dahil fiyat
// KDV ve komisyon geri hesaplanarak ayrıştırılır; toplam değişmez
export function calculatePrice(basePrice: number, kdvRate: number, commissionRate: number, multiplier: number = 1): {
  netPrice: number;
  kdvAmount: number;
  commissionAmount: number;
  totalAmount: number;
} {
  const totalAmount = basePrice * multiplier;
  const netPrice = totalAmount / (1 + kdvRate / 100);
  const kdvAmount = totalAmount - netPrice;
  const commissionAmount = netPrice * (commissionRate / 100);
  return { netPrice, kdvAmount, commissionAmount, totalAmount };
}
