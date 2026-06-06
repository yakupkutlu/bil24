import { useMemo, useState } from 'react';
import { History, Search, ShieldAlert, ShieldCheck, UserCog } from 'lucide-react';
import { AdminMetricCard } from '@/components/admin/AdminMetricCard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { AdminCrudStatus, AdminEndpointHint } from '@/components/admin/AdminCrudStatus';
import { AdminDataTable } from '@/components/dashboard/AdminDataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/States';
import { formatDateTime } from '@/utils/formatters';
import { auditLogsService } from '@/services/auditLogs.service';
import { useApiResource } from '@/hooks/useApiResource';

export type AuditRow = { id?: string; actor?: string | { fullName?: string; email?: string }; action: string; module: string; detail?: string; risk?: string; createdAt?: string; ipAddress?: string };

const actorLabel = (actor?: AuditRow['actor']) => typeof actor === 'string' ? actor : actor?.fullName ?? actor?.email ?? 'Sistem';

export function AdminAuditLogsPage() {
  const [query, setQuery] = useState('');
  const [risk, setRisk] = useState('ALL');
  const logsQuery = useApiResource(['admin-audit-logs', { query, risk }], () => auditLogsService.list({ search: query || undefined, risk: risk === 'ALL' ? undefined : risk }) as Promise<AuditRow[]>);
  const logs = logsQuery.data?.data ?? [];
  const filtered = useMemo(() => logs.filter((log) => `${actorLabel(log.actor)} ${log.action} ${log.module} ${log.detail ?? ''}`.toLowerCase().includes(query.toLowerCase()) && (risk === 'ALL' || log.risk === risk)), [logs, query, risk]);

  if (logsQuery.isLoading) return <LoadingState text="İşlem kayıtları backendden yükleniyor..." />;
  if (logsQuery.isError) return <ErrorState title="işlem kayıtları başarısız oldu" text="geçerli bir işlem kaydı listesi döndürmedi." />;

  return (
    <main className="space-y-8">
      <AdminPageHeader eyebrow="İşlem kayıtları" title="Her kritik backend işlemi görünür." description="Etkinlik oluşturan, fiyat değiştiren, rezervasyon iptal eden, iade onaylayan, bilet işaretleyen, rol güncelleyen veya ayar değiştiren kişileri takip et." actions={<AdminCrudStatus source={logsQuery.data?.source} />} />
      <div className="grid gap-4 md:grid-cols-4">
        <AdminMetricCard title="Kayıtlar" value={logs.length} icon={<History size={20}/>} hint="Backend etkinlikleri" />
        <AdminMetricCard title="Yüksek risk" value={logs.filter((log) => log.risk === 'High').length} icon={<ShieldAlert size={20}/>} hint="Finans/güvenlik" />
        <AdminMetricCard title="Rol değişiklikleri" value={logs.filter((log) => log.action?.includes('ROLE')).length} icon={<UserCog size={20}/>} hint="Erişim kontrolü" />
        <AdminMetricCard title="Ayarlar" value={logs.filter((log) => log.module === 'settings').length} icon={<ShieldCheck size={20}/>} hint="Sistem kuralları" />
      </div>
      <AdminSectionCard title="Denetim izi" description="Aktör, işlem, modül, detay veya risk seviyesine göre filtrele.">
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_160px]">
          <Input placeholder="Aktör, işlem veya modül ara" icon={<Search size={18}/>} value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select value={risk} onChange={(event) => setRisk(event.target.value)}><option value="ALL">Tüm risk seviyeleri</option><option value="Low">Düşük</option><option value="Medium">Orta</option><option value="High">Yüksek</option></Select>
          <Button variant="outline" onClick={() => setRisk('ALL')}>Temizle</Button>
        </div>
        {filtered.length ? <AdminDataTable columns={['Aktör','İşlem','Modül','Detaylar','Risk','Tarih']} rows={filtered.map((log, index) => [actorLabel(log.actor), log.action, log.module, log.detail ?? log.ipAddress ?? log.id ?? '-', <span key={`${log.action}-${index}`} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">{log.risk ?? 'Backend'}</span>, formatDateTime(log.createdAt ?? new Date().toISOString())])}/> : <EmptyState title="İşlem kaydı yok" text="Backend bu filtre için işlem kaydı döndürmedi." />}
      </AdminSectionCard>
    </main>
  );
}
