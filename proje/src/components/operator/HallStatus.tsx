import { useEffect, useState } from 'react';
import { hallsApi, sessionsApi, seatsApi } from '../../lib/api';
import { Hall, Seat, Session, SeatStatus, SEAT_STATUS_LABELS } from '../../types';
import { formatDate, formatTime } from '../../lib/utils';
import HallSeatMap from '../halls/HallSeatMap';
import { RefreshCw, Edit2 } from 'lucide-react';

type SessionWithEvent = Omit<Session, 'event' | 'hall'> & {
  event?: { id: string; title: string };
  hall?: { id: string; name: string };
};

interface SeatWithStats extends Seat {
  isOccupied: boolean;
}

export default function HallStatus() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedHallId, setSelectedHallId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<SessionWithEvent[]>([]);
  const [seatsWithStats, setSeatsWithStats] = useState<SeatWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMode, setEditingMode] = useState(false);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [newSeatStatus, setNewSeatStatus] = useState<SeatStatus>('empty');

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedHallId && selectedSessionId) {
        fetchSeatsForSession(selectedHallId, selectedSessionId);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedHallId, selectedSessionId]);

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      const data = await hallsApi.list();
      setHalls(data);
      if (data.length > 0) {
        setSelectedHallId(data[0].id);
        fetchSessionsForHall(data[0].id);
      }
    } catch (err) {
      console.error('Salonlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionsForHall = async (hallId: string) => {
    try {
      const data = await sessionsApi.list({ hall_id: hallId, status: 'active' });
      setSessions(data as SessionWithEvent[]);
      setSelectedSessionId('');
      setSeatsWithStats([]);
    } catch (err) {
      console.error('Seanslar yüklenemedi:', err);
    }
  };

  const fetchSeatsForSession = async (hallId: string, sessionId: string) => {
    try {
      setLoading(true);
      const seats = await seatsApi.listWithOccupied(hallId, sessionId);
      setSeatsWithStats(seats as SeatWithStats[]);
    } catch (err) {
      console.error('Koltuklar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHallChange = (hallId: string) => {
    setSelectedHallId(hallId);
    setSelectedSessionId('');
    setSeatsWithStats([]);
    fetchSessionsForHall(hallId);
  };

  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    fetchSeatsForSession(selectedHallId, sessionId);
  };

  const handleSeatEditClick = (seatId: string, currentStatus: SeatStatus) => {
    setSelectedSeatId(seatId);
    setNewSeatStatus(currentStatus);
  };

  const handleSaveSeatStatus = async () => {
    if (!selectedSeatId) return;
    try {
      await seatsApi.update(selectedSeatId, { seat_status: newSeatStatus });
      setSeatsWithStats(prev =>
        prev.map(s => s.id === selectedSeatId ? { ...s, seat_status: newSeatStatus } : s)
      );
      setSelectedSeatId(null);
    } catch (err) {
      console.error('Koltuk durumu güncellenemedi:', err);
    }
  };

  const calculateStats = () => {
    const stats = { total: seatsWithStats.length, occupied: 0, empty: 0, reserved: 0, vip: 0, disabled: 0 };
    seatsWithStats.forEach(seat => {
      if (seat.isOccupied) { stats.occupied++; return; }
      switch (seat.seat_status) {
        case 'empty':    stats.empty++;    break;
        case 'reserved': stats.reserved++; break;
        case 'vip':      stats.vip++;      break;
        case 'disabled': stats.disabled++; break;
      }
    });
    return stats;
  };

  const selectedHall = halls.find(h => h.id === selectedHallId);
  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const stats = calculateStats();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Salon Durumu</h1>
        <button
          onClick={() => { if (selectedHallId && selectedSessionId) fetchSeatsForSession(selectedHallId, selectedSessionId); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw size={20} />
          Yenile
        </button>
      </div>

      {/* Selection Controls */}
      <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-lg border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Salon Seçiniz</label>
          <select
            value={selectedHallId}
            onChange={e => handleHallChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {halls.map(hall => (
              <option key={hall.id} value={hall.id}>{hall.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Seans Seçiniz</label>
          <select
            value={selectedSessionId}
            onChange={e => handleSessionChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seçiniz...</option>
            {sessions.map(session => (
              <option key={session.id} value={session.id}>
                {formatDate(session.session_date)} {formatTime(session.start_time)} - {session.event?.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedSession && (
        <>
          {/* Session Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{selectedSession.event?.title}</span> •{' '}
              {formatDate(selectedSession.session_date)} {formatTime(selectedSession.start_time)} •{' '}
              {selectedHall?.name}
            </p>
          </div>

          {/* Statistics */}
          {seatsWithStats.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <StatCard label="Toplam"  value={stats.total}    color="bg-gray-100 text-gray-900" />
              <StatCard label="Dolu"    value={stats.occupied}  color="bg-red-100 text-red-900" />
              <StatCard label="Boş"     value={stats.empty}     color="bg-green-100 text-green-900" />
              <StatCard label="Rezerve" value={stats.reserved}  color="bg-yellow-100 text-yellow-900" />
              <StatCard label="VIP"     value={stats.vip}       color="bg-purple-100 text-purple-900" />
              <StatCard label="Engelli" value={stats.disabled}  color="bg-blue-100 text-blue-900" />
            </div>
          )}

          {/* Edit Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setEditingMode(!editingMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                editingMode
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              <Edit2 size={20} />
              {editingMode ? 'Düzenlemeyi Bitir' : 'Koltuk Düzenle'}
            </button>
          </div>

          {/* Seat Map */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : editingMode ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Durumu değiştirmek istediğiniz koltuğa tıklayın</p>
                {selectedSeatId && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                    <p className="font-semibold text-gray-900">
                      Koltuk: {seatsWithStats.find(s => s.id === selectedSeatId)?.seat_label}
                    </p>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Durum</label>
                    <select
                      value={newSeatStatus}
                      onChange={e => setNewSeatStatus(e.target.value as SeatStatus)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                    >
                      {Object.entries(SEAT_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveSeatStatus}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={() => setSelectedSeatId(null)}
                        className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}
                <EditableSeatMap
                  seats={seatsWithStats}
                  selectedSeatId={selectedSeatId}
                  onSeatClick={seat => handleSeatEditClick(seat.id, seat.seat_status)}
                  hall={selectedHall}
                />
              </div>
            ) : (
              <HallSeatMap
                hallId={selectedHallId}
                sessionId={selectedSessionId}
                interactive={false}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className={`p-4 rounded-lg ${color}`}>
      <p className="text-xs font-semibold opacity-75">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

interface EditableSeatMapProps {
  seats: SeatWithStats[];
  selectedSeatId: string | null;
  onSeatClick: (seat: SeatWithStats) => void;
  hall?: Hall;
}

function EditableSeatMap({ seats, selectedSeatId, onSeatClick, hall }: EditableSeatMapProps) {
  if (!hall) return null;

  const getSeatColorClass = (seat: SeatWithStats): string => {
    if (seat.id === selectedSeatId) return 'seat-selected';
    if (seat.isOccupied) return 'seat-occupied';
    switch (seat.seat_status) {
      case 'empty':    return 'seat-empty';
      case 'occupied': return 'seat-occupied';
      case 'reserved': return 'seat-reserved';
      case 'vip':      return 'seat-vip';
      case 'disabled': return 'seat-disabled-seat';
      default:         return 'seat-empty';
    }
  };

  if (hall.hall_type === 'sinema') {
    if (!hall.sinema_row_groups || !hall.sinema_rows_per_group || !hall.sinema_seats_per_row) {
      return <div>Sinema konfigürasyonu eksik</div>;
    }
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="inline-block bg-gray-300 text-gray-700 px-6 py-2 rounded font-semibold">PERDE</div>
        </div>
        {hall.sinema_row_groups.map((groupLetter, groupIdx) => {
          const rowsInGroup = hall.sinema_rows_per_group?.[groupIdx] || 5;
          const seatsInRow = hall.sinema_seats_per_row?.[groupIdx] || 10;
          const groupSeats = seats.filter(s => s.row_group === groupLetter);
          return (
            <div key={groupIdx} className="space-y-4">
              <h3 className="font-semibold text-gray-700 text-center">{groupLetter} Grubu</h3>
              <div className="flex flex-col items-center gap-2 overflow-x-auto pb-4">
                {Array.from({ length: rowsInGroup }).map((_, rowIdx) => {
                  const rowNumber = rowIdx + 1;
                  const rowSeats = groupSeats.filter(s => s.row_number === rowNumber);
                  return (
                    <div key={`${groupLetter}-${rowNumber}`} className="flex items-center gap-4">
                      <span className="w-8 text-right font-semibold text-gray-600 text-sm">{rowNumber}</span>
                      <div className="flex gap-2">
                        {Array.from({ length: seatsInRow }).map((_, seatIdx) => {
                          const seatNumber = seatIdx + 1;
                          const seat = rowSeats.find(s => s.seat_number === seatNumber);
                          if (!seat) return <div key={`${groupLetter}-${rowNumber}-${seatNumber}`} className="w-8 h-8" />;
                          return (
                            <button
                              key={seat.id}
                              onClick={() => onSeatClick(seat)}
                              className={`w-8 h-8 rounded text-xs font-semibold transition-all cursor-pointer hover:scale-110 ${getSeatColorClass(seat)}`}
                              title={seat.seat_label}
                            >
                              {seat.seat_number || ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Masalı layout
  const tableMap = new Map<string, SeatWithStats[]>();
  seats.forEach(seat => {
    if (seat.table_label) {
      if (!tableMap.has(seat.table_label)) tableMap.set(seat.table_label, []);
      tableMap.get(seat.table_label)!.push(seat);
    }
  });
  const sortedTables = Array.from(tableMap.entries()).sort(([a], [b]) => {
    const aRow = a.charCodeAt(0), aNum = parseInt(a.slice(1));
    const bRow = b.charCodeAt(0), bNum = parseInt(b.slice(1));
    return aRow !== bRow ? aRow - bRow : aNum - bNum;
  });

  return (
    <div className="flex flex-wrap gap-8 justify-center">
      {sortedTables.map(([tableLabel, tableSeats]) => (
        <div key={tableLabel} className="text-center">
          <div className="mb-2 font-semibold text-gray-700">{tableLabel}</div>
          <div className="flex flex-col items-center gap-1">
            {tableSeats.map(seat => (
              <button
                key={seat.id}
                onClick={() => onSeatClick(seat)}
                className={`w-8 h-8 rounded text-xs font-semibold transition-all cursor-pointer hover:scale-110 ${getSeatColorClass(seat)}`}
                title={seat.seat_label}
              >
                {seat.seat_number || ''}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
