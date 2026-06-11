import { useEffect, useState } from 'react';
import { smsApi, SmsSettings } from '../lib/api';
import { Save, MessageSquare, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

type Provider = 'iletimerkezi' | 'twilio';

const PROVIDER_INFO: Record<Provider, { label: string; logo: string; color: string }> = {
  iletimerkezi: { label: 'İleti Merkezi', logo: '📨', color: 'blue' },
  twilio:       { label: 'Twilio',         logo: '🔵', color: 'red'  },
};

function SecretInput({
  label, value, onChange, placeholder, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function TextInput({
  label, value, onChange, placeholder, hint, maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function SmsSettingsPage() {
  const [activeProvider, setActiveProvider] = useState<Provider>('iletimerkezi');

  // İleti Merkezi fields
  const [imSender,  setImSender]  = useState('');
  const [imApiKey,  setImApiKey]  = useState('');
  const [imHashKey, setImHashKey] = useState('');

  // Twilio fields
  const [twSid,   setTwSid]   = useState('');
  const [twToken, setTwToken] = useState('');
  const [twFrom,  setTwFrom]  = useState('');

  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    smsApi.getSettings()
      .then(data => {
        if (!data) return;
        setActiveProvider((data.active_provider as Provider) || 'iletimerkezi');
        setImSender(data.im_sender || '');
        setImApiKey(data.im_api_key || '');
        setTwSid(data.twilio_account_sid || '');
        setTwFrom(data.twilio_from || '');
        // hash/token never returned — intentionally left blank
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeProvider === 'iletimerkezi' && !imApiKey.trim()) {
      setError('İleti Merkezi: API Anahtarı zorunludur'); return;
    }
    if (activeProvider === 'twilio') {
      if (!twSid.trim())   { setError('Twilio: Account SID zorunludur'); return; }
      if (!twFrom.trim())  { setError('Twilio: Telefon numarası (From) zorunludur'); return; }
    }

    setLoading(true);
    try {
      const payload: SmsSettings = {
        active_provider: activeProvider,
        im_sender:  imSender.trim() || undefined,
        im_api_key: imApiKey.trim() || undefined,
        twilio_account_sid: twSid.trim()   || undefined,
        twilio_from:        twFrom.trim()  || undefined,
      };
      if (imHashKey.trim()) payload.im_hash_key        = imHashKey.trim();
      if (twToken.trim())   payload.twilio_auth_token  = twToken.trim();

      await smsApi.saveSettings(payload);
      setSaved(true);
      setImHashKey('');
      setTwToken('');
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ayarlar kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <MessageSquare size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SMS API Ayarları</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">SMS sağlayıcısı seçin ve bilgileri girin</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Sağlayıcı Seçimi */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Aktif SMS Sağlayıcısı</p>
          <div className="grid grid-cols-2 gap-3">
            {(['iletimerkezi', 'twilio'] as Provider[]).map(p => {
              const info = PROVIDER_INFO[p];
              const isActive = activeProvider === p;
              return (
                <button key={p} type="button" onClick={() => setActiveProvider(p)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                  }`}>
                  <span className="text-2xl">{info.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {info.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-blue-500 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={11} /> Seçili
                      </p>
                    )}
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'border-blue-500' : 'border-gray-300 dark:border-gray-500'
                  }`}>
                    {isActive && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Seçilen sağlayıcı SMS gönderme işleminde kullanılır. Her iki sağlayıcının bilgilerini kaydedebilirsiniz.
          </p>
        </div>

        {/* İleti Merkezi Ayarları */}
        <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 shadow-sm transition-all ${
          activeProvider === 'iletimerkezi' ? 'border-blue-400' : 'border-gray-200 dark:border-gray-700 opacity-75'
        }`}>
          <div className={`px-5 py-3 border-b flex items-center gap-2 rounded-t-2xl ${
            activeProvider === 'iletimerkezi'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
          }`}>
            <span className="text-lg">📨</span>
            <span className="font-bold text-gray-800 dark:text-white text-sm">İleti Merkezi</span>
            {activeProvider === 'iletimerkezi' && (
              <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Aktif</span>
            )}
          </div>
          <div className="p-5 space-y-4">
            <TextInput
              label="Gönderici Adı (Başlık)"
              value={imSender}
              onChange={setImSender}
              placeholder="Boş bırakırsanız hesabınızdaki varsayılan kullanılır"
              hint="İleti Merkezi panelinizde onaylı başlık — boş bırakırsanız varsayılan kullanılır (tire '-' de geçerli)"
              maxLength={11}
            />
            <TextInput
              label="API Anahtarı"
              value={imApiKey}
              onChange={setImApiKey}
              placeholder="İleti Merkezi API Key"
            />
            <SecretInput
              label="Hash Key"
              value={imHashKey}
              onChange={setImHashKey}
              placeholder="Değiştirmek için girin (boş bırakırsanız eskisi korunur)"
              hint="Güvenlik nedeniyle gösterilmez. Değiştirmek istiyorsanız yeni değeri girin."
            />
          </div>
        </div>

        {/* Twilio Ayarları */}
        <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 shadow-sm transition-all ${
          activeProvider === 'twilio' ? 'border-blue-400' : 'border-gray-200 dark:border-gray-700 opacity-75'
        }`}>
          <div className={`px-5 py-3 border-b flex items-center gap-2 rounded-t-2xl ${
            activeProvider === 'twilio'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
          }`}>
            <span className="text-lg">🔵</span>
            <span className="font-bold text-gray-800 dark:text-white text-sm">Twilio</span>
            {activeProvider === 'twilio' && (
              <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Aktif</span>
            )}
          </div>
          <div className="p-5 space-y-4">
            <TextInput
              label="Account SID"
              value={twSid}
              onChange={setTwSid}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              hint="Twilio Console'dan (twilio.com/console)"
            />
            <SecretInput
              label="Auth Token"
              value={twToken}
              onChange={setTwToken}
              placeholder="Değiştirmek için girin (boş bırakırsanız eskisi korunur)"
              hint="Twilio Console'dan — güvenlik nedeniyle gösterilmez"
            />
            <TextInput
              label="Gönderen Twilio Numarası (From)"
              value={twFrom}
              onChange={setTwFrom}
              placeholder="+15017122661"
              hint="Twilio'dan aldığınız telefon numarası — E.164 formatında (+15017122661)"
            />
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400">
              <strong>Not:</strong> Twilio ile Türkiye numaralarına SMS göndermek için hesabınızın onaylı olması gerekir.
              Müşteri numaraları otomatik olarak +90 ülke koduyla E.164 formatına çevrilir.
            </div>
          </div>
        </div>

        {/* Mesaj + Hata */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        {saved && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
            <CheckCircle2 size={16} /> Ayarlar başarıyla kaydedildi
          </div>
        )}

        {/* Kaydet */}
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition shadow-md">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Kaydediliyor...</>
            : <><Save size={18} /> Ayarları Kaydet</>}
        </button>

        {/* SMS Önizleme */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">SMS mesaj önizlemesi</p>
          <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3 text-sm text-gray-700 dark:text-gray-300 font-mono">
            Bilet linkiniz: https://siteadresi.com/bilet/<span className="text-blue-600 dark:text-blue-400">EBILET24-XXXXXXXX</span>
          </div>
        </div>
      </form>
    </div>
  );
}
