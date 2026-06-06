import { useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, CameraOff, Keyboard, ScanLine } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function QRCodeScanner({ onScan }: { onScan?: (token: string) => void }) {
  const [token, setToken] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | undefined>();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastTokenRef = useRef('');
  const lastScanAtRef = useRef(0);

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(undefined);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Bu tarayıcı kamera erişimini desteklemiyor. Manuel QR token girişi kullan.');
      return;
    }

    if (!videoRef.current) {
      setCameraError('Kamera önizlemesi hazır değil. Tekrar dene.');
      return;
    }

    try {
      const reader = new BrowserQRCodeReader();

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (!result) return;

          const rawValue = result.getText().trim();
          const now = Date.now();

          if (!rawValue) return;

          const isDuplicate =
            rawValue === lastTokenRef.current && now - lastScanAtRef.current < 2500;

          if (isDuplicate) return;

          lastTokenRef.current = rawValue;
          lastScanAtRef.current = now;

          setToken(rawValue);
          onScan?.(rawValue);

          stopCamera();
        }
      );

      controlsRef.current = controls;
      setCameraActive(true);
    } catch (error) {
      console.error(error);
      setCameraError(error instanceof Error ? error.message : 'Kamera izni reddedildi.');
      stopCamera();
    }
  };

  const handleManualScan = () => {
    const cleanToken = token.trim();
    if (!cleanToken) return;
    onScan?.(cleanToken);
  };

  return (
    <Card className="overflow-hidden border-dashed">
      <CardContent className="grid min-h-72 place-items-center p-5">
        <div className="w-full max-w-md text-center text-white/65">
          <div className="relative overflow-hidden rounded-[2rem] border border-theater-gold/20 bg-black/35 p-3">
            <div className="relative">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className={`h-64 w-full rounded-3xl object-cover ${
                  cameraActive ? 'block' : 'hidden'
                }`}
              />

              {!cameraActive && (
                <div className="grid h-64 place-items-center rounded-3xl bg-gradient-to-br from-theater-red/20 to-theater-gold/10">
                  <div>
                    <Camera className="mx-auto mb-3 text-theater-gold" size={46} />
                    <p className="font-semibold text-white">Gerçek QR tarayıcı hazır</p>
                    <p className="mt-1 text-xs text-white/45">
                      Bilet QR kodlarını taramak için kamerayı başlat.
                    </p>
                  </div>
                </div>
              )}

              {cameraActive && (
                <>
                  <div className="pointer-events-none absolute inset-8 rounded-3xl border-2 border-theater-gold/80 shadow-glow" />
                  <ScanLine
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 animate-pulse text-theater-gold"
                    size={48}
                  />
                </>
              )}
            </div>
          </div>

          {cameraError && (
            <p className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-3 text-xs text-yellow-100">
              {cameraError}
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {!cameraActive ? (
              <Button onClick={startCamera}>
                <Camera size={16} /> Kamerayı başlat
              </Button>
            ) : (
              <Button variant="danger" onClick={stopCamera}>
                <CameraOff size={16} /> Kamerayı durdur
              </Button>
            )}
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[.035] p-4 text-left">
            <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[.24em] text-theater-gold">
              <Keyboard size={14} /> Manuel QR token
            </p>

            <div className="flex gap-2">
              <Input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Bilet QR tokenını yapıştır"
              />
              <Button onClick={handleManualScan}>Tara</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}