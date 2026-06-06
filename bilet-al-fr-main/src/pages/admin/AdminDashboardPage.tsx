import { CalendarDays, CreditCard, RotateCcw, Ticket, UsersRound } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminMetricCard } from '@/components/admin/AdminMetricCard';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { reportsService } from '@/services/reports.service';
import { eventsService } from '@/services/events.service';
import { useApiResource } from '@/hooks/useApiResource';
import { normalizeDashboard } from '@/utils/apiAdapters';

export function AdminDashboardPage() {
  const dashboardQuery = useApiResource(['admin-dashboard-report'], async () => normalizeDashboard(await reportsService.dashboard()));
  const eventsQuery = useApiResource(['admin-dashboard-events'], () => eventsService.list({ limit: 5 }));
  if (dashboardQuery.isLoading || eventsQuery.isLoading) return <LoadingState text="Backend admin paneli yükleniyor..." />;
  if (dashboardQuery.isError) return <ErrorState title="Panel raporu yüklenemedi" text={(dashboardQuery.error as Error).message} />;
  const report = dashboardQuery.data?.data;
  const events = eventsQuery.data?.data ?? [];
  return <main className="space-y-6"><AdminPageHeader eyebrow="Admin kontrol merkezi" title="Canlı backend kontrol paneli" description="Metrikler /api/reports/dashboard üzerinden gelir. Etkinlik önizlemesi /api/events üzerinden gelir. Panel verisi sadece backendden alınır." /><div className="grid gap-4 md:grid-cols-5"><AdminMetricCard title="Gelir" value={report?.totalRevenue ?? 0} icon={<CreditCard />} /><AdminMetricCard title="Biletler" value={report?.ticketsSold ?? 0} icon={<Ticket />} /><AdminMetricCard title="Doluluk" value={`${report?.occupancyRate ?? 0}%`} icon={<CalendarDays />} /><AdminMetricCard title="İadeler" value={report?.refundRequests ?? 0} icon={<RotateCcw />} /><AdminMetricCard title="Yeni kullanıcılar" value={report?.newUsers ?? 0} icon={<UsersRound />} /></div><AdminSectionCard title="Backend etkinlikleri" description="Backendden dönen ilk canlı etkinlikler.">{events.length ? <div className="space-y-2">{events.map((event)=><div key={event.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] p-4"><div><p className="font-semibold text-white">{event.title}</p><p className="text-sm text-white/45">{event.category} · {event.slug}</p></div><Badge>{event.status}</Badge></div>)}</div> : <EmptyState title="Etkinlik yok" text="/admin/events/create üzerinden etkinlik oluştur." />}</AdminSectionCard></main>;
}
