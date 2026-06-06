import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, FileSpreadsheet, FileText, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { AdminMetricCard } from '@/components/admin/AdminMetricCard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminProgressBar } from '@/components/admin/AdminProgressBar';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { AdminCrudStatus } from '@/components/admin/AdminCrudStatus';
import { Button } from '@/components/ui/Button';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/States';
import { formatCurrency } from '@/utils/formatters';
import { reportsService } from '@/services/reports.service';
import { useApiResource } from '@/hooks/useApiResource';
import { listPayload, pickPayload } from '@/utils/apiAdapters';

const tooltipStyle = { background: '#12070A', border: '1px solid rgba(184,134,11,.35)', borderRadius: 16 };

type ChartRow = { name: string; sales?: number; revenue?: number; tickets?: number; value?: number };

const normalizeRows = (payload: unknown, keys: string[]): ChartRow[] => listPayload(payload, keys).map((value, index) => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    name: String(row.name ?? row.label ?? row.date ?? row.eventTitle ?? row.hallName ?? `Öğe ${index + 1}`),
    sales: Number(row.sales ?? row.revenue ?? row.total ?? row.amount ?? 0),
    revenue: Number(row.revenue ?? row.sales ?? row.total ?? row.amount ?? 0),
    tickets: Number(row.tickets ?? row.count ?? row.ticketsSold ?? 0),
    value: Number(row.value ?? row.occupancyRate ?? row.rate ?? row.count ?? 0)
  };
});

export function AdminReportsPage() {
  const reportsQuery = useApiResource(['admin-reports-live'], async () => {
    const [dashboardRaw, salesRaw, eventsRaw, occupancyRaw, usersRaw] = await Promise.allSettled([
      reportsService.dashboard(),
      reportsService.sales(),
      reportsService.events(),
      reportsService.occupancy(),
      reportsService.users()
    ]);
    const dashboard = dashboardRaw.status === 'fulfilled' ? pickPayload(dashboardRaw.value, ['dashboard', 'report']) : undefined;
    return {
      dashboard: dashboard as Partial<{ totalRevenue: number; ticketsSold: number; occupancyRate: number; refundRequests: number; newUsers: number; upcomingShows: number }> | undefined,
      sales: salesRaw.status === 'fulfilled' ? normalizeRows(salesRaw.value, ['sales', 'items']) : [],
      eventSales: eventsRaw.status === 'fulfilled' ? normalizeRows(eventsRaw.value, ['events', 'items']) : [],
      occupancy: occupancyRaw.status === 'fulfilled' ? normalizeRows(occupancyRaw.value, ['occupancy', 'items']) : [],
      users: usersRaw.status === 'fulfilled' ? normalizeRows(usersRaw.value, ['users', 'items']) : []
    };
  });

  if (reportsQuery.isLoading) return <LoadingState text="Raporlar backendden yükleniyor..." />;
  if (reportsQuery.isError) return <ErrorState title="Backend raporları başarısız oldu" text="Bir veya daha fazla /api/reports endpointi başarısız oldu. Yerel rapor verisi kullanılmıyor." />;

  const reports = reportsQuery.data?.data;
  const dashboard = reports?.dashboard ?? {};
  const sales = reports?.sales ?? [];
  const eventSales = reports?.eventSales ?? [];
  const occupancy = reports?.occupancy ?? [];
  const users = reports?.users ?? [];

  return (
    <main className="space-y-8">
      <AdminPageHeader
        eyebrow="Raporlar ve analizler"
        title="Backend verisini karara dönüştür."
        description="Satış, etkinlik performansı, doluluk, müşteri, iade ve personel raporları yalnızca gerçek API’den yüklenir."
        actions={<><AdminCrudStatus source={reportsQuery.data?.source} /><Button variant="outline" onClick={() => reportsService.export('PDF')}><FileText size={18}/> PDF</Button><Button variant="outline" onClick={() => reportsService.export('Excel')}><FileSpreadsheet size={18}/> Excel</Button><Button onClick={() => reportsService.export('CSV')}><Download size={18}/> CSV</Button></>}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <AdminMetricCard title="Toplam gelir" value={formatCurrency(Number(dashboard.totalRevenue ?? 0))} icon={<TrendingUp size={20}/>} hint="/api/reports/dashboard" />
        <AdminMetricCard title="Satılan biletler" value={Number(dashboard.ticketsSold ?? 0)} icon={<PieChartIcon size={20}/>} hint="Backend toplamı" />
        <AdminMetricCard title="Doluluk" value={`${Number(dashboard.occupancyRate ?? 0)}%`} icon={<PieChartIcon size={20}/>} hint="Backend oranı" />
        <AdminMetricCard title="İade talepleri" value={Number(dashboard.refundRequests ?? 0)} icon={<TrendingUp size={20}/>} hint="Backend kuyruğu" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Satış raporu" description="GET /api/reports/sales.">{sales.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={sales}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)"/><XAxis dataKey="name" stroke="#F5E8C7"/><YAxis stroke="#F5E8C7"/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="sales" fill="#B8860B" radius={[14,14,0,0]}/></BarChart></ResponsiveContainer> : <EmptyState title="Satış raporu yok" text="Backend satış satırı döndürmedi." />}</ChartCard>
        <ChartCard title="Etkinlik satışları" description="GET /api/reports/events.">{eventSales.length ? <ResponsiveContainer width="100%" height={300}><AreaChart data={eventSales}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)"/><XAxis dataKey="name" stroke="#F5E8C7"/><YAxis stroke="#F5E8C7"/><Tooltip contentStyle={tooltipStyle}/><Area type="monotone" dataKey="revenue" stroke="#B8860B" fill="#B8860B33" strokeWidth={3}/></AreaChart></ResponsiveContainer> : <EmptyState title="Etkinlik raporu yok" text="Backend etkinlik raporu satırı döndürmedi." />}</ChartCard>
      </div>
      <AdminSectionCard title="Doluluk ve kullanıcılar" description="Yönetim incelemesi için backend rapor kartları.">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">{occupancy.length ? occupancy.map((hall) => <AdminProgressBar key={hall.name} label={hall.name} value={Number(hall.value ?? 0)}/>) : <EmptyState title="Doluluk raporu yok" text="GET /api/reports/occupancy satır döndürmedi." />}</div>
          <div className="space-y-4">{users.length ? users.map((row) => <AdminProgressBar key={row.name} label={`${row.name} · ${row.tickets ?? row.value ?? 0}`} value={Math.min(100, Number(row.value ?? row.tickets ?? 0))}/>) : <EmptyState title="Kullanıcı raporu yok" text="GET /api/reports/users satır döndürmedi." />}</div>
        </div>
      </AdminSectionCard>
    </main>
  );
}
