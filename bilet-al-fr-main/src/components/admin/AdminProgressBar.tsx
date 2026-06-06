export function AdminProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-white/55"><span>{label}</span><span>{value}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-theater-red via-theater-gold to-theater-ivory" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}
