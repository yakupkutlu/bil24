import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, useTranslation } from '../../utils/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function ReportsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  const { data: daily } = useQuery({
    queryKey: ['report-daily', period],
    queryFn: () => api.get(`/reports/daily-sales?days=${period}`).then(r => r.data),
  });

  const { data: occupancy } = useQuery({
    queryKey: ['report-occupancy'],
    queryFn: () => api.get('/reports/occupancy').then(r => r.data),
  });

  const { data: revenue } = useQuery({
    queryKey: ['report-revenue'],
    queryFn: () => api.get('/reports/revenue-by-event').then(r => r.data),
  });

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.reports')}</h1>
        <div className="flex gap-2">
          {(['7', '30', '90'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`btn-sm ${period === p ? 'btn-primary' : 'btn-outline'}`}>
              {p} {t('reports.days')}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Sales */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reports.dailySales')}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={daily?.data ?? []}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="total_amount" name={t('reports.revenue')} stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="ticket_count" name={t('reports.tickets')} stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Event */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reports.revenueByEvent')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenue?.data ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="event_title" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(v: any) => `₺${Number(v).toLocaleString('tr-TR')}`} />
              <Bar dataKey="total_revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reports.occupancyRates')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={occupancy?.data ?? []} cx="50%" cy="50%" outerRadius={90} dataKey="occupancy_rate" nameKey="event_title" label={({ name, value }: any) => `${name}: %${Math.round(value)}`}>
                {(occupancy?.data ?? []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `%${Math.round(v)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
