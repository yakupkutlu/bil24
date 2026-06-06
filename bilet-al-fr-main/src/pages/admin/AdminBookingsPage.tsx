import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, XCircle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminCrudStatus } from '@/components/admin/AdminCrudStatus';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { bookingsService } from '@/services/bookings.service';
import { useApiResource } from '@/hooks/useApiResource';
import { useToast } from '@/components/ui/ToastProvider';
import type { BookingStatus } from '@/types';
import { money } from '@/utils/formatters';

export function AdminBookingsPage() {
  const [query,setQuery]=useState(''); const [status,setStatus]=useState<'ALL'|BookingStatus>('ALL'); const {showToast}=useToast(); const qc=useQueryClient();
  const bookingsQuery=useApiResource(['admin-bookings',{query,status}],()=>bookingsService.list({search:query||undefined,status:status==='ALL'?undefined:status}));
  const cancelMutation=useMutation({mutationFn:(id:string)=>bookingsService.cancel(id),onSuccess:()=>{showToast('Rezervasyon iptal edildi');qc.invalidateQueries({queryKey:['admin-bookings']});},onError:(e)=>showToast(e instanceof Error?e.message:'İptal başarısız oldu','error')});
  if(bookingsQuery.isLoading)return <LoadingState text="Backend rezervasyonları yükleniyor..."/>; if(bookingsQuery.isError)return <ErrorState title="Rezervasyonlar yüklenemedi" text={(bookingsQuery.error as Error).message}/>;
  const bookings=bookingsQuery.data?.data??[];
  return <main className="space-y-6"><AdminPageHeader eyebrow="Rezervasyon yönetimi" title="rezervasyonları"actions={<AdminCrudStatus source={bookingsQuery.data?.source}/>}/><div className="grid gap-3 md:grid-cols-[1fr_220px]"><Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Rezervasyon ara" icon={<Search size={16}/>}/><Select value={status} onChange={(e)=>setStatus(e.target.value as typeof status)}>{['ALL','PENDING','RESERVED','PAID','CANCELLED','EXPIRED','REFUNDED'].map(x=><option key={x}>{x}</option>)}</Select></div>{bookings.length?<div className="space-y-3">{bookings.map(booking=><div key={booking.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4 md:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap gap-2"><Badge>{booking.status}</Badge><span className="text-sm text-white/45">{booking.bookingNumber}</span></div><p className="mt-2 text-white">{booking.seats.length} koltuk · {money(booking.total)}</p><p className="text-sm text-white/45">{booking.source}</p></div><div className="flex flex-wrap items-center gap-2"><Button asChild size="sm" variant="outline"><Link to={`/admin/bookings/${booking.id}`}>Görüntüle</Link></Button><Button size="sm" variant="danger" disabled={booking.status==='CANCELLED'} onClick={()=>cancelMutation.mutate(booking.id)}><XCircle size={15}/>İptal</Button></div></div>)}</div>:<EmptyState title="Rezervasyon yok" text="Backend rezervasyon döndürmedi."/>}</main>;
}
