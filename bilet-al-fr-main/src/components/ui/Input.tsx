import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, icon, className, ...props }, ref) => (
  <label className="block space-y-2">
    {label && <span className="text-sm text-theater-ivory/80">{label}</span>}
    <span className="relative block">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">{icon}</span>}
      <input
        ref={ref}
        className={cn('w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-theater-gold focus:ring-2 focus:ring-theater-gold/20', icon && 'pl-10', className)}
        {...props}
      />
    </span>
    {error && <span className="text-xs text-red-300">{error}</span>}
  </label>
));
Input.displayName = 'Input';
