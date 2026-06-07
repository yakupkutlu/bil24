import { useEffect, useState } from 'react';
import { Save, Loader } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { pricingApi, eventsApi, sessionsApi } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, calculatePrice } from '../../lib/utils';
import PricingCategories from './PricingCategories';

interface FormData {
  kdv_rate: string;
  commission_rate: string;
}

type EventOption = { id: string; title: string };
type SessionOption = { id: string; session_date: string; start_time: string; hall?: { name: string } };

export default function PricingSettingsPage() {
  const { isAdmin, isOperator } = useAuth();
  const [searchParams] = useSearchParams();

  // Global ayarlar
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<FormData>({ kdv_rate: '18', commission_rate: '5' });
  const [previewPrice] = useState(100);

  // Seans kategori seçici
  const [events, setEvents] = useState<EventOption[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (!isAdmin && !isOperator) return;
    Promise.all([
      pricingApi.getSettings(),
      eventsApi.list(true),
    ])
      .then(([settings, evts]) => {
        if (settings) {
          setFormData({
            kdv_rate: settings.kdv_rate.toString(),
            commission_rate: settings.commission_rate.toString(),
          });
        }
        setEvents(evts.map(e => ({ id: e.id, title: e.title })));

        // URL'den gelen event_id ve session_id varsa ön-seç
        const paramEventId = searchParams.get('event_id');
        const paramSessionId = searchParams.get('session_id');
        if (paramEventId) {
          setSelectedEventId(paramEventId);
          sessionsApi.list({ event_id: paramEventId, status: 'active' })
            .then(data => {
              setSessions(data as SessionOption[]);
              if (paramSessionId) setSelectedSessionId(paramSessionId);
            })
            .catch(console.error);
        }
      })
      .catch(() => setError('Ayarlar yüklenemedi'))
      .finally(() => setLoading(false));
  }, [isAdmin, isOperator]);

  const handleEventChange = async (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedSessionId('');
    setSessions([]);
    if (!eventId) return;
    setLoadingSessions(true);
    try {
      const data = await sessionsApi.list({ event_id: eventId, status: 'active' });
      setSessions(data as SessionOption[]);
    } catch {
      setError('Seanslar yüklenemedi');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const kdvRate = parseFloat(formData.kdv_rate);
      const commissionRate = parseFloat(formData.commission_rate);
      if (isNaN(kdvRate) || isNaN(commissionRate) || kdvRate < 0 || commissionRate < 0) {
        setError('Lütfen geçerli değerler giriniz');
        return;
      }
      await pricingApi.saveSettings({ kdv_rate: kdvRate, commission_rate: commissionRate });
      setSuccess('Fiyatlandırma ayarları başarıyla kaydedildi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin && !isOperator) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Loader className="animate-spin" size={24} />
      </div>
    );
  }

  const kdvRate = parseFloat(formData.kdv_rate) || 0;
  const commissionRate = parseFloat(formData.commission_rate) || 0;
  const priceCalculation = calculatePrice(previewPrice, kdvRate, commissionRate);

  const formatSessionLabel = (s: SessionOption) => {
    const date = new Date(s.session_date).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const time = s.start_time?.slice(0, 5) || '';
    const hall = s.hall?.name ? ` — ${s.hall.name}` : '';
    return `${date} ${time}${hall}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">

        <h1 className="text-3xl font-bold text-gray-900">Fiyatlandırma</h1>

        {/* ─── Global Ayarlar ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Global Ayarlar</h2>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              {([['kdv_rate', 'KDV Oranı'], ['commission_rate', 'Komisyon Oranı']] as const).map(([name, label]) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      min="0" max="100" step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm">%</span>
                  </div>
                </div>
              ))}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
              >
                {saving && <Loader size={18} className="animate-spin" />}
                <Save size={18} /> Kaydet
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Fiyat Önizlemesi</h2>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Temel Fiyat</span>
                <span className="font-bold text-gray-900">{formatCurrency(previewPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Net Fiyat</span>
                <span className="font-medium text-gray-800">{formatCurrency(priceCalculation.netPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">KDV ({kdvRate}%)</span>
                <span className="font-medium text-gray-800">{formatCurrency(priceCalculation.kdvAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Komisyon ({commissionRate}%)</span>
                <span className="font-medium text-gray-800">{formatCurrency(priceCalculation.commissionAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Toplam</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(priceCalculation.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Seans Kategori Fiyatları ────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Seans Kategori Fiyatları</h2>
          <p className="text-sm text-gray-500 mb-6">
            Bir etkinlik ve seans seçerek Gold / Silver / Bronze fiyatlarını belirleyin.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik</label>
              <select
                value={selectedEventId}
                onChange={e => handleEventChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              >
                <option value="">Etkinlik seçiniz...</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seans</label>
              <div className="relative">
                <select
                  value={selectedSessionId}
                  onChange={e => setSelectedSessionId(e.target.value)}
                  disabled={!selectedEventId || loadingSessions}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">
                    {loadingSessions ? 'Yükleniyor...' : 'Seans seçiniz...'}
                  </option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{formatSessionLabel(s)}</option>
                  ))}
                </select>
                {loadingSessions && (
                  <Loader size={14} className="animate-spin absolute right-3 top-3 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {selectedSessionId ? (
            <PricingCategories sessionId={selectedSessionId} />
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl py-16 flex flex-col items-center justify-center text-gray-400">
              <div className="flex gap-3 text-4xl mb-3">🥇 🥈 🥉</div>
              <p className="text-sm">Fiyat kategorilerini görmek için etkinlik ve seans seçin</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
