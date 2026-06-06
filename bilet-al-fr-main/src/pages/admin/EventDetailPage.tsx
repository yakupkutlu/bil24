import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, useTranslation } from '../../utils/api';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}`).then(r => r.data),
  });

  const { data: sessions } = useQuery({
    queryKey: ['event-sessions', id],
    queryFn: () => api.get(`/sessions?event_id=${id}`).then(r => r.data),
  });

  if (isLoading) return <div className="text-center py-16 text-gray-400">{t('common.loading')}</div>;
  if (!event) return <div className="text-center py-16 text-gray-400">{t('common.notFound')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/events" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ← {t('nav.events')}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Poster */}
        <div className="lg:col-span-1">
          <div className="card p-0 overflow-hidden">
            {event.poster_url ? (
              <img src={event.poster_url} alt={event.title} className="w-full h-64 object-cover" />
            ) : (
              <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-6xl">🎭</div>
            )}
            <div className="p-4">
              <span className={`badge ${event.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                {t(`events.status.${event.status}`)}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{event.title}</h1>
            {event.slogan && <p className="text-primary-600 font-medium mb-3">{event.slogan}</p>}
            {event.description && <p className="text-gray-600 dark:text-gray-400">{event.description}</p>}
          </div>

          {/* Sessions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('nav.sessions')}</h2>
              <Link to={`/admin/sessions/new?event_id=${id}`} className="btn-primary btn-sm">{t('sessions.addSession')}</Link>
            </div>
            <div className="space-y-3">
              {(sessions?.data ?? []).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(s.session_date).toLocaleDateString('tr-TR')} — {s.start_time}
                    </p>
                    <p className="text-sm text-gray-500">{s.venue?.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {s.sold_count}/{s.capacity} {t('sessions.sold')}
                    </span>
                    <Link to={`/admin/sessions/${s.id}`} className="btn-sm btn-outline">{t('common.detail')}</Link>
                  </div>
                </div>
              ))}
              {(sessions?.data ?? []).length === 0 && (
                <p className="text-gray-400 text-center py-4">{t('common.noData')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
