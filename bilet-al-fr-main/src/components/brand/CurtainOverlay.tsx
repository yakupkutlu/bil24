import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export function CurtainOverlay({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: '-54%' }}
        transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="absolute inset-y-0 left-0 w-1/2 bg-[repeating-linear-gradient(90deg,#30070b_0px,#7A0C0C_26px,#160406_58px)] shadow-[22px_0_60px_rgba(0,0,0,.55)]"
      />
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: '54%' }}
        transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="absolute inset-y-0 right-0 w-1/2 bg-[repeating-linear-gradient(90deg,#160406_0px,#7A0C0C_28px,#32070b_62px)] shadow-[-22px_0_60px_rgba(0,0,0,.55)]"
      />
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 to-transparent"
      />
    </div>
  );
}
