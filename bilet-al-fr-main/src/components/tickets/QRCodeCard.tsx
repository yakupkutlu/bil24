export function QRCodeCard({ token }: { token: string }) {
  const cells = Array.from({ length: 49 }, (_, index) => {
    const active = (index * 7 + token.length * 3) % 5 !== 0 || [0, 1, 7, 8, 5, 6, 12, 13, 35, 36, 42, 43].includes(index);
    return <span key={index} className={active ? 'rounded-[2px] bg-black' : 'rounded-[2px] bg-transparent'} />;
  });

  return (
    <div className="relative grid aspect-square w-36 place-items-center overflow-hidden rounded-2xl bg-white p-3 text-center text-[9px] font-bold text-black shadow-glow">
      <div className="absolute inset-x-3 top-1/2 h-px bg-theater-red/80 shadow-redGlow qr-scan-line" />
      <div className="grid h-full w-full grid-cols-7 gap-1 rounded-xl border-8 border-black p-2">
        {cells}
      </div>
      <span className="absolute bottom-2 left-1/2 max-w-28 -translate-x-1/2 truncate rounded-full bg-white/90 px-2 py-0.5 text-[8px]">{token}</span>
    </div>
  );
}
