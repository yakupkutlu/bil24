import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Armchair, Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminCrudStatus } from '@/components/admin/AdminCrudStatus';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { hallsService } from '@/services/halls.service';
import { useApiResource } from '@/hooks/useApiResource';
import { useToast } from '@/components/ui/ToastProvider';

export function AdminHallsPage() {
  const { showToast } = useToast(); const qc = useQueryClient();
  const hallsQuery = useApiResource(['admin-halls'], () => hallsService.list());
  const removeMutation = useMutation({ mutationFn: (id: string) => hallsService.remove(id), onSuccess: () => { showToast('Salon silindi.'); qc.invalidateQueries({ queryKey: ['admin-halls'] }); }, onError: (e) => showToast(e instanceof Error ? e.message : 'Silme başarısız', 'error') });
  const generateMutation = useMutation({ mutationFn: (id: string) => hallsService.generateSeats(id), onSuccess: () => { showToast('Koltuklar oluşturuldu.'); qc.invalidateQueries({ queryKey: ['admin-halls'] }); }, onError: (e) => showToast(e instanceof Error ? e.message : 'Oluşturma başarısız', 'error') });
  if (hallsQuery.isLoading) return <LoadingState text="Backend salonları yükleniyor..." />;
  if (hallsQuery.isError) return <ErrorState title="Salonlar yüklenemedi" text={(hallsQuery.error as Error).message} />;
  const halls = hallsQuery.data?.data ?? [];
  return <main className="space-y-6"><AdminPageHeader eyebrow="Salon yönetimi" title="Backend salon ve koltuk haritası kontrolü" description="/api/halls ve koltuk haritası endpointlerini kullanır. Salonlar sadece backendden gelir." actions={<><AdminCrudStatus source={hallsQuery.data?.source} /><Button asChild><Link to="/admin/halls/create"><Plus size={16}/>Salon oluştur</Link></Button></>} />{halls.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{halls.map((hall)=><div key={hall.id} className="rounded-[1.75rem] border border-white/10 bg-white/[.045] p-5"><div className="flex items-center justify-between gap-3"><Badge>{hall.status}</Badge><Armchair className="text-theater-gold" /></div><h3 className="mt-4 font-serif text-3xl text-white">{hall.name}</h3><p className="mt-2 text-sm text-white/55">{hall.capacity} seats · {hall.rows} rows · {hall.seatsPerRow} per row</p><div className="mt-5 flex flex-wrap gap-2"><Button asChild size="sm"><Link to={`/admin/halls/${hall.id}/seats`}>Koltuk haritası</Link></Button><Button size="sm" variant="outline" onClick={() => generateMutation.mutate(hall.id)}>Koltukları oluştur</Button><Button size="sm" variant="danger" onClick={() => removeMutation.mutate(hall.id)}><Trash2 size={15}/></Button></div></div>)}</div> : <EmptyState title="Salon yok" text="Backend salon döndürmedi." />}</main>;
}
