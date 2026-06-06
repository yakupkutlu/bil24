import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, useTranslation } from '../../utils/api';

export default function HomePage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['public-events', search],
    queryFn: () => api.get(`/events/public?search=${search}&status=active`).then(r => r.data),
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Bilet Sistemi</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/my-tickets" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">{t('tickets.myTickets')}</Link>
            <Link to="/login" className="btn-primary btn-sm">{t('auth.login')}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 py-16 px-4 text-white text-center">
        <h1 className="text-4xl font-bold mb-3">{t('home.hero')}</h1>
        <p className="text-primary-200 mb-8 max-w-xl mx-auto">{t('home.heroSub')}</p>
        <div className="max-w-md mx-auto">
          <input
            className="w-full px-4 py-3 rounded-xl text-gray-900 text-sm outline-none shadow-lg"
            placeholder={t('home.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Events */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('home.upcomingEvents')}</h2>
        {isLoading ? (
          <div className="text-center py-16 text-gray-400">{t('common.loading')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data?.data ?? []).map((ev: any) => (
              <Link key={ev.id} to={`/event/${ev.slug ?? ev.id}`} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="h-48 bg-gray-100 dark:bg-gray-800">
                  {ev.poster_url ? (
                    <img src={ev.poster_url} alt={ev.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🎭</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{ev.title}</h3>
                  {ev.slogan && <p className="text-sm text-primary-600 mb-2">{ev.slogan}</p>}
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{ev.description}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{ev.sessions_count ?? 0} {t('home.sessions')}</span>
                    <span className="text-xs font-medium text-primary-600">{t('home.viewEvent')} →</span>
                  </div>
                </div>
              </Link>
            ))}
            {(data?.data ?? []).length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">{t('home.noEvents')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
