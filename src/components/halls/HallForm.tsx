import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { hallsApi, seatsApi } from '../../lib/api';
import { Hall, HallType, Seat } from '../../types';

interface RowGroup {
  letter: string;
  rowsPerGroup: number;
  seatsPerRow: number;
}

export default function HallForm() {
  const navigate = useNavigate();
  const { id: hallId } = useParams<{ id?: string }>();
  const isEditMode = !!hallId;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [hallType, setHallType] = useState<HallType>('sinema');
  const [masaliTableCount, setMasaliTableCount] = useState(10);
  const [masaliSeatsPerTable, setMasaliSeatsPerTable] = useState(4);
  const [rowGroups, setRowGroups] = useState<RowGroup[]>([{ letter: 'A', rowsPerGroup: 5, seatsPerRow: 10 }]);
  const [hasCorridorCheck, setHasCorridorCheck] = useState(false);
  const [corridorAfterRow, setCorridorAfterRow] = useState(3);

  useEffect(() => {
    if (isEditMode) fetchHall();
  }, [hallId]);

  const fetchHall = async () => {
    try {
      const hall = await hallsApi.get(hallId!);
      setName(hall.name);
      setHallType(hall.hall_type);
      if (hall.hall_type === 'masali') {
        setMasaliTableCount(hall.masali_table_count || 10);
        setMasaliSeatsPerTable(hall.masali_seats_per_table || 4);
      } else {
        const groups: RowGroup[] = (hall.sinema_row_groups || ['A']).map((letter, idx) => ({
          letter,
          rowsPerGroup: hall.sinema_rows_per_group?.[idx] || 5,
          seatsPerRow: hall.sinema_seats_per_row?.[idx] || 10,
        }));
        setRowGroups(groups);
        setHasCorridorCheck(hall.has_corridor || false);
        setCorridorAfterRow(hall.corridor_after_row || 3);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salon yükleme hatası');
    } finally {
      setLoading(false);
    }
  };

  const generateMasaliSeats = (hall: Hall): Partial<Seat>[] => {
    const seats: Partial<Seat>[] = [];
    const tableCount = hall.masali_table_count || 10;
    const seatsPerTable = hall.masali_seats_per_table || 4;
    const tablesPerRow = 10;

    for (let tableIdx = 0; tableIdx < tableCount; tableIdx++) {
      const row = Math.floor(tableIdx / tablesPerRow);
      const col = tableIdx % tablesPerRow;
      const tableLetter = String.fromCharCode(65 + row);
      const tableNumber = col + 1;
      const tableLabel = `${tableLetter}${tableNumber}`;
      for (let seatIdx = 1; seatIdx <= seatsPerTable; seatIdx++) {
        seats.push({
          hall_id: hall.id,
          seat_label: `${tableLabel}-${seatIdx}`,
          table_label: tableLabel,
          row_group: undefined,
          row_number: undefined,
          seat_number: undefined,
          seat_status: 'empty',
          price_multiplier: 1,
        });
      }
    }
    return seats;
  };

  const generateSinemaSeats = (hall: Hall): Partial<Seat>[] => {
    const seats: Partial<Seat>[] = [];
    rowGroups.forEach(group => {
      for (let row = 1; row <= group.rowsPerGroup; row++) {
        for (let seat = 1; seat <= group.seatsPerRow; seat++) {
          seats.push({
            hall_id: hall.id,
            seat_label: `${group.letter}${row}-${seat}`,
            row_group: group.letter,
            row_number: row,
            seat_number: seat,
            table_label: undefined,
            seat_status: 'empty',
            price_multiplier: 1,
          });
        }
      }
    });
    return seats;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Salon adı gereklidir'); return; }

    try {
      setSaving(true);
      let totalCapacity = 0;
      if (hallType === 'masali') {
        totalCapacity = masaliTableCount * masaliSeatsPerTable;
      } else {
        totalCapacity = rowGroups.reduce((sum, g) => sum + g.rowsPerGroup * g.seatsPerRow, 0);
      }

      const hallData = {
        name: name.trim(),
        hall_type: hallType,
        total_capacity: totalCapacity,
        masali_table_count: hallType === 'masali' ? masaliTableCount : null,
        masali_seats_per_table: hallType === 'masali' ? masaliSeatsPerTable : null,
        sinema_row_groups: hallType === 'sinema' ? rowGroups.map(g => g.letter) : null,
        sinema_rows_per_group: hallType === 'sinema' ? rowGroups.map(g => g.rowsPerGroup) : null,
        sinema_seats_per_row: hallType === 'sinema' ? rowGroups.map(g => g.seatsPerRow) : null,
        has_corridor: hallType === 'sinema' ? hasCorridorCheck : false,
        corridor_after_row: hallType === 'sinema' && hasCorridorCheck ? corridorAfterRow : null,
      };

      let savedHall: Hall;
      if (isEditMode) {
        savedHall = await hallsApi.update(hallId!, hallData);
      } else {
        savedHall = await hallsApi.create(hallData);
      }

      const seatsToInsert = hallType === 'masali'
        ? generateMasaliSeats(savedHall)
        : generateSinemaSeats(savedHall);

      if (isEditMode) {
        await seatsApi.deleteByHall(savedHall.id);
      }

      if (seatsToInsert.length > 0) {
        await seatsApi.bulkCreate(seatsToInsert);
      }

      navigate('/halls');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salon kaydetme hatası');
    } finally {
      setSaving(false);
    }
  };

  const addRowGroup = () => {
    const nextLetter = String.fromCharCode(65 + rowGroups.length);
    setRowGroups([...rowGroups, { letter: nextLetter, rowsPerGroup: 5, seatsPerRow: 10 }]);
  };

  const removeRowGroup = () => {
    if (rowGroups.length > 1) setRowGroups(rowGroups.slice(0, -1));
  };

  const updateRowGroup = (idx: number, field: keyof RowGroup, value: string | number) => {
    const updated = [...rowGroups];
    if (field === 'letter') updated[idx] = { ...updated[idx], letter: String(value).toUpperCase() };
    else updated[idx] = { ...updated[idx], [field]: Number(value) };
    setRowGroups(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate('/halls')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Salon Düzenle' : 'Yeni Salon Oluştur'}
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Salon Adı *</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="örn. Ana Salon, VIP Salon"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Salon Türü *</label>
          <div className="flex gap-6">
            {(['masali', 'sinema'] as HallType[]).map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="hallType" value={type} checked={hallType === type}
                  onChange={e => setHallType(e.target.value as HallType)} className="w-4 h-4" />
                <span className="text-gray-700">{type === 'masali' ? 'Masalı Düzen' : 'Sinema Düzeni'}</span>
              </label>
            ))}
          </div>
        </div>

        {hallType === 'masali' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Masa Sayısı</label>
              <input type="number" value={masaliTableCount}
                onChange={e => setMasaliTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Masa Başı Koltuk</label>
              <input type="number" value={masaliSeatsPerTable}
                onChange={e => setMasaliSeatsPerTable(Math.max(1, parseInt(e.target.value) || 1))}
                min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
        )}

        {hallType === 'sinema' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg space-y-4">
              <h3 className="font-semibold text-gray-900">Grup Ayarları</h3>
              {rowGroups.map((group, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-3 p-3 bg-white rounded border border-gray-200">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Grup Harfi</label>
                    <input type="text" value={group.letter}
                      onChange={e => updateRowGroup(idx, 'letter', e.target.value)}
                      maxLength={1} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Satır Sayısı</label>
                    <input type="number" value={group.rowsPerGroup}
                      onChange={e => updateRowGroup(idx, 'rowsPerGroup', e.target.value)}
                      min="1" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Satır Başı Koltuk</label>
                    <input type="number" value={group.seatsPerRow}
                      onChange={e => updateRowGroup(idx, 'seatsPerRow', e.target.value)}
                      min="1" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <button type="button" onClick={addRowGroup}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Grup Ekle
                </button>
                {rowGroups.length > 1 && (
                  <button type="button" onClick={removeRowGroup}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" /> Son Grubu Sil
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasCorridorCheck}
                  onChange={e => setHasCorridorCheck(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="font-semibold text-gray-700">Koridor Ekle</span>
              </label>
              {hasCorridorCheck && (
                <div className="pl-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Koridor Konumu (satır sonrası)</label>
                  <input type="number" value={corridorAfterRow}
                    onChange={e => setCorridorAfterRow(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1" className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/halls')}
            className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
            İptal
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-semibold">
            {saving ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
}
