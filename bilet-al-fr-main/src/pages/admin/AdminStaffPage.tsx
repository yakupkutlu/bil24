import { Plus } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminCrudStatus } from '@/components/admin/AdminCrudStatus';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { usersService } from '@/services/users.service';
import { useApiResource } from '@/hooks/useApiResource';

const staffRoles = ['BOX_OFFICE','EVENT_MANAGER','FINANCE','ADMIN','SUPER_ADMIN'];
export function AdminStaffPage() {
  const usersQuery = useApiResource(['admin-users','staff'], () => usersService.list());
  if (usersQuery.isLoading) return <LoadingState text="Backend personel kullanıcıları yükleniyor..." />;
  if (usersQuery.isError) return <ErrorState title="Personel yüklenemedi" text={(usersQuery.error as Error).message} />;
  const staff = (usersQuery.data?.data ?? []).filter((user) => staffRoles.includes(user.role));
  return <main className="space-y-6"><AdminPageHeader eyebrow="Personel yönetimi" title="Backend personel hesapları" description="/api/users üzerinden yüklendi ve personel rollerine göre filtrelendi. Personel sadece backendden gelir." actions={<><AdminCrudStatus source={usersQuery.data?.source}/><Button variant="outline"><Plus size={18}/>Backendde davet et</Button></>} />{staff.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{staff.map(user=><div key={user.id} className="rounded-[1.75rem] border border-white/10 bg-white/[.045] p-5"><Badge>{user.role}</Badge><h3 className="mt-3 font-serif text-2xl text-white">{user.fullName}</h3><p className="text-sm text-white/55">{user.email}</p><p className="mt-3 text-xs text-white/35">Durum: {user.status}</p></div>)}</div> : <EmptyState title="Personel yok" text="Backendde personel kullanıcıları oluştur." />}</main>;
}
