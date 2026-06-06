import { ReactNode } from 'react';

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.035] to-theater-red/10 p-6 shadow-2xl md:p-8">
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-theater-gold/20 blur-3xl" />
      <div className="absolute bottom-0 left-10 h-px w-2/3 bg-gradient-to-r from-transparent via-theater-gold/60 to-transparent" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.34em] text-theater-gold">{eyebrow}</p>}
          <h1 className="font-serif text-4xl text-white md:text-5xl">{title}</h1>
          {description && <p className="max-w-2xl text-sm leading-6 text-theater-ivory/65 md:text-base">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </section>
  );
}
