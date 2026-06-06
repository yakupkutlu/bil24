import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, useTranslation } from '../../utils/api';

export default function MyTicketsPage() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => api.get('/tickets/my').then(r => r.data),
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('tickets.myTickets')}</h1>

        {isLoading ? (
          <div className="text-center py-16 text-gray-400">{t('common.loading')}</div>
        ) : (
          <div className="space-y-4">
            {(data?.data ?? []).map((ticket: any) => (
              <div key={ticket.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="flex">
                  {/* Left colored stripe */}
                  <div className={`w-2 ${ticket.status === 'active' ? 'bg-green-500' : ticket.status === 'used' ? 'bg-blue-500' : 'bg-red-500'}`} />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{ticket.session?.event?.title}</h3>
                        <p className="text-sm text-gray-500">{ticket.session?.venue?.name}</p>
                      </div>
                      <span className={`badge ${ticket.status === 'active' ? 'badge-green' : ticket.status === 'used' ? 'badge-blue' : 'badge-red'}`}>
                        {t(`tickets.status.${ticket.status}`)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-gray-400">{t('sessions.date')}</p>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {ticket.session?.session_date ? new Date(ticket.session.session_date).toLocaleDateString('tr-TR') : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">{t('sessions.time')}</p>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{ticket.session?.start_time ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">{t('tickets.seat')}</p>
                        <p className="font-medium font-mono text-gray-800 dark:text-gray-200">{ticket.seat?.seat_label ?? '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span className="font-mono text-xs text-gray-400">{ticket.ticket_number}</span>
                      {ticket.status === 'active' && (
                        <a href={`/api/tickets/${ticket.id}/download`} target="_blank" className="btn-sm btn-primary">
                          {t('tickets.download')}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(data?.data ?? []).length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎫</div>
                <p className="text-gray-500">{t('tickets.noTickets')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
