// ============================================================
// TicketScanPage - Bilet QR Doğrulama Sayfası
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  QrCode, CheckCircle, XCircle, AlertTriangle, Clock,
  User, MapPin, Calendar, Ticket, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import type { ScanResult } from '../../types';
import { format } from 'date-fns';
import { tr as trLocale } from 'date-fns/locale';

export default function TicketScanPage() {
  const { t } = useTranslation();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const handleScanResult = async (qrCode: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await api.post<ScanResult>('/tickets/scan', { qrCode });
      setScanResult(data);
      if (data.success) {
        toast.success('Bilet geçerli!');
      } else if (data.result === 'already_used') {
        toast.error('Bu bilet daha önce okutuldu!');
      } else {
        toast.error(data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    handleScanResult(manualCode.trim());
    setManualCode('');
  };

  const startCamera = () => {
    setScannerActive(true);
  };

  useEffect(() => {
    if (scannerActive && scannerContainerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        false
      );
      scanner.render(
        (decodedText) => {
          scanner.clear();
          setScannerActive(false);
          handleScanResult(decodedText);
        },
        () => {}
      );
      scannerRef.current = scanner;
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [scannerActive]);

  const reset = () => {
    setScanResult(null);
    setScannerActive(false);
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
  };

  const getResultConfig = (result: ScanResult) => {
    switch (result.result) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-300 dark:border-green-700',
          title: '✓ Bilet Geçerli',
          titleColor: 'text-green-700 dark:text-green-400',
        };
      case 'already_used':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-500 dark:border-red-600',
          title: '⚠ Bu Bilet Daha Önce Okutuldu!',
          titleColor: 'text-red-700 dark:text-red-400',
        };
      case 'invalid':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-300 dark:border-red-700',
          title: '✗ Geçersiz Bilet',
          titleColor: 'text-red-700 dark:text-red-400',
        };
      case 'expired':
        return {
          icon: Clock,
          color: 'text-orange-600',
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-300 dark:border-orange-700',
          title: '⏱ Bilet Süresi Dolmuş',
          titleColor: 'text-orange-700 dark:text-orange-400',
        };
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <QrCode className="w-7 h-7 text-primary-600" />
          {t('tickets.scanTitle')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('tickets.scanInstructions')}</p>
      </div>

      {/* Result */}
      {scanResult && (() => {
        const config = getResultConfig(scanResult);
        const Icon = config.icon;
        return (
          <div className={`rounded-2xl border-2 ${config.border} ${config.bg} p-6 space-y-4 animate-scale-in`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Icon className={`w-8 h-8 ${config.color}`} />
                <h2 className={`text-xl font-bold ${config.titleColor}`}>{config.title}</h2>
              </div>
              <button
                onClick={reset}
                className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                title="Yeni tarama"
              >
                <RotateCcw className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Already used warning banner */}
            {scanResult.result === 'already_used' && (
              <div className="bg-red-600 text-white rounded-xl px-4 py-3 text-sm font-bold text-center border-2 border-red-700">
                🚫 Bu bilet daha önce okutuldu. Giriş reddedildi!
              </div>
            )}

            {/* Ticket info */}
            {scanResult.ticket && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <Ticket className="w-4 h-4 text-primary-600" />
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {scanResult.ticket.ticketNumber}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-slate-500 text-xs">Bilet Sahibi</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{scanResult.ticket.buyerName}</p>
                    </div>
                  </div>
                  {scanResult.ticket.seatCode && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-slate-500 text-xs">Koltuk</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{scanResult.ticket.seatCode}</p>
                      </div>
                    </div>
                  )}
                  {scanResult.ticket.event && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-slate-500 text-xs">Etkinlik</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{scanResult.ticket.event}</p>
                      </div>
                    </div>
                  )}
                  {scanResult.ticket.sessionDate && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-slate-500 text-xs">Tarih / Saat</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {scanResult.ticket.sessionDate} - {scanResult.ticket.sessionTime}
                        </p>
                      </div>
                    </div>
                  )}
                  {scanResult.ticket.venue && (
                    <div className="flex items-start gap-2 col-span-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-slate-500 text-xs">Salon</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{scanResult.ticket.venue}</p>
                      </div>
                    </div>
                  )}
                </div>
                {scanResult.result === 'already_used' && scanResult.scannedAt && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                      İlk okutma: {new Date(scanResult.scannedAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                )}
              </div>
            )}

            <button onClick={reset} className="btn-primary w-full">
              <RotateCcw className="w-4 h-4" />
              Yeni Tarama Yap
            </button>
          </div>
        );
      })()}

      {/* Scanner */}
      {!scanResult && (
        <div className="grid gap-4">
          {/* Camera scanner */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Kamera ile Tara
            </h3>
            {!scannerActive ? (
              <button
                onClick={startCamera}
                className="btn-primary w-full py-3"
                disabled={loading}
              >
                <QrCode className="w-5 h-5" />
                Kamerayı Başlat
              </button>
            ) : (
              <div className="qr-scanner-container">
                <div id="qr-reader" ref={scannerContainerRef} />
                <button
                  onClick={() => setScannerActive(false)}
                  className="mt-2 btn-secondary w-full text-sm"
                >
                  Kamerayı Kapat
                </button>
              </div>
            )}
          </div>

          {/* Manual input */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Manuel Bilet No / QR Kodu</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                placeholder="Bilet numarası veya QR kodu yapıştırın..."
                className="form-input flex-1"
                disabled={loading}
              />
              <button
                onClick={handleManualSubmit}
                className="btn-primary"
                disabled={loading || !manualCode.trim()}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Sorgula'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
