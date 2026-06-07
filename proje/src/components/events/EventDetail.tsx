import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Clock, MapPin } from 'lucide-react';
import { eventsApi, sessionsApi } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Event, Session } from '../../types';

type SessionWithHall = Omit<Session, 'hall'> & {
  hall?: { id: string; name: string };
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [sessions, setSessions] = useState<SessionWithHall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const [eventData, sessionsData] = await Promise.all([
          eventsApi.get(id),
          sessionsApi.list({ event_id: id }),
        ]);
        setEvent(eventData);
        setSessions(sessionsData as SessionWithHall[]);
      } catch (error) {
        console.error('Error fetching event details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!event || !window.confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await eventsApi.delete(event.id);
      navigate('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Etkinlik silinirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft size={20} />
            Geri Dön
          </button>
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft size={20} />
            Geri Dön
          </button>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Etkinlik bulunamadı</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={20} />
          Geri Dön
        </button>

        <div className="rounded-xl overflow-hidden bg-white shadow-lg mb-6 h-96">
          <img
            src={event.cover_url || event.poster_url || 'https://images.pexels.com/photos/2609/pexels-photo-2609.jpeg?auto=compress&cs=tinysrgb&w=800'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {event.category}
                </span>
                {event.is_active ? (
                  <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Aktif
                  </span>
                ) : (
                  <span className="inline-block bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    İnaktif
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <p className="text-xl text-gray-600 mb-4">{event.slogan}</p>
            </div>

            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/events/${event.id}/edit`)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <Edit2 size={18} />
                  Düzenle
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 size={18} />
                  Sil
                </button>
              </div>
            )}
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Başlangıç Tarihi:</span>{' '}
              {event.start_date ? new Date(event.start_date).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : '-'}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-semibold">Bitiş Tarihi:</span>{' '}
              {event.end_date ? new Date(event.end_date).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : '-'}
            </p>
          </div>
        </div>

        {sessions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Seanslar</h2>
            <div className="grid gap-4">
              {sessions.map(session => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">
                        {new Date(session.session_date).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long'
                        })}
                      </p>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock size={18} />
                          <span className="font-semibold">
                            {session.start_time}
                          </span>
                        </div>
                        <span className="text-gray-600">
                          {session.duration_minutes} dk
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Taban Fiyat</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₺{Number(session.base_price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {session.hall && (
                  <div className="flex items-center gap-2 text-gray-700 mb-4">
                    <MapPin size={18} />
                    <span>{session.hall.name}</span>
                  </div>
                  )}

                  <button
                    onClick={() => navigate(`/ticket-sales?event_id=${event.id}&session_id=${session.id}`)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Bilet Al
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
