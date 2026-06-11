import { useEffect, useState } from 'react';
import { hallsApi, seatsApi } from '../../lib/api';
import { Hall, Seat, SEAT_STATUS_LABELS } from '../../types';

interface HallSeatMapProps {
  hallId: string;
  sessionId?: string;
  selectedSeats?: string[];
  onSeatSelect?: (seatId: string, seat: Seat) => void;
  interactive?: boolean;
}

interface SeatWithStatus extends Seat {
  isOccupied: boolean;
  isSelected: boolean;
}

export default function HallSeatMap({ hallId, sessionId, selectedSeats = [], onSeatSelect, interactive = false }: HallSeatMapProps) {
  const [hall, setHall] = useState<Hall | null>(null);
  const [seats, setSeats] = useState<SeatWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHallAndSeats();
  }, [hallId, sessionId]);

  const fetchHallAndSeats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [hallData, rawSeats] = await Promise.all([
        hallsApi.get(hallId),
        seatsApi.listWithOccupied(hallId, sessionId),
      ]);

      setHall(hallData);
      const selectedSeatIds = new Set(selectedSeats);
      const seatsWithStatus = (rawSeats as (Seat & { isOccupied?: boolean })[]).map(s => ({
        ...s,
        isOccupied: s.isOccupied || false,
        isSelected: selectedSeatIds.has(s.id),
      }));
      setSeats(seatsWithStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salon ve koltuklar yükleme hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat: SeatWithStatus) => {
    if (!interactive || !onSeatSelect) return;
    // Seans bazlı dolu koltuk veya manuel rezerve — seçilemez
    if (seat.isOccupied) return;
    if (seat.seat_status === 'reserved') return;
    const updatedSeats = seats.map(s => s.id === seat.id ? { ...s, isSelected: !s.isSelected } : s);
    setSeats(updatedSeats);
    onSeatSelect(seat.id, seat);
  };

  const getSeatColorClass = (seat: SeatWithStatus): string => {
    if (seat.isSelected) return 'seat-selected';
    if (seat.isOccupied) return 'seat-occupied';  // seans bazlı doluluk
    switch (seat.seat_status) {
      case 'reserved':      return 'seat-reserved';
      case 'vip':           return 'seat-vip';
      case 'disabled':      return 'seat-disabled-seat';
      // 'occupied' DB değeri artık ticket tablosundan hesaplanıyor — boş göster
      default:              return 'seat-empty';
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>;
  if (!hall) return <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">Salon bulunamadı</div>;
  if (seats.length === 0) return <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">Bu salon için koltuk tanımlanmamıştır</div>;

  return (
    <div className="space-y-6">
      {hall.hall_type === 'sinema'
        ? <SinemaLayout hall={hall} seats={seats} onSeatClick={handleSeatClick} getSeatColorClass={getSeatColorClass} />
        : <MasaliLayout seats={seats} onSeatClick={handleSeatClick} getSeatColorClass={getSeatColorClass} />}

      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-semibold text-gray-900 mb-3">Lejant</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <LegendItem className="seat-empty" label="Boş" />
          <LegendItem className="seat-occupied" label="Dolu" />
          <LegendItem className="seat-reserved" label="Rezerve" />
          <LegendItem className="seat-vip" label="VIP" />
          <LegendItem className="seat-disabled-seat" label="Engelli" />
          {interactive && <LegendItem className="seat-selected" label="Seçilmiş" />}
        </div>
      </div>
    </div>
  );
}

function SinemaLayout({ hall, seats, onSeatClick, getSeatColorClass }: { hall: Hall; seats: (Seat & { isOccupied: boolean; isSelected: boolean })[]; onSeatClick: (s: any) => void; getSeatColorClass: (s: any) => string }) {
  if (!hall.sinema_row_groups || !hall.sinema_rows_per_group || !hall.sinema_seats_per_row) return <div>Sinema konfigürasyonu eksik</div>;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-block bg-gray-300 text-gray-700 px-6 py-2 rounded font-semibold">PERDE</div>
      </div>
      {hall.sinema_row_groups.map((groupLetter, groupIdx) => {
        const rowsInGroup = hall.sinema_rows_per_group![groupIdx] || 5;
        const seatsInRow = hall.sinema_seats_per_row![groupIdx] || 10;
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
                          <SeatButton key={seat.id} seat={seat} colorClass={getSeatColorClass(seat)}
                            onClick={() => onSeatClick(seat)}
                            interactive={!seat.isOccupied && seat.seat_status !== 'reserved'} />
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

function MasaliLayout({ seats, onSeatClick, getSeatColorClass }: { seats: (Seat & { isOccupied: boolean; isSelected: boolean })[]; onSeatClick: (s: any) => void; getSeatColorClass: (s: any) => string }) {
  const tableMap = new Map<string, (Seat & { isOccupied: boolean; isSelected: boolean })[]>();
  seats.forEach(seat => {
    if (seat.table_label) {
      if (!tableMap.has(seat.table_label)) tableMap.set(seat.table_label, []);
      tableMap.get(seat.table_label)!.push(seat);
    }
  });

  const sortedTables = Array.from(tableMap.entries()).sort(([a], [b]) => {
    if (a.charCodeAt(0) !== b.charCodeAt(0)) return a.charCodeAt(0) - b.charCodeAt(0);
    return parseInt(a.slice(1)) - parseInt(b.slice(1));
  });

  return (
    <div className="flex flex-wrap gap-8 justify-center">
      {sortedTables.map(([tableLabel, tableSeats]) => (
        <div key={tableLabel} className="text-center">
          <div className="mb-2 font-semibold text-gray-700">{tableLabel}</div>
          <div className="flex flex-col items-center gap-1">
            {tableSeats.map(seat => (
              <SeatButton key={seat.id} seat={seat} colorClass={getSeatColorClass(seat)}
                onClick={() => onSeatClick(seat)}
                interactive={!seat.isOccupied && seat.seat_status !== 'reserved'} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SeatButton({ seat, colorClass, onClick, interactive }: { seat: Seat; colorClass: string; onClick: () => void; interactive: boolean }) {
  return (
    <button onClick={onClick} disabled={!interactive}
      title={`${seat.seat_label} - ${SEAT_STATUS_LABELS[seat.seat_status]}`}
      className={`w-8 h-8 rounded text-xs font-semibold transition-all ${colorClass} ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}`}>
      {seat.seat_number || ''}
    </button>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded ${className}`}></div>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}
