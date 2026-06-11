import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ticketsApi, qrApi } from '../../lib/api';
import { Event, Hall, QRScanLog, Seat, Session, Ticket } from '../../types';
import { formatDate, formatTime } from '../../lib/utils';
import {
  AlertCircle, CheckCircle2, XCircle, Camera, Search,
  CameraOff, AlertTriangle, Clock, Ban,
} from 'lucide-react';

interface ScanResult {
  ticket: (Ticket & {
    session?: Session & { event?: Event; hall?: Hall };
    seat?: Seat;
  }) | null;
  status: 'success' | 'error' | 'duplicate' | 'cancelled' | 'expired';
  message: string;
  timestamp: Date;
}

const QR_DIV_ID = 'qr-reader';

export default function QRCheck() {
  const [manualCode,    setManualCode]    = useState('');
  const [scanResult,    setScanResult]    = useState<ScanResult | null>(null);
  const [scanHistory,   setScanHistory]   = useState<QRScanLog[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [cameraActive,  setCameraActive]  = useState(false);
  const [cameraError,   setCameraError]   = useState<string | null>(null);

  const qrRef          = useRef<Html5Qrcode | null>(null);
  const processScanRef = useRef<(data: string) => void>(() => {});

  // ── Tarama işlemi ────────────────────────────────────────────────────────────
  const processScan = async (qrCodeData: string) => {
    // Kamerayı hemen kapat
    setCameraActive(false);
    setLoading(true);

    try {
      let ticket: any;
      try {
        ticket = await ticketsApi.byQR(qrCodeData);
      } catch {
        setScanResult({ ticket: null, status: 'error', message: 'Bilet bulunamadı', timestamp: new Date() });
        return;
      }

      if (ticket.status === 'used') {
        setScanResult({ ticket, status: 'duplicate', message: 'Bu bilet daha önce okutuldu!', timestamp: new Date() });
        qrApi.log(ticket.id, 'duplicate', true).catch(console.error);
        return;
      }
      if (ticket.status === 'cancelled') {
        setScanResult({ ticket, status: 'cancelled', message: 'Bu bilet iptal edilmiştir', timestamp: new Date() });
        qrApi.log(ticket.id, 'cancelled', false).catch(console.error);
        return;
      }
      if (ticket.status === 'expired') {
        setScanResult({ ticket, status: 'expired', message: 'Bu biletin süresi dolmuştur', timestamp: new Date() });
        qrApi.log(ticket.id, 'expired', false).catch(console.error);
        return;
      }
      if (ticket.status === 'active') {
        await ticketsApi.update(ticket.id, { status: 'used', used_at: new Date().toISOString() });
        const refreshed = await ticketsApi.byQR(qrCodeData).catch(() => ticket);
        setScanResult({ ticket: refreshed, status: 'success', message: 'Bilet Geçerli — Giriş Onaylandı', timestamp: new Date() });
        qrApi.log(ticket.id, 'success', false).catch(console.error);
        fetchScanHistory().catch(console.error);
      }
    } catch (err) {
      console.error('processScan error:', err);
      setScanResult({ ticket: null, status: 'error', message: 'Bilet okuma sırasında hata oluştu', timestamp: new Date() });
    } finally {
      setLoading(false);
    }
  };

  processScanRef.current = processScan;

  // ── Kamera ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraActive) return;

    const qr = new Html5Qrcode(QR_DIV_ID);
    qrRef.current = qr;

    const config  = { fps: 10, qrbox: { width: 250, height: 250 } };
    const onSuccess = (decoded: string) => processScanRef.current(decoded);
    const onError   = () => {};

    qr.start({ facingMode: 'environment' }, config, onSuccess, onError)
      .catch(() =>
        qr.start({ facingMode: 'user' }, config, onSuccess, onError)
          .catch(() => {
            setCameraError('Kamera açılamadı. Tarayıcı kamera iznini kontrol edin.');
            setCameraActive(false);
          })
      );

    return () => {
      qr.stop().catch(() => {});
      qrRef.current = null;
    };
  }, [cameraActive]);

  const startCamera = () => {
    setCameraError(null);
    setScanResult(null);
    setCameraActive(true);
  };

  const stopCamera = () => setCameraActive(false);

  const fetchScanHistory = async () => {
    try {
      const data = await qrApi.list(10);
      setScanHistory(data);
    } catch (err) {
      console.error('Scan history yüklenemedi:', err);
    }
  };

  // ── Manuel arama ─────────────────────────────────────────────────────────────
  const handleManualSearch = async () => {
    if (!manualCode.trim()) return;
    setLoading(true);
    setCameraActive(false);
    try {
      let ticket: any;
      try {
        ticket = await ticketsApi.byCode(manualCode.toUpperCase());
      } catch {
        setScanResult({ ticket: null, status: 'error', message: 'Bilet kodu bulunamadı', timestamp: new Date() });
        return;
      }

      if (ticket.status === 'used') {
        setScanResult({ ticket, status: 'duplicate', message: 'Bu bilet daha önce okutuldu!', timestamp: new Date() });
        qrApi.log(ticket.id, 'duplicate', true).catch(console.error);
        return;
      }
      if (ticket.status === 'cancelled') {
        setScanResult({ ticket, status: 'cancelled', message: 'Bu bilet iptal edilmiştir', timestamp: new Date() });
        qrApi.log(ticket.id, 'cancelled', false).catch(console.error);
        return;
      }
      if (ticket.status === 'expired') {
        setScanResult({ ticket, status: 'expired', message: 'Bu biletin süresi dolmuştur', timestamp: new Date() });
        qrApi.log(ticket.id, 'expired', false).catch(console.error);
        return;
      }
      if (ticket.status === 'active') {
        await ticketsApi.update(ticket.id, { status: 'used', used_at: new Date().toISOString() });
        const refreshed = await ticketsApi.byCode(manualCode.toUpperCase()).catch(() => ticket);
        setScanResult({ ticket: refreshed, status: 'success', message: 'Bilet Geçerli — Giriş Onaylandı', timestamp: new Date() });
        qrApi.log(ticket.id, 'success', false).catch(console.error);
        fetchScanHistory().catch(console.error);
      }
    } catch (err) {
      setScanResult({ ticket: null, status: 'error', message: 'Bilet arama sırasında hata oluştu', timestamp: new Date() });
    } finally {
      setLoading(false);
    }
  };

  // ── Renk / ikon yardımcıları ─────────────────────────────────────────────────
  const statusConfig = {
    success: {
      bg:     'bg-green-50',
      border: 'border-green-400',
      header: 'bg-green-500',
      icon:   <CheckCircle2 size={40} className="text-white" />,
      label:  'GEÇERLİ BİLET',
    },
    duplicate: {
      bg:     'bg-red-50',
      border: 'border-red-400',
      header: 'bg-red-500',
      icon:   <AlertTriangle size={40} className="text-white" />,
      label:  'DAHA ÖNCE OKUTULDU',
    },
    cancelled: {
      bg:     'bg-orange-50',
      border: 'border-orange-400',
      header: 'bg-orange-500',
      icon:   <Ban size={40} className="text-white" />,
      label:  'İPTAL EDİLMİŞ BİLET',
    },
    expired: {
      bg:     'bg-orange-50',
      border: 'border-orange-400',
      header: 'bg-orange-500',
      icon:   <Clock size={40} className="text-white" />,
      label:  'SÜRESİ DOLMUŞ',
    },
    error: {
      bg:     'bg-red-50',
      border: 'border-red-400',
      header: 'bg-red-600',
      icon:   <XCircle size={40} className="text-white" />,
      label:  'HATA',
    },
  } as const;

  const cfg = scanResult ? statusConfig[scanResult.status] : null;
  const t   = scanResult?.ticket as any;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">QR Bilet Doğrulama</h1>

      {/* ── Kamera butonu ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex gap-3">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              <Camera size={20} /> Kamerayı Aç
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium"
            >
              <CameraOff size={20} /> Kamerayı Kapat
            </button>
          )}
        </div>

        {cameraError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {cameraError}
          </div>
        )}

        {/* Kamera önizleme */}
        <div
          id={QR_DIV_ID}
          style={{ display: cameraActive ? 'block' : 'none', width: '100%', minHeight: '300px' }}
          className="rounded-xl overflow-hidden bg-black"
        />

        {loading && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
            Bilet doğrulanıyor...
          </div>
        )}
      </div>

      {/* ── Manuel giriş ──────────────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-xl border border-gray-200">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Manuel Bilet Kodu</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
            placeholder="EBILET24-XXXXXXXX"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase text-sm"
          />
          <button
            onClick={handleManualSearch}
            disabled={loading || !manualCode.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 transition text-sm font-medium"
          >
            <Search size={18} /> Ara
          </button>
        </div>
      </div>

      {/* ── SONUÇ PANELİ ─────────────────────────────────────────────────── */}
      {scanResult && cfg && (
        <div className={`rounded-2xl border-2 overflow-hidden ${cfg.border} ${cfg.bg}`}>
          {/* Başlık şeridi */}
          <div className={`${cfg.header} px-6 py-4 flex items-center gap-4`}>
            {cfg.icon}
            <div>
              <p className="text-white font-black text-xl tracking-wide">{cfg.label}</p>
              <p className="text-white/80 text-sm">{scanResult.message}</p>
            </div>
            <span className="ml-auto text-white/70 text-xs">
              {scanResult.timestamp.toLocaleTimeString('tr-TR')}
            </span>
          </div>

          {/* Bilet bilgileri */}
          {scanResult.ticket && (
            <div className="px-6 py-5 grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Müşteri" value={t.customer_name} />

              {t.session?.event && (
                <InfoRow label="Etkinlik" value={t.session.event.title} wide />
              )}
              {t.session && (
                <InfoRow
                  label="Tarih / Saat"
                  value={`${formatDate(t.session.session_date)}  ${formatTime(t.session.start_time)}`}
                />
              )}
              {t.session?.hall && (
                <InfoRow label="Salon" value={t.session.hall.name} />
              )}
              {t.seat && (
                <InfoRow label="Koltuk" value={t.seat.seat_label} />
              )}
              {t.customer_phone && (
                <InfoRow label="Telefon" value={t.customer_phone} />
              )}

              {/* Daha önce okutulmuş ise ne zaman okutulduğunu göster */}
              {scanResult.status === 'duplicate' && t.used_at && (
                <InfoRow
                  label="İlk Okutma"
                  value={new Date(t.used_at).toLocaleString('tr-TR')}
                  wide
                  warn
                />
              )}

              <div className="col-span-2 pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-gray-500">Bilet Kodu</span>
                <span className="font-mono font-bold text-gray-800">{t.ticket_code}</span>
              </div>
            </div>
          )}

          {/* Yeniden tara butonu */}
          <div className="px-6 pb-5">
            <button
              onClick={startCamera}
              className="w-full py-2.5 rounded-xl border-2 border-current font-semibold text-sm transition hover:opacity-80
                         text-gray-700 border-gray-300 bg-white"
            >
              Yeni QR Okut
            </button>
          </div>
        </div>
      )}

      {/* ── Son okutmalar ─────────────────────────────────────────────────── */}
      {scanHistory.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Son Okutmalar</h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {scanHistory.map(log => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border-l-4 text-sm ${
                  log.is_duplicate
                    ? 'border-l-red-500 bg-red-50'
                    : 'border-l-green-500 bg-green-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {(log as any).ticket?.customer_name || 'Bilinmiyor'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{log.scan_result}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleTimeString('tr-TR')}
                    </p>
                    {log.is_duplicate && (
                      <span className="text-xs font-bold text-red-600">TEKRAR</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Yardımcı bileşen ──────────────────────────────────────────────────────────
function InfoRow({
  label, value, wide = false, warn = false,
}: { label: string; value: string; wide?: boolean; warn?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
      <p className={`font-semibold ${warn ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
