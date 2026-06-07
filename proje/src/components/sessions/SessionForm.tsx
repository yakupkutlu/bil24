import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader, CheckCircle, Tag } from 'lucide-react';
import { eventsApi, hallsApi, sessionsApi } from '../../lib/api';
import { SessionStatusType } from '../../types';

interface FormData {
  event_id: string;
  hall_id: string;
  session_date: string;
  start_time: string;
  duration_minutes: string;
  base_price: string;
  status: SessionStatusType;
}

export default function SessionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!id);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    event_id: '',
    hall_id: '',
    session_date: '',
    start_time: '',
    duration_minutes: '',
    base_price: '',
    status: 'active',
  });
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [halls, setHalls] = useState<{ id: string; name: string }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; title: string } | null>(null);
  const [selectedHall, setSelectedHall] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [eventsData, hallsData] = await Promise.all([
          eventsApi.list(true),
          hallsApi.list(),
        ]);
        setEvents(eventsData.map(e => ({ id: e.id, title: e.title })));
        setHalls(hallsData.map(h => ({ id: h.id, name: h.name })));
      } catch (error) {
        console.error('Error fetching options:', error);
        setError('Etkinlik ve salon verileri yüklenemedi');
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchSession = async () => {
        try {
          setFetchLoading(true);
          const session = await sessionsApi.get(id);
          setFormData({
            event_id: session.event_id,
            hall_id: session.hall_id,
            session_date: session.session_date,
            start_time: session.start_time,
            duration_minutes: session.duration_minutes.toString(),
            base_price: session.base_price.toString(),
            status: session.status,
          });
          const event = events.find(e => e.id === session.event_id);
          const hall = halls.find(h => h.id === session.hall_id);
          if (event) setSelectedEvent(event);
          if (hall) setSelectedHall(hall);
        } catch (error) {
          console.error('Error fetching session:', error);
          setError('Seans yüklenemedi');
        } finally {
          setFetchLoading(false);
        }
      };

      if (events.length > 0 && halls.length > 0) {
        fetchSession();
      }
    }
  }, [id, events, halls]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'event_id') {
      const event = events.find(e => e.id === value);
      setSelectedEvent(event || null);
    }

    if (name === 'hall_id') {
      const hall = halls.find(h => h.id === value);
      setSelectedHall(hall || null);
    }
  };

  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.event_id || !formData.hall_id || !formData.session_date || !formData.start_time || !formData.duration_minutes || !formData.base_price) {
        setError('Lütfen tüm alanları doldurunuz');
        setLoading(false);
        return;
      }

      const sessionData = {
        event_id: formData.event_id,
        hall_id: formData.hall_id,
        session_date: formData.session_date,
        start_time: formData.start_time,
        duration_minutes: parseInt(formData.duration_minutes),
        base_price: parseFloat(formData.base_price),
        status: formData.status,
      };

      if (id) {
        await sessionsApi.update(id, sessionData);
        navigate('/sessions');
      } else {
        const created = await sessionsApi.create(sessionData);
        setSavedSessionId((created as any).id);   // yeni seans → fiyat prompt'u göster
      }
    } catch (error) {
      console.error('Error saving session:', error);
      setError(error instanceof Error ? error.message : 'Seans kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  // Yeni seans başarıyla oluşturuldu → fiyat kategorisi prompt'u
  if (savedSessionId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center space-y-5">
          <div className="flex justify-center">
            <CheckCircle size={52} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Seans oluşturuldu!</h2>
          <p className="text-gray-500 text-sm">
            Bu seansa Gold / Silver / Bronze fiyat kategorileri eklemek ister misiniz?
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => navigate(`/pricing?session_id=${savedSessionId}&event_id=${formData.event_id}`)}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
            >
              <Tag size={18} /> Fiyat Kategorisi Ekle
            </button>
            <button
              onClick={() => navigate('/sessions')}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-medium transition"
            >
              Şimdi değil, Seanslar Listesine Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader className="animate-spin" size={24} />
          <span className="text-gray-600">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/sessions')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={20} />
          Seanslar
        </button>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {id ? 'Seanı Düzenle' : 'Yeni Seans Oluştur'}
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etkinlik <span className="text-red-500">*</span>
                </label>
                <select
                  name="event_id"
                  value={formData.event_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Etkinlik Seçiniz</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                  ))}
                </select>
                {selectedEvent && (
                  <p className="mt-2 text-sm text-gray-600">Seçilen: {selectedEvent.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salon <span className="text-red-500">*</span>
                </label>
                <select
                  name="hall_id"
                  value={formData.hall_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Salon Seçiniz</option>
                  {halls.map(hall => (
                    <option key={hall.id} value={hall.id}>{hall.name}</option>
                  ))}
                </select>
                {selectedHall && (
                  <p className="mt-2 text-sm text-gray-600">Seçilen: {selectedHall.name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seans Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="session_date"
                  value={formData.session_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başlangıç Saati <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Süre (dakika) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temel Fiyat (TL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="active">Aktif</option>
                <option value="cancelled">İptal</option>
                <option value="postponed">Ertelendi</option>
              </select>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader size={20} className="animate-spin" />}
                {id ? 'Düzenlemeleri Kaydet' : 'Seanı Oluştur'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/sessions')}
                className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400 transition"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
