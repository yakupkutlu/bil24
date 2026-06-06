import { useMemo, useState } from 'react';
import { AlertTriangle, Banknote, CheckCircle2, CreditCard, Search } from 'lucide-react';
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
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { paymentsService } from '@/services/payments.service';
import { useApiResource } from '@/hooks/useApiResource';

export function AdminPaymentsPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const paymentsQuery = useApiResource(['admin-payments', { query, status }], () => paymentsService.list({ search: query || undefined, status: status === 'ALL' ? undefined : status }));
  const payments = paymentsQuery.data?.data ?? [];
  const filtered = useMemo(() => payments.filter((payment) => {
    const matchesQuery = `${payment.paymentNumber} ${payment.providerTransactionId ?? ''} ${payment.provider}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === 'ALL' || payment.status === status;
    return matchesQuery && matchesStatus;
  }), [payments, query, status]);

  if (paymentsQuery.isLoading) return <LoadingState text="Ödemeler backendden yükleniyor..." />;
  if (paymentsQuery.isError) return <ErrorState title="Backend ödemeleri başarısız" text="GET /api/payments geçerli bir ödeme listesi döndürmedi." />;

  const successfulTotal = payments.filter((payment) => payment.status === 'SUCCESS').reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <main className="space-y-8">
      <AdminPageHeader eyebrow="Ödeme yönetimi" title="Backendden gelen her işlemi takip et." description="Başarılı, başarısız, bekleyen, iade edilen, nakit ve sağlayıcı tabanlı işlemleri aranabilir IDlerle izle." actions={<AdminCrudStatus source={paymentsQuery.data?.source} />} />
      <div className="grid gap-4 md:grid-cols-4">
        <AdminMetricCard title="Başarılı" value={formatCurrency(successfulTotal)} icon={<CheckCircle2 size={20}/>} hint="Ödenmiş gelir" />
        <AdminMetricCard title="Bekleyen" value={payments.filter((payment) => payment.status === 'PENDING').length} icon={<Banknote size={20}/>} hint="İşlem gerekli" />
        <AdminMetricCard title="Başarısız" value={payments.filter((payment) => payment.status === 'FAILED').length} icon={<AlertTriangle size={20}/>} hint="Sağlayıcı hataları" />
        <AdminMetricCard title="Sağlayıcılar" value={[...new Set(payments.map((payment) => payment.provider))].join(' / ') || '—'} icon={<CreditCard size={20}/>} hint="Backend yapılandırıldı" />
      </div>
      <AdminSectionCard title="Ödeme defteri" description="Tüm satırlar GET /api/payments üzerinden gelir.">
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_160px]">
          <Input placeholder="Ödeme veya sağlayıcı ID ara" icon={<Search size={18}/>} value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Tüm durumlar</option><option>SUCCESS</option><option>PENDING</option><option>FAILED</option><option>REFUNDED</option></Select>
          <Button variant="outline" onClick={() => setStatus('ALL')}>Temizle</Button>
        </div>
        {filtered.length ? <AdminDataTable columns={['Numara','Sağlayıcı','Yöntem','Tutar','Para birimi','Durum','İşlem','Tarih']} rows={filtered.map((payment) => [payment.paymentNumber, payment.provider, payment.method, formatCurrency(payment.amount), payment.currency, <Badge key={payment.id}>{payment.status}</Badge>, payment.providerTransactionId ?? '-', formatDateTime(payment.createdAt)])}/> : <EmptyState title="Ödeme yok" text="Backend bu filtre için ödeme döndürmedi." />}
        <AdminEndpointHint>Connected action: GET /api/payments. İade/payment mutations happen through /api/refunds and /api/payments/checkout.</AdminEndpointHint>
      </AdminSectionCard>
    </main>
  );
}
