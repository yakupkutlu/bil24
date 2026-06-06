import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Search, Timer, XCircle } from 'lucide-react';
import { AdminMetricCard } from '@/components/admin/AdminMetricCard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { AdminCrudStatus, AdminEndpointHint } from '@/components/admin/AdminCrudStatus';
import { AdminDataTable } from '@/components/dashboard/AdminDataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/States';
import { formatCurrency } from '@/utils/formatters';
import { refundsService } from '@/services/refunds.service';
import { useApiResource } from '@/hooks/useApiResource';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import type { Refund } from '@/types';

export function AdminRefundsPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const refundsQuery = useApiResource(['admin-refunds', { query, status }], () => refundsService.list({ search: query || undefined, status: status === 'ALL' ? undefined : status }));
  const refunds = refundsQuery.data?.data ?? [];

  const approveMutation = useAdminMutation<string, Refund>({ mutationFn: (id) => refundsService.approve(id), successMessage: 'İade onaylandı.', invalidate: ['admin-refunds'] });
  const rejectMutation = useAdminMutation<{ id: string; reason?: string }, Refund>({ mutationFn: ({ id, reason }) => refundsService.reject(id, reason), successMessage: 'İade reddedildi.', invalidate: ['admin-refunds'] });
  const processMutation = useAdminMutation<string, Refund>({ mutationFn: (id) => refundsService.process(id), successMessage: 'İade işlemi başlatıldı.', invalidate: ['admin-refunds'] });

  const filtered = useMemo(() => refunds.filter((refund) => {
    const haystack = `${refund.refundNumber} ${refund.reason} ${refund.status}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === 'ALL' || refund.status === status);
  }), [refunds, query, status]);

  if (refundsQuery.isLoading) return <LoadingState text="İadeler backendden yükleniyor..." />;
  if (refundsQuery.isError) return <ErrorState title="Backend iadeleri başarısız" text="GET /api/refunds geçerli bir iade listesi döndürmedi." />;

  const requested = refunds.filter((refund) => refund.status === 'REQUESTED').length;
  const processing = refunds.filter((refund) => refund.status === 'PROCESSING').length;
  const refundedTotal = refunds.filter((refund) => refund.status === 'REFUNDED').reduce((sum, refund) => sum + refund.amount, 0);
  const isMutating = approveMutation.isPending || rejectMutation.isPending || processMutation.isPending;

  return (
    <main className="space-y-8">
      <AdminPageHeader eyebrow="İade yönetimi" title="İade kararlarını canlı backend verisiyle incele." description="Bilet iptal kuralları ve finans politikasına göre iade taleplerini onayla, reddet, işle ve takip et." actions={<AdminCrudStatus source={refundsQuery.data?.source} isMutating={isMutating} />} />
      <div className="grid gap-4 md:grid-cols-4">
        <AdminMetricCard title="Talepler" value={requested} icon={<RotateCcw size={20}/>} hint="Karar bekliyor" />
        <AdminMetricCard title="İşleniyor" value={processing} icon={<Timer size={20}/>} hint="Sağlayıcı akışı" />
        <AdminMetricCard title="Toplam iade" value={formatCurrency(refundedTotal)} icon={<CheckCircle2 size={20}/>} hint="Tamamlandı" />
        <AdminMetricCard title="Reddedildi" value={refunds.filter((refund) => refund.status === 'REJECTED').length} icon={<XCircle size={20}/>} hint="Politika gereği reddedildi" />
      </div>
      <AdminSectionCard title="İade kuyruğu" description="İşlemler canlı finans endpointlerini çağırır.">
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_160px]">
          <Input placeholder="İade veya sebep ara" icon={<Search size={18}/>} value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Tüm durumlar</option><option>REQUESTED</option><option>APPROVED</option><option>REJECTED</option><option>PROCESSING</option><option>REFUNDED</option><option>FAILED</option></Select>
          <Button variant="outline" onClick={() => setStatus('ALL')}>Temizle</Button>
        </div>
        {filtered.length ? <AdminDataTable columns={['İade','Tutar','Sebep','Durum','İşlemler']} rows={filtered.map((refund) => [
          refund.refundNumber,
          formatCurrency(refund.amount),
          refund.reason,
          <Badge key={refund.id}>{refund.status}</Badge>,
          <div key={`${refund.id}-actions`} className="flex flex-wrap gap-2"><Button size="sm" onClick={() => approveMutation.mutate(refund.id)} disabled={refund.status !== 'REQUESTED'}>Onayla</Button><Button size="sm" variant="outline" onClick={() => rejectMutation.mutate({ id: refund.id, reason: 'Admin panelinden reddedildi' })} disabled={['REFUNDED','REJECTED'].includes(refund.status)}>Reddet</Button><Button size="sm" variant="outline" onClick={() => processMutation.mutate(refund.id)} disabled={!['APPROVED','PROCESSING'].includes(refund.status)}>İşle</Button></div>
        ])}/> : <EmptyState title="İade yok" text="Backend bu filtre için iade talebi döndürmedi." />}
        <AdminEndpointHint>Connected actions: GET /api/refunds, PATCH /api/refunds/:id/approve, /reject, /process.</AdminEndpointHint>
      </AdminSectionCard>
    </main>
  );
}
