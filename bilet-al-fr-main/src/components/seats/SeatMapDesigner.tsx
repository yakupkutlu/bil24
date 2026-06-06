import { useEffect, useState } from 'react';
import type { Seat } from '@/types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SeatMapViewer } from './SeatMapViewer';

export function SeatMapDesigner({ initialSeats = [], onChange }: { initialSeats?: Seat[]; onChange?: (seats: Seat[]) => void }) {
  const [seats, setSeats] = useState(initialSeats);
  const [category, setCategory] = useState<Seat['category']>('STANDARD');
  const [mode, setMode] = useState<'CATEGORY' | 'BLOCK' | 'ACCESSIBLE'>('CATEGORY');

  useEffect(() => { setSeats(initialSeats); }, [initialSeats]);
  useEffect(() => { onChange?.(seats); }, [seats, onChange]);

  const updateSeat = (seat: Seat) => setSeats((prev) => prev.map((item) => {
    if (item.code !== seat.code) return item;
    if (mode === 'BLOCK') return { ...item, isBlocked: !item.isBlocked, status: item.isBlocked ? 'AVAILABLE' : 'DISABLED' };
    if (mode === 'ACCESSIBLE') return { ...item, isAccessible: !item.isAccessible };
    return { ...item, category, price: category === 'VIP' ? Math.max(item.price, 500) : category === 'STUDENT' ? Math.min(item.price, 180) : item.price || 300 };
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <Select label="Düzenleme modu" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} options={[{ label: 'Kategori değiştir', value: 'CATEGORY' }, { label: 'Block/unblock', value: 'BLOCK' }, { label: 'Erişilebilir aç/kapat', value: 'ACCESSIBLE' }]} />
        {mode === 'CATEGORY' && <Select label="Seçilen kategori" value={category} onChange={(e) => setCategory(e.target.value as Seat['category'])} options={[{ label: 'VIP', value: 'VIP' }, { label: 'Standart', value: 'STANDARD' }, { label: 'Öğrenci', value: 'STUDENT' }]} />}
        <Button type="button" variant="outline" onClick={() => setSeats(initialSeats)}>Reset local changes</Button>
      </div>
      {seats.length ? <SeatMapViewer seats={seats} onToggle={updateSeat} /> : <div className="rounded-3xl border border-dashed border-white/15 bg-white/[.035] p-10 text-center text-white/55">Backend bu salon için henüz koltuk döndürmedi. Önce Koltukları oluştur seçeneğini kullan.</div>}
    </div>
  );
}
