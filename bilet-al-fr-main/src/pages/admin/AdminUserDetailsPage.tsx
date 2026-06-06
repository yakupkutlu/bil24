import { useParams } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { Badge } from '@/components/ui/Badge';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { usersService } from '@/services/users.service';
import { useApiResource } from '@/hooks/useApiResource';

export function AdminUserDetailsPage() {
  const { id } = useParams();
  const userQuery = useApiResource(['admin-user', id], () => usersService.get(id ?? ''), undefined, { enabled: Boolean(id) });
  if (userQuery.isLoading) return <LoadingState text="Backend kullanıcısı yükleniyor..." />;
  if (userQuery.isError) return <ErrorState title="Kullanıcı yüklenemedi" text={(userQuery.error as Error).message} />;
  const user = userQuery.data?.data;
  if (!user) return <ErrorState title="Kullanıcı bulunamadı" text="Backend kullanıcı döndürmedi." />;
  return <main className="space-y-6"><AdminPageHeader eyebrow="Kullanıcı detayları" title={user.fullName} description="GET /api/users/:id üzerinden yüklendi." actions={<><Badge>{user.role}</Badge><Badge>{user.status}</Badge></>} /><AdminSectionCard title="Hesap"><div className="grid gap-3 text-white/70 md:grid-cols-2"><p>E-posta: <strong className="text-white">{user.email}</strong></p><p>Phone: {user.phone || '-'}</p><p>Role: {user.role}</p><p>Durum: {user.status}</p></div></AdminSectionCard></main>;
}
