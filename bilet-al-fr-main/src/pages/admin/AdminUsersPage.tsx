import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminCrudStatus } from '@/components/admin/AdminCrudStatus';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { usersService } from '@/services/users.service';
import { useApiResource } from '@/hooks/useApiResource';
import { useToast } from '@/components/ui/ToastProvider';
import type { Role, UserStatus } from '@/types';

export function AdminUsersPage() {
  const [query,setQuery]=useState(''); const [role,setRole]=useState<'ALL'|Role>('ALL'); const {showToast}=useToast(); const qc=useQueryClient();
  const usersQuery=useApiResource(['admin-users',{query,role}],()=>usersService.list({search:query||undefined,role:role==='ALL'?undefined:role}));
  const statusMutation=useMutation({mutationFn:({id,status}:{id:string;status:UserStatus})=>usersService.updateStatus(id,status),onSuccess:()=>{showToast('Kullanıcı durumu güncellendi');qc.invalidateQueries({queryKey:['admin-users']});},onError:(e)=>showToast(e instanceof Error?e.message:'Durum güncellenemedi','error')});
  const roleMutation=useMutation({mutationFn:({id,next}:{id:string;next:Role})=>usersService.updateRole(id,next),onSuccess:()=>{showToast('Kullanıcı rolü güncellendi');qc.invalidateQueries({queryKey:['admin-users']});},onError:(e)=>showToast(e instanceof Error?e.message:'Rol güncellenemedi','error')});
  if(usersQuery.isLoading)return <LoadingState text="Backend kullanıcıları yükleniyor..."/>; if(usersQuery.isError)return <ErrorState title="Kullanıcılar yüklenemedi" text={(usersQuery.error as Error).message}/>;
  const users=usersQuery.data?.data??[];
  return <main className="space-y-6"><AdminPageHeader eyebrow="Kullanıcı yönetimi" title="Backend hesapları ve erişim" description="/api/users kullanır. Kullanıcılar sadece backendden gelir." actions={<AdminCrudStatus source={usersQuery.data?.source} isMutating={statusMutation.isPending||roleMutation.isPending}/>}/><div className="grid gap-3 md:grid-cols-[1fr_220px]"><Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Kullanıcı ara" icon={<Search size={16}/>}/><Select value={role} onChange={(e)=>setRole(e.target.value as typeof role)}>{['ALL','CUSTOMER','BOX_OFFICE','EVENT_MANAGER','FINANCE','ADMIN','SUPER_ADMIN'].map(x=><option key={x}>{x}</option>)}</Select></div>{users.length?<div className="space-y-3">{users.map(user=><div key={user.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4 md:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap gap-2"><Badge>{user.role}</Badge><Badge>{user.status}</Badge></div><h3 className="mt-2 font-serif text-2xl text-white">{user.fullName}</h3><p className="text-sm text-white/55">{user.email}</p></div><div className="flex flex-wrap items-center gap-2"><Button asChild size="sm" variant="outline"><Link to={`/admin/users/${user.id}`}>Görüntüle</Link></Button><Button size="sm" variant="secondary" onClick={()=>roleMutation.mutate({id:user.id,next:user.role==='CUSTOMER'?'BOX_OFFICE':'CUSTOMER'})}>Değiştir role</Button><Button size="sm" variant={user.status==='ACTIVE'?'danger':'outline'} onClick={()=>statusMutation.mutate({id:user.id,status:user.status==='ACTIVE'?'BLOCKED':'ACTIVE'})}>{user.status==='ACTIVE'?'Engelle':'Aktifleştir'}</Button></div></div>)}</div>:<EmptyState title="Kullanıcı yok" text="Backend kullanıcı döndürmedi."/>}</main>;
}
