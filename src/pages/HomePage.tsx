import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { eventsApi, sessionsApi } from '../lib/api';
import type { Session, Event } from '../types';
import { formatCurrency, formatDate, formatTime } from '../lib/utils';

type SessionWithDetails = Omit<Session, 'event' | 'hall'> & {
  event?: { id: string; title: string };
  hall?: { id: string; name: string };
};

export default function HomePage() {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [allSessions, allEvents] = await Promise.all([
        sessionsApi.list({ status: 'active', session_date: today }),
        eventsApi.list(true),
      ]);
      setSessions((allSessions as SessionWithDetails[]).slice(0, 12));
      setFeaturedEvents(allEvents.slice(0, 6));
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-8 md:p-16 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute bottom-10 left-10 w-60 h-60 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-accent-400" />
            <span className="text-accent-300 font-medium text-sm uppercase tracking-wider">BiletOS ile Kesintisiz Deneyim</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Etkinlik Biletlerinizi<br />Kolayca Alın
          </h1>
          <p className="text-primary-100 text-lg mb-8 leading-relaxed">
            Tiyatro, konser, sinema ve daha fazlası... En iyi etkinliklere sahip olmak için doğru yerdesiniz.
            Koltuk seçin, biletinizi alın, QR kod ile giriş yapın.
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
          >
            Etkinlikleri Keşfet
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Öne Çıkan Etkinlikler</h2>
            <Link to="/events" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              Tümünü Gör <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map(event => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="group rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  {event.poster_url ? (
                    <img
                      src={event.poster_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <Calendar className="w-12 h-12 text-white/80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {event.category && (
                    <span className="absolute top-3 right-3 bg-accent-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {event.category}
                    </span>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-lg leading-tight">{event.title}</h3>
                    {event.slogan && (
                      <p className="text-white/80 text-sm mt-1">{event.slogan}</p>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(event.start_date)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Sessions */}
      {sessions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Yaklaşan Seanslar</h2>
            <Link to="/sessions" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              Tüm Program <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map(session => (
              <Link
                key={session.id}
                to={`/events/${session.event_id}`}
                className="card flex flex-col gap-3 hover:border-primary-300 dark:hover:border-primary-700"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{session.event?.title}</h3>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(session.session_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(session.start_time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {session.hall?.name}
                  </span>
                </div>
                <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(session.base_price)}
                  </span>
                  <span className="text-primary-600 text-sm font-medium flex items-center gap-1">
                    Bilet Al <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!loading && sessions.length === 0 && featuredEvents.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">Henüz etkinlik bulunmuyor</h3>
          <p className="text-gray-500 dark:text-gray-500">Yakında yeni etkinlikler eklenecek!</p>
        </div>
      )}
    </div>
  );
}
