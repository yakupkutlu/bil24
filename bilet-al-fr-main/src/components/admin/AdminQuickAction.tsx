import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AdminQuickAction({ to, icon, title, description }: { to: string; icon: ReactNode; title: string; description: string }) {
  return (
    <Link to={to} className="group rounded-3xl border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-1 hover:border-theater-gold/40 hover:bg-theater-gold/10">
      <span className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-theater-gold/10 text-theater-gold group-hover:bg-theater-gold group-hover:text-theater-black">{icon}</span>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-white/50">{description}</p>
    </Link>
  );
}
