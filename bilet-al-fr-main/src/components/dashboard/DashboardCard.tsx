import { ReactNode } from 'react';
import { AdminMetricCard } from '@/components/admin/AdminMetricCard';

export function DashboardCard({ title, value, icon, hint }: { title: string; value: string | number; icon?: ReactNode; hint?: string }) {
  return <AdminMetricCard title={title} value={value} icon={icon} hint={hint} />;
}
