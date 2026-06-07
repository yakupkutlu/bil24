import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, List, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { sessionsApi, eventsApi, hallsApi } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Session, SESSION_STATUS_LABELS, SessionStatusType } from '../../types';
import { formatDate, formatTime, formatCurrency } from '../../lib/utils';

type ViewMode = 'calendar' | 'list';

type SessionWithRelations = Omit<Session, 'event' | 'hall'> & {
  event?: { id: string; title: string };
  hall?: { id: string; name: string };
};

const SessionListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="rounded-lg overflow-hidden bg-gray-200 h-48 animate-pulse" />
    ))}
  </div>
);

const getStatusColor = (status: SessionStatusType): string => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-300';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
    case 'postponed': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export default function SessionList() {
  const navigate = useNavigate();
  const { isAdmin, isOperator } = useAuth();
  const [sessions, setSessions] = useState<SessionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedHall, setSelectedHall] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [halls, setHalls] = useState<{ id: string; name: string }[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, session: SessionWithRelations) => {
    e.stopPropagation();
    const label = `${session.event?.title || 'Seans'} — ${formatDate(session.session_date)} ${formatTime(session.start_time)}`;
    if (!window.confirm(`"${label}" seansını silmek istediğinize emin misiniz?`)) return;
    try {
      await sessionsApi.delete(session.id);
      setSessions(prev => prev.filter(s => s.id !== session.id));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Seans silinemedi');
    }
  };

  useEffect(() => {
    Promise.all([eventsApi.list(true), hallsApi.list()])
      .then(([evts, hlls]) => {
        setEvents(evts.map(e => ({ id: e.id, title: e.title })));
        setHalls(hlls.map(h => ({ id: h.id, name: h.name })));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const params: Record<string, string> = {};
        if (selectedEvent) params.event_id = selectedEvent;
        if (selectedHall) params.hall_id = selectedHall;
        let data = await sessionsApi.list(params) as SessionWithRelations[];

        if (searchTerm) data = data.filter(s => s.event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || s.hall?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        if (startDate) data = data.filter(s => s.session_date >= startDate);
        if (endDate) data = data.filter(s => s.session_date <= endDate);

        setSessions(data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [searchTerm, selectedEvent, selectedHall, startDate, endDate]);

  const groupedSessions = sessions.reduce((acc, session) => {
    const date = session.session_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {} as Record<string, SessionWithRelations[]>);

  const SessionCard = ({ session }: { session: SessionWithRelations }) => (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">{session.event?.title}</h3>
          <p className="text-sm text-gray-600">{session.hall?.name}</p>
        </div>
        <span className={`ml-2 shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(session.status)}`}>
          {SESSION_STATUS_LABELS[session.status]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><p className="text-xs text-gray-500">Tarih</p><p className="text-sm font-semibold text-gray-900">{formatDate(session.session_date)}</p></div>
        <div><p className="text-xs text-gray-500">Saat</p><p className="text-sm font-semibold text-gray-900">{formatTime(session.start_time)}</p></div>
        <div><p className="text-xs text-gray-500">Süre</p><p className="text-sm font-semibold text-gray-900">{session.duration_minutes} dk</p></div>
        <div><p className="text-xs text-gray-500">Fiyat</p><p className="text-sm font-semibold text-gray-900">{formatCurrency(session.base_price)}</p></div>
      </div>
      {isAdmin && (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/sessions/${session.id}/edit`)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition text-sm font-medium"
          >
            <Edit2 size={14} /> Düzenle
          </button>
          <button
            onClick={e => handleDelete(e, session)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-lg transition text-sm font-medium"
          >
            <Trash2 size={14} /> Sil
          </button>
        </div>
      )}
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8"><h1 className="text-3xl font-bold text-gray-900 mb-6">Seanslar</h1></div>
        <SessionListSkeleton />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seanslar</h1>
          {(isAdmin || isOperator) && (
            <button onClick={() => navigate('/sessions/new')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <Plus size={20} /> Yeni Seans
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input type="text" placeholder="Etkinlik veya salon ara..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tüm Etkinlikler</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
            <select value={selectedHall} onChange={e => setSelectedHall(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tüm Salonlar</option>
              {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Tarihi</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} title="Liste Görünümü">
                <List size={20} />
              </button>
              <button onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} title="Takvim Görünümü">
                <Calendar size={20} />
              </button>
            </div>
          </div>
        </div>

        {deleteError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{deleteError}</div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-12"><p className="text-gray-500 text-lg">Hiçbir seans bulunamadı</p></div>
        ) : viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map(session => <SessionCard key={session.id} session={session} />)}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([date, dateSessions]) => (
              <div key={date} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-4 border-b border-gray-200">{formatDate(date)}</h3>
                <div className="space-y-4">
                  {dateSessions.map(session => (
                    <div key={session.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{session.event?.title}</p>
                        <p className="text-sm text-gray-600">{session.hall?.name} • {formatTime(session.start_time)} • {session.duration_minutes} dk</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900">{formatCurrency(session.base_price)}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(session.status)}`}>
                          {SESSION_STATUS_LABELS[session.status]}
                        </span>
                        {isAdmin && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => navigate(`/sessions/${session.id}/edit`)}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                              title="Düzenle"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={e => handleDelete(e, session)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                              title="Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
