import {
  ButtonHTMLAttributes,
  ReactElement,
  cloneElement,
  forwardRef,
  isValidElement
} from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'gold', size = 'md', asChild, children, ...props }, ref) => {
    const variants: Record<Variant, string> = {
      primary: 'bg-theater-red hover:bg-red-900 text-white shadow-redGlow',
      secondary: 'bg-white/10 hover:bg-white/15 text-white border border-white/10 backdrop-blur',
      outline:
        'bg-transparent border border-theater-gold/50 text-theater-ivory hover:bg-theater-gold/10 hover:border-theater-gold',
      ghost: 'bg-transparent hover:bg-white/10 text-theater-ivory',
      danger: 'bg-red-700 hover:bg-red-800 text-white',
      gold:
        'gold-shine bg-gradient-to-r from-theater-gold via-yellow-600 to-theater-gold bg-[length:200%_100%] text-theater-black font-semibold shadow-glow hover:shadow-strongGlow hover:bg-right'
    };

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-5 text-sm',
      lg: 'h-12 px-7 text-base'
    };

    const classes = cn(
      'inline-flex items-center justify-center rounded-xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 gap-2 active:scale-[.98]',
      variants[variant],
      sizes[size],
      className
    );

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string }>;

      return cloneElement(child, {
        ...props,
        className: cn(classes, child.props.className)
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';