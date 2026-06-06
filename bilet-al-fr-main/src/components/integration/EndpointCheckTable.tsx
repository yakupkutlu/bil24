import { AlertTriangle, CheckCircle2, CircleDashed, Lock, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import type { EndpointCheckResult } from '@/services/integration.service';
import { cn } from '@/utils/cn';

function StatusIcon({ status }: { status: EndpointCheckResult['status'] }) {
  if (status === 'PASS') return <CheckCircle2 className="text-emerald-300" size={18} />;
  if (status === 'FAIL') return <ShieldAlert className="text-red-300" size={18} />;
  return <CircleDashed className="text-white/45" size={18} />;
}

function riskClass(risk: EndpointCheckResult['risk']) {
  if (risk === 'HIGH') return 'border-red-400/25 bg-red-400/10 text-red-100';
  if (risk === 'MEDIUM') return 'border-yellow-400/25 bg-yellow-400/10 text-yellow-100';
  return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100';
}

export function EndpointCheckTable({ results, onRun, running }: { results: EndpointCheckResult[]; onRun: () => void; running?: boolean }) {
  const passed = results.filter((item) => item.status === 'PASS').length;
  const failed = results.filter((item) => item.status === 'FAIL').length;
  const skipped = results.filter((item) => item.status === 'SKIPPED').length;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[.03] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[.24em] text-theater-gold">Endpoint doğrulaması</p>
          <h2 className="mt-1 font-serif text-2xl text-white">Gerçek backend sözleşme kontrolü</h2>
          <p className="mt-1 text-sm text-white/55">Güvenli GET endpointleri otomatik kontrol edilir. Gerçek ID sağlamadığın sürece yazma akışları belgelenir ve atlanır.</p>
        </div>
        <Button onClick={onRun} disabled={running}>{running ? 'Kontrol ediliyor...' : 'Kontrolleri çalıştır'}</Button>
      </div>
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100"><strong>{passed}</strong><p className="text-sm opacity-80">Başarılı</p></div>
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100"><strong>{failed}</strong><p className="text-sm opacity-80">Başarısız</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-white/70"><strong>{skipped}</strong><p className="text-sm opacity-80">Manuel</p></div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-black/30 text-xs uppercase tracking-[.18em] text-white/45">
              <tr>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Alan</th>
                <th className="px-4 py-3">Endpoint</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Sonuç / sonraki düzeltme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {results.map((item) => (
                <tr key={item.id} className="bg-white/[.015] align-top">
                  <td className="px-4 py-4"><div className="flex items-center gap-2"><StatusIcon status={item.status}/><span className={cn('font-semibold', item.status === 'PASS' && 'text-emerald-200', item.status === 'FAIL' && 'text-red-200', item.status === 'SKIPPED' && 'text-white/55')}>{item.status}</span></div></td>
                  <td className="px-4 py-4 text-white/70">{item.area}</td>
                  <td className="px-4 py-4"><p className="font-semibold text-white">{item.title}</p><p className="mt-1 font-mono text-xs text-theater-gold">{item.method} {item.path}</p>{item.requiresAuth && <p className="mt-2 flex items-center gap-1 text-xs text-white/40"><Lock size={12}/> giriş yapmış rol gerektirir</p>}</td>
                  <td className="px-4 py-4"><Badge className={riskClass(item.risk)}>{item.risk}</Badge></td>
                  <td className="px-4 py-4"><p className="text-white/65">{item.message}</p>{item.statusCode && <p className="mt-1 text-xs text-white/35">HTTP {item.statusCode}</p>}{item.note && <p className="mt-2 flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/45"><AlertTriangle className="mt-0.5 text-theater-gold" size={14}/>{item.note}</p>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
