// ============================================================
// SeatMap Component - Cinema & Table Layout Renderer
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SessionSeatMap, SeatStatus, VenueType } from '../../types';

interface SeatMapProps {
  seats: SessionSeatMap[];
  venueType: VenueType;
  selectedSeats?: string[];
  onSeatClick?: (seat: SessionSeatMap) => void;
  readOnly?: boolean;
  maxSelectable?: number;
}

const STATUS_CLASSES: Record<string, string> = {
  available: 'seat-available',
  occupied: 'seat-occupied',
  reserved: 'seat-reserved',
  vip: 'seat-vip',
  disabled: 'seat-disabled',
  blocked: 'seat-blocked',
  selected: 'seat-selected',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Boş',
  occupied: 'Dolu',
  reserved: 'Rezerve',
  vip: 'VIP',
  disabled: 'Engelli',
  selected: 'Seçili',
};

// Cinema seat rendering
function CinemaSeatMap({
  seats, selectedSeats, onSeatClick, readOnly, maxSelectable
}: {
  seats: SessionSeatMap[];
  selectedSeats: string[];
  onSeatClick?: (seat: SessionSeatMap) => void;
  readOnly?: boolean;
  maxSelectable?: number;
}) {
  const { t } = useTranslation();

  // Group seats: { A: { 1: [seat1, seat2...], 2: [...] } }
  const grouped = useMemo(() => {
    const map: Record<string, Record<number, SessionSeatMap[]>> = {};
    seats.forEach(seat => {
      if (!seat.groupLetter) return;
      if (!map[seat.groupLetter]) map[seat.groupLetter] = {};
      if (!map[seat.groupLetter][seat.rowNumber!]) map[seat.groupLetter][seat.rowNumber!] = [];
      map[seat.groupLetter][seat.rowNumber!].push(seat);
      map[seat.groupLetter][seat.rowNumber!].sort((a, b) => a.seatNumber! - b.seatNumber!);
    });
    return map;
  }, [seats]);

  const groups = Object.keys(grouped).sort();

  const getSeatClass = (seat: SessionSeatMap) => {
    if (selectedSeats.includes(seat.seatId)) return STATUS_CLASSES.selected;
    if (seat.isVip && seat.status === 'available') return STATUS_CLASSES.vip;
    return STATUS_CLASSES[seat.status] || STATUS_CLASSES.available;
  };

  const handleClick = (seat: SessionSeatMap) => {
    if (readOnly) return;
    if (seat.status !== 'available' && !selectedSeats.includes(seat.seatId)) return;
    if (maxSelectable && selectedSeats.length >= maxSelectable && !selectedSeats.includes(seat.seatId)) return;
    onSeatClick?.(seat);
  };

  return (
    <div className="overflow-x-auto">
      {/* Screen */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-64 h-8 bg-gradient-to-b from-blue-400 to-blue-200 dark:from-blue-600 dark:to-blue-400 rounded-b-3xl flex items-center justify-center">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-100 tracking-widest">
              {t('seatMap.screen')}
            </span>
          </div>
          <div className="absolute -bottom-2 left-0 right-0 h-2 bg-blue-100 dark:bg-blue-900/30 blur-sm rounded-full" />
        </div>
      </div>

      {/* Groups */}
      {groups.map(group => {
        const rows = Object.keys(grouped[group]).map(Number).sort((a, b) => a - b);
        return (
          <div key={group} className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{group}</span>
              </div>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="space-y-1">
              {rows.map(row => (
                <div key={row} className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 w-8 text-right flex-shrink-0">{group}{row}</span>
                  <div className="flex gap-1 flex-wrap">
                    {grouped[group][row].map(seat => (
                      <button
                        key={seat.seatId}
                        onClick={() => handleClick(seat)}
                        title={`${seat.seatCode} - ${STATUS_LABELS[selectedSeats.includes(seat.seatId) ? 'selected' : seat.status]}`}
                        className={`
                          w-7 h-7 rounded text-xs font-medium border transition-all duration-150
                          ${getSeatClass(seat)}
                          ${readOnly || (seat.status !== 'available' && !selectedSeats.includes(seat.seatId)) ? 'cursor-not-allowed' : ''}
                          ${maxSelectable && selectedSeats.length >= maxSelectable && !selectedSeats.includes(seat.seatId) && seat.status === 'available' ? 'opacity-40 cursor-not-allowed' : ''}
                        `}
                      >
                        {seat.seatNumber}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Table seat rendering
function TableSeatMap({
  seats, selectedSeats, onSeatClick, readOnly, maxSelectable
}: {
  seats: SessionSeatMap[];
  selectedSeats: string[];
  onSeatClick?: (seat: SessionSeatMap) => void;
  readOnly?: boolean;
  maxSelectable?: number;
}) {
  // Group by table
  const tables = useMemo(() => {
    const map: Record<string, SessionSeatMap[]> = {};
    seats.forEach(seat => {
      if (!seat.tableNumber) return;
      if (!map[seat.tableNumber]) map[seat.tableNumber] = [];
      map[seat.tableNumber].push(seat);
      map[seat.tableNumber].sort((a, b) => a.seatNumber! - b.seatNumber!);
    });
    return map;
  }, [seats]);

  const tableNumbers = Object.keys(tables).sort();

  const getSeatClass = (seat: SessionSeatMap) => {
    if (selectedSeats.includes(seat.seatId)) return STATUS_CLASSES.selected;
    return STATUS_CLASSES[seat.status] || STATUS_CLASSES.available;
  };

  const handleClick = (seat: SessionSeatMap) => {
    if (readOnly) return;
    if (seat.status !== 'available' && !selectedSeats.includes(seat.seatId)) return;
    if (maxSelectable && selectedSeats.length >= maxSelectable && !selectedSeats.includes(seat.seatId)) return;
    onSeatClick?.(seat);
  };

  // Check if all seats at a table are occupied
  const getTableStatus = (tableName: string) => {
    const tableSeats = tables[tableName];
    const availableCount = tableSeats.filter(s => s.status === 'available').length;
    const totalCount = tableSeats.length;
    if (availableCount === 0) return 'full';
    if (availableCount === totalCount) return 'empty';
    return 'partial';
  };

  const tableStatusColors = {
    full: 'bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-700',
    empty: 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800',
    partial: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800',
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-center mb-8">
        <div className="w-48 h-8 bg-amber-200 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
          <span className="text-xs font-bold text-amber-800 dark:text-amber-400 tracking-widest">SAHNE / PIST</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
        {tableNumbers.map(tableName => {
          const tableSeats = tables[tableName];
          const status = getTableStatus(tableName);
          return (
            <div
              key={tableName}
              className={`border-2 rounded-xl p-3 ${tableStatusColors[status]} transition-all`}
            >
              {/* Table label */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{tableName}</span>
                <span className="text-xs text-slate-500">
                  {tableSeats.filter(s => s.status === 'available').length}/{tableSeats.length}
                </span>
              </div>
              {/* Circular table visualization */}
              <div className="flex items-center justify-center mb-2">
                <div className="relative w-16 h-16">
                  {/* Round table */}
                  <div className="absolute inset-2 rounded-full bg-amber-200 dark:bg-amber-800/60 border-2 border-amber-400 dark:border-amber-600" />
                  {/* Seats around table */}
                  {tableSeats.slice(0, 8).map((seat, idx) => {
                    const angle = (idx / Math.min(tableSeats.length, 8)) * 2 * Math.PI - Math.PI / 2;
                    const radius = 28;
                    const x = 32 + radius * Math.cos(angle) - 6;
                    const y = 32 + radius * Math.sin(angle) - 6;
                    return (
                      <button
                        key={seat.seatId}
                        onClick={() => handleClick(seat)}
                        style={{ left: x, top: y }}
                        className={`
                          absolute w-3 h-3 rounded-full border transition-all duration-150 text-[7px] flex items-center justify-center
                          ${getSeatClass(seat)} hover:scale-125
                          ${readOnly ? 'cursor-default' : ''}
                        `}
                        title={`${tableName}-${seat.seatNumber}`}
                      />
                    );
                  })}
                </div>
              </div>
              {/* Seat list */}
              <div className="flex flex-wrap gap-1 justify-center">
                {tableSeats.map(seat => (
                  <button
                    key={seat.seatId}
                    onClick={() => handleClick(seat)}
                    className={`
                      w-6 h-6 rounded text-[10px] font-medium border transition-all duration-150
                      ${getSeatClass(seat)}
                    `}
                    title={`${tableName}-${seat.seatNumber}`}
                  >
                    {seat.seatNumber}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main SeatMap component
export default function SeatMap({
  seats, venueType, selectedSeats = [], onSeatClick, readOnly = false, maxSelectable
}: SeatMapProps) {
  const { t } = useTranslation();

  const statuses: SeatStatus[] = ['available', 'occupied', 'reserved', 'vip', 'disabled', 'selected'];

  // Summary stats
  const stats = useMemo(() => ({
    total: seats.length,
    available: seats.filter(s => s.status === 'available').length,
    occupied: seats.filter(s => s.status === 'occupied').length,
    reserved: seats.filter(s => s.status === 'reserved').length,
  }), [seats]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Toplam', value: stats.total, color: 'text-slate-600 dark:text-slate-400' },
          { label: 'Boş', value: stats.available, color: 'text-green-600 dark:text-green-400' },
          { label: 'Dolu', value: stats.occupied, color: 'text-red-600 dark:text-red-400' },
          { label: 'Rezerve', value: stats.reserved, color: 'text-yellow-600 dark:text-yellow-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Selected count */}
      {!readOnly && selectedSeats.length > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
            {selectedSeats.length} {t('seatMap.selected')}
          </span>
          {maxSelectable && (
            <span className="text-xs text-primary-600 dark:text-primary-500">
              Maksimum: {maxSelectable}
            </span>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {statuses.filter(s => s !== 'blocked').map(status => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded border ${STATUS_CLASSES[status]}`} />
            <span className="text-xs text-slate-600 dark:text-slate-400">{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        {venueType === 'cinema' ? (
          <CinemaSeatMap
            seats={seats}
            selectedSeats={selectedSeats}
            onSeatClick={onSeatClick}
            readOnly={readOnly}
            maxSelectable={maxSelectable}
          />
        ) : (
          <TableSeatMap
            seats={seats}
            selectedSeats={selectedSeats}
            onSeatClick={onSeatClick}
            readOnly={readOnly}
            maxSelectable={maxSelectable}
          />
        )}
      </div>
    </div>
  );
}
