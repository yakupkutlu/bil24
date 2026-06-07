import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { eventsApi } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Event } from '../../types';

const CATEGORIES = ['Tiyatro', 'Konser', 'Sinema', 'Spor', 'Stand-up', 'Diğer'];

const EventListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="rounded-xl overflow-hidden bg-gray-200 h-80 animate-pulse" />
    ))}
  </div>
);

export default function EventList() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    if (!window.confirm(`"${event.title}" etkinliğini silmek istediğinize emin misiniz?`)) return;
    try {
      await eventsApi.delete(event.id);
      setEvents(prev => prev.filter(ev => ev.id !== event.id));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Etkinlik silinemedi');
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await eventsApi.list(true);
        let filtered = data;
        if (searchTerm) filtered = filtered.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));
        if (selectedCategory) filtered = filtered.filter(e => e.category === selectedCategory);
        setEvents(filtered);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [searchTerm, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8"><h1 className="text-3xl font-bold text-gray-900 mb-6">Etkinlikler</h1></div>
          <EventListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Etkinlikler</h1>
          {isAdmin && (
            <button onClick={() => navigate('/events/new')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <Plus size={20} /> Yeni Etkinlik
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input type="text" placeholder="Etkinlik ara..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tüm Kategoriler</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {deleteError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{deleteError}</div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Hiçbir etkinlik bulunamadı</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="rounded-xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition cursor-pointer h-80 relative">
                <img
                  src={event.poster_url || 'https://images.pexels.com/photos/2609/pexels-photo-2609.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                {/* Admin aksiyon butonları */}
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/events/${event.id}/edit`); }}
                      className="p-1.5 bg-white/90 hover:bg-white rounded-lg text-gray-700 transition"
                      title="Düzenle"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={e => handleDelete(e, event)}
                      className="p-1.5 bg-white/90 hover:bg-red-50 rounded-lg text-red-600 transition"
                      title="Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex gap-2 mb-3">
                    <span className="inline-block bg-blue-600 px-3 py-1 rounded-full text-xs font-semibold">{event.category}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1 line-clamp-2">{event.title}</h3>
                  <p className="text-sm text-gray-200 line-clamp-1 mb-2">{event.slogan}</p>
                  <p className="text-xs text-gray-300">
                    {new Date(event.start_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
