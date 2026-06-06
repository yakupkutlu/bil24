import { PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('rounded-3xl theater-surface', className)}>{children}</div>;
}

export function CardContent({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardHeader({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('border-b border-white/10 p-6', className)}>{children}</div>;
}
