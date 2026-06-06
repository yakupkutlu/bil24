import { PropsWithChildren } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export function AnimatedSection({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.section>
  );
}
