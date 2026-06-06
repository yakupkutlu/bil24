import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminCrudStatus } from '@/components/admin/AdminCrudStatus';
import { SeatMapDesigner } from '@/components/seats/SeatMapDesigner';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { hallsService } from '@/services/halls.service';
import { useApiResource } from '@/hooks/useApiResource';
import { useToast } from '@/components/ui/ToastProvider';
import type { Seat } from '@/types';

export function AdminHallSeatsPage() {
  const { id } = useParams(); const { showToast } = useToast();
  const hallQuery = useApiResource(['admin-hall-seats', id], () => hallsService.get(id ?? ''), undefined, { enabled: Boolean(id) });
  const hall = hallQuery.data?.data; const [draftSeats, setDraftSeats] = useState<Seat[]>([]);
  useEffect(() => { if (hall) setDraftSeats(hall.seatMap ?? []); }, [hall]);
  const saveMutation = useMutation({ mutationFn: () => hallsService.updateSeats(id ?? '', draftSeats), onSuccess: () => showToast('Koltuk haritası backende kaydedildi.'), onError: (e) => showToast(e instanceof Error ? e.message : 'Kaydetme başarısız', 'error') });
  if (hallQuery.isLoading) return <LoadingState text="Backend salon koltukları yükleniyor..." />;
  if (hallQuery.isError) return <ErrorState title="Salon yüklenemedi" text={(hallQuery.error as Error).message} />;
  return <main className="space-y-6"><AdminPageHeader eyebrow="Koltuk tasarımcısı" title={`Koltuk haritası · ${hall?.name ?? ''}`} description="PUT /api/halls/:id/seats kullanır. Koltuk haritaları sadece backend üzerinden yüklenir ve kaydedilir." actions={<><AdminCrudStatus source={hallQuery.data?.source} isMutating={saveMutation.isPending}/><Button onClick={()=>saveMutation.mutate()}><Save size={16}/>Koltukları kaydet</Button></>} /><SeatMapDesigner initialSeats={draftSeats} onChange={setDraftSeats}/></main>;
}
