import { Server, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { integrationService } from '@/services/integration.service';

export function IntegrationConfigCard() {
  const config = integrationService.config();
  return (
    <Card>
      <CardContent className="grid gap-4 p-6 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[.22em] text-theater-gold"><Server size={14}/> API temel URL</p>
          <p className="mt-2 break-all font-mono text-sm text-white">{config.baseUrl}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[.22em] text-theater-gold"><ShieldCheck size={14}/> Backend modu</p>
          <div className="mt-2"><Badge>Sadece sıkı backend</Badge></div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[.22em] text-theater-gold">Gerekli env</p>
          <p className="mt-2 text-sm text-white/70">Use <code className="text-theater-gold">VITE_ENABLE_DEMO_FALLBACK=false</code> and keep the backend running.</p>
        </div>
      </CardContent>
    </Card>
  );
}
