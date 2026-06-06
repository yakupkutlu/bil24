import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminCrudStatus } from '@/components/admin/AdminCrudStatus';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { eventsService } from '@/services/events.service';
import { hallsService } from '@/services/halls.service';
import { showtimesService } from '@/services/showtimes.service';
import { useApiResource } from '@/hooks/useApiResource';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import type { ShowtimeStatus } from '@/types';

export function AdminShowtimeFormPage() {
  const { id } = useParams(); const navigate = useNavigate(); const isEditing = Boolean(id);
  const [form, setForm] = useState({ event: '', hall: '', date: '', startTime: '20:00', endTime: '22:00', status: 'SCHEDULED' as ShowtimeStatus, VIP: 500, STANDARD: 300, STUDENT: 180 });
  const eventsQuery = useApiResource(['admin-showtime-events'], () => eventsService.list());
  const hallsQuery = useApiResource(['admin-showtime-halls'], () => hallsService.list());
  const showtimeQuery = useApiResource(['admin-showtime-form', id], () => showtimesService.get(id ?? ''), undefined, { enabled: Boolean(id) });
  useEffect(() => { const show = showtimeQuery.data?.data; if (!show) return; setForm({ event: typeof show.event === 'string' ? show.event : show.event.id, hall: typeof show.hall === 'string' ? show.hall : show.hall.id, date: String(show.date).slice(0,10), startTime: show.startTime, endTime: show.endTime, status: show.status, VIP: Number(show.pricing?.VIP ?? 0), STANDARD: Number(show.pricing?.STANDARD ?? 0), STUDENT: Number(show.pricing?.STUDENT ?? 0) }); }, [showtimeQuery.data]);
  const saveMutation = useAdminMutation<any, any>({ mutationFn: (payload) => isEditing && id ? showtimesService.update(id, payload) : showtimesService.create(payload), successMessage: isEditing ? 'Seans güncellendi.' : 'Seans oluşturuldu.', invalidate: ['admin-showtimes'], onSuccess: () => navigate('/admin/showtimes') });
  function submit(e: FormEvent) { e.preventDefault(); saveMutation.mutate({ event: form.event, eventId: form.event, hall: form.hall, hallId: form.hall, date: form.date, startTime: form.startTime, endTime: form.endTime, status: form.status, pricing: { VIP: form.VIP, STANDARD: form.STANDARD, STUDENT: form.STUDENT } }); }
  if (eventsQuery.isLoading || hallsQuery.isLoading || showtimeQuery.isLoading) return <LoadingState text="Backend form verisi yükleniyor..." />;
  if (eventsQuery.isError) return <ErrorState title="Etkinlikler yüklenemedi" text={(eventsQuery.error as Error).message} />;
  if (hallsQuery.isError) return <ErrorState title="Salonlar yüklenemedi" text={(hallsQuery.error as Error).message} />;
  const events = eventsQuery.data?.data ?? []; const halls = hallsQuery.data?.data ?? [];
  return <form onSubmit={submit} className="space-y-6"><AdminPageHeader eyebrow={isEditing?'Seansı düzenle':'Seans oluştur'} title="Backend seans formu" description="Canlı etkinlik ve salon seçenekleriyle POST/PUT /api/showtimes kullanır." actions={<><AdminCrudStatus source="api" isMutating={saveMutation.isPending}/><Button type="submit"><Save size={16}/>Kaydet</Button></>} /><Card><CardContent className="grid gap-4 p-6 md:grid-cols-2"><Select label="Etkinlik" value={form.event} onChange={(e)=>setForm({...form,event:e.target.value})} required><option value="">Select event</option>{events.map(event=><option key={event.id} value={event.id}>{event.title}</option>)}</Select><Select label="Salon" value={form.hall} onChange={(e)=>setForm({...form,hall:e.target.value})} required><option value="">Select hall</option>{halls.map(hall=><option key={hall.id} value={hall.id}>{hall.name}</option>)}</Select><Input label="Tarih" type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})}/><Input label="Başlangıç" value={form.startTime} onChange={(e)=>setForm({...form,startTime:e.target.value})}/><Input label="Bitiş" value={form.endTime} onChange={(e)=>setForm({...form,endTime:e.target.value})}/><Select label="Durum" value={form.status} onChange={(e)=>setForm({...form,status:e.target.value as ShowtimeStatus})}>{['SCHEDULED','ON_SALE','SOLD_OUT','CANCELLED','COMPLETED'].map(x=><option key={x}>{x}</option>)}</Select><Input label="VIP fiyatı" type="number" value={form.VIP} onChange={(e)=>setForm({...form,VIP:Number(e.target.value)})}/><Input label="Standart fiyat" type="number" value={form.STANDARD} onChange={(e)=>setForm({...form,STANDARD:Number(e.target.value)})}/><Input label="Öğrenci fiyatı" type="number" value={form.STUDENT} onChange={(e)=>setForm({...form,STUDENT:Number(e.target.value)})}/></CardContent></Card></form>;
}
