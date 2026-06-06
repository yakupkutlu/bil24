import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface Option { label: string; value: string }
interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: Option[];
}

export const Select = forwardRef<HTMLSelectElement, Props>(({ label, options, children, className, ...props }, ref) => (
  <label className="block space-y-2">
    {label && <span className="text-sm text-theater-ivory/80">{label}</span>}
    <select ref={ref} className={cn('w-full rounded-xl border border-white/10 bg-theater-black px-4 py-3 text-white outline-none focus:border-theater-gold', className)} {...props}>
      {options ? options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>) : children}
    </select>
  </label>
));
Select.displayName = 'Select';
