import { motion } from 'framer-motion';

const pieces = Array.from({ length: 28 }, (_, index) => index);

export function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((piece) => {
        const left = 8 + ((piece * 31) % 84);
        const delay = (piece % 8) * 0.08;
        const distance = 120 + (piece % 7) * 24;
        return (
          <motion.span
            key={piece}
            className="absolute top-24 h-2 w-2 rounded-sm bg-theater-gold"
            style={{ left: `${left}%` }}
            initial={{ opacity: 0, y: 0, rotate: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: [0, -distance * 0.45, distance], rotate: [0, 180, 360], scale: [0, 1, 1, .7] }}
            transition={{ duration: 1.8, delay, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}
