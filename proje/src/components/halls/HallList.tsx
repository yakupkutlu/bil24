import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { hallsApi } from '../../lib/api';
import { Hall, HALL_TYPE_LABELS } from '../../types';

export default function HallList() {
  const navigate = useNavigate();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      setLoading(true);
      const data = await hallsApi.list();
      setHalls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salon yükleme hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (hallId: string, hallName: string) => {
    if (!window.confirm(`"${hallName}" salonunu silmek istediğinize emin misiniz?`)) return;
    try {
      await hallsApi.delete(hallId);
      setHalls(halls.filter(h => h.id !== hallId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salon silme hatası');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Salonlar</h1>
        <button
          onClick={() => navigate('/halls/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Salon
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
      )}

      {halls.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">Henüz salon oluşturulmamıştır</p>
          <button onClick={() => navigate('/halls/new')} className="text-blue-600 hover:text-blue-700 font-semibold">
            İlk salonunuzu oluşturun
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {halls.map(hall => (
            <div key={hall.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{hall.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {HALL_TYPE_LABELS[hall.hall_type]}
                  </span>
                </div>

                <div className="space-y-2 mb-6 text-sm text-gray-600">
                  <p><span className="font-semibold">Kapasite:</span> {hall.total_capacity} kişi</p>
                  {hall.hall_type === 'masali' && (
                    <>
                      <p><span className="font-semibold">Masa Sayısı:</span> {hall.masali_table_count}</p>
                      <p><span className="font-semibold">Masa Başı Koltuk:</span> {hall.masali_seats_per_table}</p>
                    </>
                  )}
                  {hall.hall_type === 'sinema' && (
                    <p><span className="font-semibold">Grup Sayısı:</span> {hall.sinema_row_groups?.length || 0}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/halls/${hall.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(hall.id, hall.name)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
