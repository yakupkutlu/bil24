import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export function PaymentFailedPage() {
  return <main className="mx-auto max-w-2xl px-4 py-20"><Card><CardContent className="p-8 text-center"><XCircle className="mx-auto h-16 w-16 text-red-400" /><h1 className="mt-4 font-serif text-4xl text-white">Ödeme tamamlanamadı</h1><p className="mt-2 text-white/60">Kart sağlayıcısından onay alınamadı. Koltuk süren dolmadan tekrar deneyebilirsin.</p><div className="mt-6 flex justify-center gap-3"><Button asChild><Link to="/checkout">Tekrar dene</Link></Button><Button asChild variant="outline"><Link to="/showtimes/show_1/seats">Koltuklara dön</Link></Button></div></CardContent></Card></main>;
}
