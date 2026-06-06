import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, Menu, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/utils/cn';
import { SkipLink } from './SkipLink';

export interface NavItem { to: string; label: string; icon?: ReactNode }

export function SideLayout({ title, nav }: { title: string; nav: NavItem[] }) {
  const { user, logout } = useAuthStore();
  return (
    <div className="min-h-screen bg-theater-black text-white lg:grid lg:grid-cols-[292px_1fr]">
      <SkipLink />
      <aside className="sticky top-0 z-40 border-b border-white/10 bg-[#070708]/95 p-4 backdrop-blur-xl lg:h-screen lg:border-b-0 lg:border-r lg:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 lg:mb-8">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-theater-gold text-theater-black shadow-glow"><Ticket/></span><div><p className="font-bold">Tiatru</p><p className="text-xs text-white/45">{title}</p></div></div>
          <Menu className="text-white/50 lg:hidden" />
        </div>
        <nav className="theater-scrollbar flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => cn('group flex shrink-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition hover:bg-white/10 lg:w-full', isActive ? 'bg-theater-gold text-theater-black font-semibold shadow-glow' : 'text-white/65')}>
              <span className="shrink-0">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
          <Button className="mt-4 w-full" variant="secondary" onClick={logout}><LogOut size={16}/> Çıkış</Button>
      </aside>
      <main id="main-content" tabIndex={-1} className="min-w-0 p-4 outline-none md:p-8"><Outlet /></main>
    </div>
  );
}
