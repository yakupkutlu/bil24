import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, useTranslation } from '../../utils/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarPage() {
  const { t } = useTranslation();
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const { data } = useQuery({
    queryKey: ['sessions-calendar'],
    queryFn: () => api.get('/sessions?limit=500').then(r => r.data),
  });

  const events = (data?.data ?? []).map((s: any) => ({
    id: s.id,
    title: `${s.event?.title} — ${s.venue?.name}`,
    date: s.session_date?.split('T')[0],
    start: `${s.session_date?.split('T')[0]}T${s.start_time}`,
    extendedProps: { session: s },
    backgroundColor: s.status === 'cancelled' ? '#ef4444' : s.status === 'completed' ? '#6b7280' : '#6366f1',
    borderColor: 'transparent',
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.calendar')}</h1>
      <div className="card">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          events={events}
          locale="tr"
          height="auto"
          eventClick={(info) => setSelectedSession(info.event.extendedProps.session)}
          buttonText={{ today: t('calendar.today'), month: t('calendar.month'), week: t('calendar.week'), day: t('calendar.day') }}
        />
      </div>

      {selectedSession && (
        <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedSession.event?.title}</h2>
              <button onClick={() => setSelectedSession(null)} className="modal-close">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{t('sessions.venue')}</span><span className="font-medium">{selectedSession.venue?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('sessions.date')}</span><span className="font-medium">{new Date(selectedSession.session_date).toLocaleDateString('tr-TR')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('sessions.time')}</span><span className="font-medium">{selectedSession.start_time}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('sessions.duration')}</span><span className="font-medium">{selectedSession.duration_minutes} dk</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('sessions.occupancy')}</span><span className="font-medium">{selectedSession.sold_count}/{selectedSession.capacity}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('common.status')}</span>
                <span className={`badge ${selectedSession.status === 'scheduled' ? 'badge-blue' : 'badge-gray'}`}>{t(`sessions.status.${selectedSession.status}`)}</span>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setSelectedSession(null)} className="btn-outline">{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
