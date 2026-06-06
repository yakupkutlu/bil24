import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminCrudStatus } from '@/components/admin/AdminCrudStatus';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { showtimesService } from '@/services/showtimes.service';
import { useApiResource } from '@/hooks/useApiResource';
import { useToast } from '@/components/ui/ToastProvider';
import type { ShowtimeStatus } from '@/types';

export function AdminShowtimesPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | ShowtimeStatus>('ALL');
  const { showToast } = useToast();
  const qc = useQueryClient();
  const showtimesQuery = useApiResource(['admin-showtimes', { query, status }], () => showtimesService.list({ search: query || undefined, status: status === 'ALL' ? undefined : status }));
  const removeMutation = useMutation({ mutationFn: (id: string) => showtimesService.remove(id), onSuccess: () => { showToast('Seans silindi.'); qc.invalidateQueries({ queryKey: ['admin-showtimes'] }); }, onError: (e) => showToast(e instanceof Error ? e.message : 'Silme başarısız', 'error') });
  const statusMutation = useMutation({ mutationFn: ({ id, next }: { id: string; next: ShowtimeStatus }) => showtimesService.updateStatus(id, next), onSuccess: () => { showToast('Seans durumu güncellendi.'); qc.invalidateQueries({ queryKey: ['admin-showtimes'] }); }, onError: (e) => showToast(e instanceof Error ? e.message : 'Durum güncellenemedi', 'error') });
  if (showtimesQuery.isLoading) return <LoadingState text="Loading backend showtimes..." />;
  if (showtimesQuery.isError) return <ErrorState title="Seanslar yüklenemedi" text={(showtimesQuery.error as Error).message} />;
  const showtimes = showtimesQuery.data?.data ?? [];
  return <main className="space-y-6"><AdminPageHeader eyebrow="Seans yönetimi" title="Canlı seans CRUD" description="/api/showtimes ve /api/events/:eventId/showtimes kullanır. Seanslar sadece backendden gelir." actions={<><AdminCrudStatus source={showtimesQuery.data?.source} /><Button asChild><Link to="/admin/showtimes/create"><CalendarPlus size={16} />Oluştur</Link></Button></>} /><div className="grid gap-3 md:grid-cols-[1fr_220px]"><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Seans ara" /><Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>{['ALL','SCHEDULED','ON_SALE','SOLD_OUT','CANCELLED','COMPLETED'].map((item)=><option key={item}>{item}</option>)}</Select></div>{showtimes.length ? <div className="space-y-3">{showtimes.map((show) => { const event = typeof show.event === 'string' ? show.event : show.event.title; const hall = typeof show.hall === 'string' ? show.hall : show.hall.name; return <div key={show.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4 md:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap gap-2"><Badge>{show.status}</Badge><span className="text-sm text-white/45">{show.date} · {show.startTime}</span></div><h3 className="mt-2 font-serif text-2xl text-white">{event}</h3><p className="text-sm text-white/55">{hall}</p></div><div className="flex flex-wrap items-center gap-2"><Button asChild size="sm" variant="outline"><Link to={`/admin/showtimes/${show.id}/edit`}>Düzenle</Link></Button><Button size="sm" variant="secondary" onClick={() => statusMutation.mutate({ id: show.id, next: show.status === 'ON_SALE' ? 'SCHEDULED' : 'ON_SALE' })}>Değiştir sale</Button><Button size="sm" variant="danger" onClick={() => removeMutation.mutate(show.id)}><Trash2 size={15}/></Button></div></div>; })}</div> : <EmptyState title="Seans yok" text="Backend seans döndürmedi." />}</main>;
}
