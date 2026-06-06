import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Wand2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { AdminCrudStatus, AdminEndpointHint } from '@/components/admin/AdminCrudStatus';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { hallsService } from '@/services/halls.service';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import type { Hall } from '@/types';

const emptyForm = { name: '', status: 'ACTIVE' as Hall['status'], capacity: 120, rows: 10, seatsPerRow: 12, vipRows: 'A,B', accessibleSeats: '', blockedSeats: '', description: '' };

export function AdminHallCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [createdHallId, setCreatedHallId] = useState<string | null>(null);

  const createMutation = useAdminMutation<Partial<Hall>, Hall>({
    mutationFn: (payload) => hallsService.create(payload),
    successMessage: 'Salon başarıyla oluşturuldu.',
    invalidate: ['admin-halls'],
    onSuccess: (hall) => setCreatedHallId(hall.id)
  });

  const generateMutation = useAdminMutation<{ id: string; rows: number; seatsPerRow: number }, Hall>({
    mutationFn: ({ id, rows, seatsPerRow }) => hallsService.generateSeats(id, { rows, seatsPerRow }),
    successMessage: 'Koltuk haritası başarıyla oluşturuldu.',
    invalidate: ['admin-halls'],
    onSuccess: (hall) => navigate(`/admin/halls/${hall.id}/seats`)
  });

  const createAndGenerateMutation = useAdminMutation<Partial<Hall>, Hall>({
    mutationFn: async (payload) => {
      const hall = await hallsService.create(payload);
      return hallsService.generateSeats(hall.id, { rows: Number(form.rows), seatsPerRow: Number(form.seatsPerRow) });
    },
    successMessage: 'Salon oluşturuldu ve koltuk haritası üretildi.',
    invalidate: ['admin-halls'],
    onSuccess: (hall) => navigate(`/admin/halls/${hall.id}/seats`)
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate({
      name: form.name,
      description: form.description,
      status: form.status,
      capacity: Number(form.capacity),
      rows: Number(form.rows),
      seatsPerRow: Number(form.seatsPerRow),
      seatMap: []
    });
  }

  function handleCreateAndGenerate() {
    if (createdHallId) {
      generateMutation.mutate({ id: createdHallId, rows: Number(form.rows), seatsPerRow: Number(form.seatsPerRow) });
      return;
    }
    createAndGenerateMutation.mutate({
      name: form.name,
      description: form.description,
      status: form.status,
      capacity: Number(form.capacity),
      rows: Number(form.rows),
      seatsPerRow: Number(form.seatsPerRow),
      seatMap: []
    });
  }

  const isSaving = createMutation.isPending || generateMutation.isPending || createAndGenerateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <AdminPageHeader eyebrow="Salon oluştur" title="Yeni bir oturma düzeni oluştur." description="Satırları, bölümleri, kapalı koltukları, erişilebilirliği, VIP yerleşimini tanımla ve ilk haritayı backend endpointleriyle otomatik oluştur." actions={<><AdminCrudStatus isMutating={isSaving} source={createdHallId ? 'api' : undefined} /><Button type="button" variant="outline" onClick={() => navigate('/admin/halls')}><ArrowLeft size={18}/> Geri</Button><Button type="submit"><Save size={18}/> Salonu kaydet</Button></>} />
      <AdminSectionCard title="Salon kurulumu" description="Bu değerler ilk koltuk düzenini oluşturur.">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Salon adı" placeholder="Büyük Sahne" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
          <Select label="Durum" value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as Hall['status'] }))}><option>ACTIVE</option><option>MAINTENANCE</option><option>INACTIVE</option></Select>
          <Input label="Kapasite" type="number" value={form.capacity} onChange={(e) => setForm((current) => ({ ...current, capacity: Number(e.target.value) }))} />
          <Input label="Satırlar" type="number" value={form.rows} onChange={(e) => setForm((current) => ({ ...current, rows: Number(e.target.value) }))} />
          <Input label="Satır başına koltuk" type="number" value={form.seatsPerRow} onChange={(e) => setForm((current) => ({ ...current, seatsPerRow: Number(e.target.value) }))} />
          <Input label="VIP satırları" value={form.vipRows} onChange={(e) => setForm((current) => ({ ...current, vipRows: e.target.value }))} />
          <Input label="Erişilebilir koltuklar" value={form.accessibleSeats} onChange={(e) => setForm((current) => ({ ...current, accessibleSeats: e.target.value }))} />
          <Input label="Engelli koltuklar" value={form.blockedSeats} onChange={(e) => setForm((current) => ({ ...current, blockedSeats: e.target.value }))} />
          <Textarea label="Açıklama" className="md:col-span-2" value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
          <Button type="button" className="md:col-span-2" onClick={handleCreateAndGenerate} disabled={!form.name || isSaving}><Wand2 size={18}/> {createdHallId ? 'Koltukları oluştur' : 'Oluştur ve koltukları üret'}</Button>
        </div>
        <AdminEndpointHint>Connected actions: POST /api/halls and POST /api/halls/:id/generate-seats.</AdminEndpointHint>
      </AdminSectionCard>
    </form>
  );
}
