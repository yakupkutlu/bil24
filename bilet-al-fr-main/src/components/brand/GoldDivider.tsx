export function GoldDivider() {
  return (
    <div className="flex items-center gap-4" aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-theater-gold/60 to-theater-gold/20" />
      <span className="h-2 w-2 rotate-45 rounded-sm bg-theater-gold shadow-glow" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-theater-gold/60 to-theater-gold/20" />
    </div>
  );
}
