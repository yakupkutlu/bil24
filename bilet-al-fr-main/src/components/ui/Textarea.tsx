import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';
interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement>{label?:string}
export const Textarea=forwardRef<HTMLTextAreaElement,Props>(({label,className,...props},ref)=><label className="block space-y-2">{label&&<span className="text-sm text-theater-ivory/80">{label}</span>}<textarea ref={ref} className={cn('min-h-32 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-theater-gold',className)} {...props}/></label>); Textarea.displayName='Textarea';
