import { Link } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminCrudStatus } from '@/components/admin/AdminCrudStatus';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { eventsService } from '@/services/events.service';
import { useApiResource } from '@/hooks/useApiResource';
import { useToast } from '@/components/ui/ToastProvider';

export function AdminEventsPage() {
  const [query,setQuery]=useState(''); const [status,setStatus]=useState('ALL'); const {showToast}=useToast(); const qc=useQueryClient();
  const eventsQuery=useApiResource(['admin-events',{query,status}],()=>eventsService.list({search:query||undefined,status:status==='ALL'?undefined:status}));
  const removeMutation=useMutation({mutationFn:(id:string)=>eventsService.remove(id),onSuccess:()=>{showToast('Etkinlik silindi');qc.invalidateQueries({queryKey:['admin-events']});},onError:(e)=>showToast(e instanceof Error?e.message:'Silme başarısız','error')});
  const statusMutation=useMutation({mutationFn:({id,next}:{id:string;next:any})=>eventsService.updateStatus(id,next),onSuccess:()=>{showToast('Durum güncellendi');qc.invalidateQueries({queryKey:['admin-events']});},onError:(e)=>showToast(e instanceof Error?e.message:'Durum güncellenemedi','error')});
  if(eventsQuery.isLoading)return <LoadingState text="Backend etkinlikleri yükleniyor..."/>; if(eventsQuery.isError)return <ErrorState title="Etkinlikler yüklenemedi" text={(eventsQuery.error as Error).message}/>;
  const events=eventsQuery.data?.data??[];
  return <main className="space-y-6"><AdminPageHeader eyebrow="Etkinlik yönetimi" title="Backend etkinlik CRUD" description="GET/POST/PUT/PATCH/DELETE /api/events kullanır." actions={<><AdminCrudStatus source={eventsQuery.data?.source}/><Button asChild><Link to="/admin/events/create"><Plus size={16}/>Oluştur</Link></Button></>}/><div className="grid gap-3 md:grid-cols-[1fr_220px]"><Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Etkinlik ara" icon={<Search size={16}/>}/><Select value={status} onChange={(e)=>setStatus(e.target.value)}>{['ALL','DRAFT','PUBLISHED','ARCHIVED','CANCELLED'].map(s=><option key={s}>{s}</option>)}</Select></div>{events.length?<div className="space-y-3">{events.map(event=><div key={event.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4 md:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap gap-2"><Badge>{event.status}</Badge><span className="text-sm text-white/45">{event.slug}</span></div><h3 className="mt-2 font-serif text-2xl text-white">{event.title}</h3><p className="text-sm text-white/55">{event.category} · {event.language}</p></div><div className="flex flex-wrap items-center gap-2"><Button asChild size="sm" variant="outline"><Link to={`/admin/events/${event.id}/edit`}>Düzenle</Link></Button><Button size="sm" variant="secondary" onClick={()=>statusMutation.mutate({id:event.id,next:event.status==='PUBLISHED'?'DRAFT':'PUBLISHED'})}>Değiştir</Button><Button size="sm" variant="danger" onClick={()=>removeMutation.mutate(event.id)}><Trash2 size={15}/></Button></div></div>)}</div>:<EmptyState title="Etkinlik yok" text="Backend etkinlik döndürmedi."/>}</main>;
}
