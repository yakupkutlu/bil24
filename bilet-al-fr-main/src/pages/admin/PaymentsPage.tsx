import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, useTranslation } from '../../utils/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PaymentsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState({ status: '', method: '', dateFrom: '', dateTo: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['payments', filter],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([k, v]) => { if (v) params.append(k, v); });
      return api.get(`/payments?${params}`).then(r => r.data);
    },
  });

  const pieData = [
    { name: t('payments.methods.cash'), value: data?.summary?.cash ?? 0 },
    { name: t('payments.methods.credit_card'), value: data?.summary?.credit_card ?? 0 },
    { name: t('payments.methods.bank_transfer'), value: data?.summary?.bank_transfer ?? 0 },
  ].filter(d => d.value > 0);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b'];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { completed: 'badge-green', pending: 'badge-yellow', failed: 'badge-red', refunded: 'badge-blue' };
    return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{t(`payments.status.${status}`)}</span>;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.payments')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">{t('payments.totalRevenue')}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">₺{Number(data?.summary?.total ?? 0).toLocaleString('tr-TR')}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">{t('payments.totalTransactions')}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data?.total ?? 0}</p>
        </div>
        <div className="card">
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `₺${Number(v).toLocaleString('tr-TR')}`} />
              <Legend iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <select className="form-input w-40" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">{t('common.allStatuses')}</option>
            <option value="completed">{t('payments.status.completed')}</option>
            <option value="pending">{t('payments.status.pending')}</option>
            <option value="failed">{t('payments.status.failed')}</option>
            <option value="refunded">{t('payments.status.refunded')}</option>
          </select>
          <select className="form-input w-40" value={filter.method} onChange={e => setFilter({ ...filter, method: e.target.value })}>
            <option value="">{t('common.allMethods')}</option>
            <option value="cash">{t('payments.methods.cash')}</option>
            <option value="credit_card">{t('payments.methods.credit_card')}</option>
            <option value="bank_transfer">{t('payments.methods.bank_transfer')}</option>
          </select>
          <input type="date" className="form-input w-40" value={filter.dateFrom} onChange={e => setFilter({ ...filter, dateFrom: e.target.value })} />
          <input type="date" className="form-input w-40" value={filter.dateTo} onChange={e => setFilter({ ...filter, dateTo: e.target.value })} />
        </div>

        {isLoading ? <div className="text-center py-8 text-gray-400">{t('common.loading')}</div> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('payments.transactionId')}</th>
                  <th>{t('tickets.customer')}</th>
                  <th>{t('payments.amount')}</th>
                  <th>{t('payments.paymentMethod')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.date')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((p: any) => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.transaction_id ?? p.id.slice(0, 8)}</td>
                    <td>{p.ticket?.customer_name}</td>
                    <td className="font-medium">₺{Number(p.amount).toLocaleString('tr-TR')}</td>
                    <td>{t(`payments.methods.${p.payment_method}`)}</td>
                    <td>{statusBadge(p.status)}</td>
                    <td>{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
                {(data?.data ?? []).length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-8">{t('common.noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
