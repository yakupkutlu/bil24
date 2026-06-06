import { Link } from 'react-router-dom';
import { AlertOctagon, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ServerErrorPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-curtain p-6 text-center text-white">
      <section className="max-w-lg rounded-[2rem] border border-red-300/20 bg-white/[.055] p-10 backdrop-blur-xl">
        <AlertOctagon className="mx-auto mb-5 text-red-200" size={62} />
        <p className="text-xs uppercase tracking-[.28em] text-theater-gold">500</p>
        <h1 className="mt-3 font-serif text-5xl font-bold">Sahne hazırlanamadı</h1>
        <p className="mt-4 text-sm leading-6 text-white/60">Sunucu veya uygulama geçici olarak cevap veremedi. Lütfen tekrar deneyin.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => window.location.reload()}><RefreshCcw size={16} /> Tekrar dene</Button>
          <Button asChild variant="secondary"><Link to="/">Ana Sayfa</Link></Button>
        </div>
      </section>
    </main>
  );
}
