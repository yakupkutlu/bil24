import { Loader2, Ticket } from 'lucide-react';

export function AppSuspenseFallback() {
  return (
    <div className="grid min-h-[70vh] place-items-center bg-theater-black text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-theater-gold text-theater-black shadow-glow">
          <Ticket />
        </div>
        <div className="flex items-center justify-center gap-3 text-sm text-white/60">
          <Loader2 className="animate-spin text-theater-gold" size={18} /> Sahne hazırlanıyor...
        </div>
      </div>
    </div>
  );
}
