import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, Ticket, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth.store';
import { roleHome } from '@/constants/roles';
import { TheaterBackground } from '@/components/brand/TheaterBackground';
import { SkipLink } from '@/components/layout/SkipLink';

export function PublicLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const nav = [
    { to: '/', label: 'Ana Sayfa' },
    { to: '/events', label: 'Oyunlar' },
    { to: '/verify-ticket', label: 'Bilet Doğrula' }
  ];

  return (
    <TheaterBackground>
      <SkipLink />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-theater-black/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="group flex items-center gap-3 text-xl font-bold">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-theater-gold to-yellow-700 text-theater-black shadow-glow transition group-hover:rotate-3 group-hover:scale-105">
              <Ticket size={22} />
            </span>
            <span>
              Bilet Al
            </span>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.04] p-1 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-theater-gold text-theater-black shadow-glow' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <span className="hidden items-center gap-2 rounded-full border border-theater-gold/20 bg-theater-gold/10 px-3 py-2 text-xs text-theater-ivory lg:inline-flex">
              <Sparkles size={14} /> Perde bu gece açılıyor
            </span>
            {isAuthenticated && user ? (
              <>
                <Link to={roleHome[user.role]}><Button variant="secondary">Panel</Button></Link>
                <Button variant="ghost" onClick={logout}>Çıkış</Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost">Giriş</Button></Link>
                <Link to="/register"><Button variant="gold">Kayıt Ol</Button></Link>
              </>
            )}
          </div>
          <Menu className="md:hidden" />
        </div>
      </header>
      <div id="main-content" tabIndex={-1}>
        <Outlet />
      </div>
      <Footer />
    </TheaterBackground>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/35 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[1.2fr_.8fr_.8fr_.8fr]">
        <div>
          <h3 className="font-serif text-3xl font-bold gold-text">Tiatru</h3>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">Modern tiyatro bilet deneyimi: oyun keşfi, görsel koltuk seçimi, QR bilet ve sahne giriş kontrolü.</p>
        </div>
        {['Seyirci', 'Kurumsal', 'Destek'].map((column) => (
          <div key={column}>
            <h4 className="font-semibold text-theater-ivory">{column}</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/55">
              <li>Etkinlikler</li>
              <li>Biletler</li>
              <li>İletişim</li>
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
