import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ticketsApi, qrApi } from '../../lib/api';
import { Event, Hall, QRScanLog, Seat, Session, Ticket } from '../../types';
import { formatDate, formatTime, formatDateTime } from '../../lib/utils';
import { AlertCircle, CheckCircle, XCircle, Camera, Search } from 'lucide-react';

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
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<QRScanLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const qrRef = useRef<Html5Qrcode | null>(null);
  const processScanRef = useRef<(data: string) => void>(() => {});

  const processScan = async (qrCodeData: string) => {
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
        const updated = await ticketsApi.update(ticket.id, { status: 'used', used_at: new Date().toISOString() });
        const refreshed = await ticketsApi.byQR(qrCodeData).catch(() => null);
        setScanResult({ ticket: refreshed || updated, status: 'success', message: 'Bilet doğrulandı!', timestamp: new Date() });
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

  // Her render'da ref güncelle — scanner callback'i hep güncel fonksiyonu çağırır
  processScanRef.current = processScan;

  useEffect(() => {
    if (!cameraActive) return;

    const qr = new Html5Qrcode(QR_DIV_ID);
    qrRef.current = qr;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    const onSuccess = (decodedText: string) => processScanRef.current(decodedText);
    const onError = () => {};

    // Arka kamera → yoksa ön kamera
    qr.start({ facingMode: 'environment' }, config, onSuccess, onError)
      .catch(() =>
        qr.start({ facingMode: 'user' }, config, onSuccess, onError)
          .catch(() => {
            setCameraError('Kamera açılamadı. Lütfen tarayıcı kamera iznini kontrol edin.');
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
    setCameraActive(true);
  };

  const stopCamera = () => {
    setCameraActive(false); // useEffect cleanup kamerayı durdurur
  };

  const fetchScanHistory = async () => {
    try {
      const data = await qrApi.list(10);
      setScanHistory(data);
    } catch (err) {
      console.error('Scan history yüklenemedi:', err);
    }
  };

  const handleManualSearch = async () => {
    if (!manualCode.trim()) return;
    setLoading(true);
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
        const updated = await ticketsApi.update(ticket.id, { status: 'used', used_at: new Date().toISOString() });
        const refreshed = await ticketsApi.byCode(manualCode.toUpperCase()).catch(() => null);
        setScanResult({ ticket: refreshed || updated, status: 'success', message: 'Bilet doğrulandı!', timestamp: new Date() });
        qrApi.log(ticket.id, 'success', false).catch(console.error);
        fetchScanHistory().catch(console.error);
      }
    } catch (err) {
      console.error('Manuel arama hatası:', err);
      setScanResult({ ticket: null, status: 'error', message: 'Bilet arama sırasında hata oluştu', timestamp: new Date() });
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = () => {
    switch (scanResult?.status) {
      case 'success': return <CheckCircle size={32} className="text-green-600" />;
      case 'error':   return <XCircle size={32} className="text-red-600" />;
      default:        return <AlertCircle size={32} className="text-orange-600" />;
    }
  };

  const getResultBorderClass = () => {
    switch (scanResult?.status) {
      case 'success': return 'border-green-500 bg-green-50';
      case 'error':   return 'border-red-500 bg-red-50';
      default:        return 'border-orange-500 bg-orange-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">QR Bilet Doğrulama</h1>

      <div className="space-y-4">
        <div className="flex gap-3">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Camera size={20} /> Kamerayı Aç
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Camera size={20} /> Kamerayı Kapat
            </button>
          )}
        </div>

        {cameraError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {cameraError}
          </div>
        )}

        {/* Html5Qrcode bu div'in içine video stream'i yerleştirir */}
        <div
          id={QR_DIV_ID}
          style={{ display: cameraActive ? 'block' : 'none', width: '100%', minHeight: '300px' }}
          className="rounded-lg overflow-hidden bg-black"
        />
      </div>

      {/* Manuel Giriş */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Manuel Bilet Giriş</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
            placeholder="Bilet kodu girin (örn: BOS-XXXXXXXX)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
          />
          <button
            onClick={handleManualSearch}
            disabled={loading || !manualCode.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
          >
            <Search size={20} /> Ara
          </button>
        </div>
      </div>

      {/* Sonuç */}
      {scanResult && (
        <div className={`border-2 rounded-lg p-6 ${getResultBorderClass()} transition-all`}>
          <div className="flex items-start gap-4">
            <div>{getResultIcon()}</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{scanResult.message}</h2>
              {scanResult.ticket && (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Müşteri:</span>
                    <p className="text-gray-900">{scanResult.ticket.customer_name}</p>
                  </div>
                  {(scanResult.ticket as any).session?.event && (
                    <div>
                      <span className="font-semibold text-gray-700">Etkinlik:</span>
                      <p className="text-gray-900">{(scanResult.ticket as any).session.event.title}</p>
                    </div>
                  )}
                  {(scanResult.ticket as any).session && (
                    <div>
                      <span className="font-semibold text-gray-700">Tarih ve Saat:</span>
                      <p className="text-gray-900">
                        {formatDate((scanResult.ticket as any).session.session_date)}{' '}
                        {formatTime((scanResult.ticket as any).session.start_time)}
                      </p>
                    </div>
                  )}
                  {(scanResult.ticket as any).session?.hall && (
                    <div>
                      <span className="font-semibold text-gray-700">Salon:</span>
                      <p className="text-gray-900">{(scanResult.ticket as any).session.hall.name}</p>
                    </div>
                  )}
                  {(scanResult.ticket as any).seat && (
                    <div>
                      <span className="font-semibold text-gray-700">Koltuk:</span>
                      <p className="text-gray-900">{(scanResult.ticket as any).seat.seat_label}</p>
                    </div>
                  )}
                  {scanResult.ticket.status === 'used' && scanResult.ticket.used_at && (
                    <div>
                      <span className="font-semibold text-gray-700">Kullanım Tarihi:</span>
                      <p className="text-gray-900">
                        {formatDateTime(
                          scanResult.ticket.used_at.split('T')[0],
                          scanResult.ticket.used_at.split('T')[1]
                        )}
                      </p>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">Bilet Kodu:</span>
                    <p className="font-mono text-gray-900">{scanResult.ticket.ticket_code}</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-4">
                {scanResult.timestamp.toLocaleTimeString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Son Okutmalar */}
      {scanHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Son Okutmalar</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scanHistory.map(log => (
              <div
                key={log.id}
                className={`p-3 rounded border-l-4 ${
                  log.is_duplicate
                    ? 'border-l-orange-500 bg-orange-50'
                    : 'border-l-green-500 bg-green-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">
                      {(log as any).ticket?.customer_name || 'Bilinmiyor'}
                    </p>
                    <p className="text-xs text-gray-600">{log.scan_result}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleTimeString('tr-TR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
