import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[Tiatru ErrorBoundary]', error, info.componentStack);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-curtain px-4 py-12 text-center text-white">
        <section className="max-w-xl rounded-[2rem] border border-red-300/20 bg-white/[.055] p-8 shadow-strongGlow backdrop-blur-xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-red-300/30 bg-red-500/10 text-red-200">
            <AlertTriangle size={34} />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[.28em] text-theater-gold">500 · Sahne arkasında hata</p>
          <h1 className="mt-3 font-serif text-4xl font-bold">Bir şey ters gitti</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Sayfa beklenmeyen bir hata verdi. Yenileyerek tekrar deneyebilir veya ana sayfaya dönebilirsiniz.
          </p>
          {this.state.message ? <p className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/45">{this.state.message}</p> : null}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => window.location.reload()}><RefreshCcw size={16} /> Yenile</Button>
            <Button variant="secondary" onClick={() => { window.location.href = '/'; }}><Home size={16} /> Ana Sayfa</Button>
          </div>
        </section>
      </main>
    );
  }
}
