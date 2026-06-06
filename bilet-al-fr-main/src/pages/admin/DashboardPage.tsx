import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, useTranslation } from '../../utils/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function DashboardPage() {
  const { t } = useTranslation();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/reports/summary').then(r => r.data),
  });

  const { data: salesData } = useQuery({
    queryKey: ['dashboard-sales'],
    queryFn: () => api.get('/reports/daily-sales?days=7').then(r => r.data),
  });

  const statCards = [
    { label: t('dashboard.totalEvents'), value: stats?.total_events ?? '-', icon: '🎭', color: 'bg-blue-500', change: stats?.events_change },
    { label: t('dashboard.totalTickets'), value: stats?.total_tickets ?? '-', icon: '🎫', color: 'bg-green-500', change: stats?.tickets_change },
    { label: t('dashboard.totalRevenue'), value: stats?.total_revenue ? `₺${Number(stats.total_revenue).toLocaleString('tr-TR')}` : '-', icon: '💰', color: 'bg-yellow-500', change: stats?.revenue_change },
    { label: t('dashboard.activeUsers'), value: stats?.active_users ?? '-', icon: '👥', color: 'bg-purple-500', change: stats?.users_change },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.dashboard')}</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center text-2xl flex-shrink-0`}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              {card.change !== undefined && (
                <span className={`text-xs font-medium ${card.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {card.change >= 0 ? '▲' : '▼'} {Math.abs(card.change)}% {t('dashboard.vsLastWeek')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.weeklySales')}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={salesData?.data ?? []}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="total_amount" stroke="#6366f1" fill="url(#salesGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.ticketsByEvent')}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesData?.by_event ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="event_title" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="ticket_count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/admin/events/new', label: t('events.addEvent'), icon: '🎭' },
            { to: '/admin/venues/new', label: t('venues.addVenue'), icon: '🏛️' },
            { to: '/admin/sessions/new', label: t('sessions.addSession'), icon: '🗓️' },
            { to: '/operator/scan', label: t('tickets.scanTicket'), icon: '📷' },
          ].map((a, i) => (
            <Link key={i} to={a.to} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all">
              <span className="text-3xl">{a.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
