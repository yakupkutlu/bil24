import React, { useEffect, useState } from 'react';
import {
  Save,
  Upload,
  Eye,
  Loader,
  X,
} from 'lucide-react';

import { ticketDesignApi } from '../../lib/api';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { cn } from '../../lib/utils';

interface TicketDesign {
  id?: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  created_at?: string;
  updated_at?: string;
}

const fontFamilies = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Raleway', label: 'Raleway' },
];

export default function TicketDesignPage() {
  const [design, setDesign] = useState<TicketDesign>({
    logo_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#8b5cf6',
    font_family: 'Inter',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchDesign();
  }, []);

  async function fetchDesign() {
    setLoading(true);
    try {
      const data = await ticketDesignApi.get();
      if (data) setDesign(data as TicketDesign);
    } catch (error) {
      console.error('Tasarım yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const logoUrl = await uploadToCloudinary(file);
      setDesign({ ...design, logo_url: logoUrl });
    } catch (error) {
      console.error('Logo yüklenirken hata:', error);
      alert('Logo yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!design.logo_url) {
      alert('Lütfen bir logo seçiniz');
      return;
    }

    setSaving(true);
    try {
      const updated = await ticketDesignApi.update({
        logo_url: design.logo_url,
        primary_color: design.primary_color,
        secondary_color: design.secondary_color,
        font_family: design.font_family,
      });
      if (updated) setDesign(updated as TicketDesign);
      alert('Tasarım başarıyla kaydedildi');
    } catch (error) {
      console.error('Tasarım kaydedilirken hata:', error);
      alert('Tasarım kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  }

  const TicketPreview = () => (
    <div
      className="w-full max-w-md mx-auto p-6 rounded-lg shadow-lg aspect-video flex flex-col justify-between"
      style={{
        backgroundColor: design.primary_color,
        fontFamily: design.font_family,
      }}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between">
        {design.logo_url ? (
          <img
            src={design.logo_url}
            alt="Logo"
            className="h-12 w-12 object-contain"
          />
        ) : (
          <div className="h-12 w-12 bg-white/20 rounded flex items-center justify-center text-white">
            Logo
          </div>
        )}
        <h3 className="text-white font-bold text-lg">BILET</h3>
      </div>

      {/* Event Details */}
      <div className="space-y-2 text-white">
        <p className="text-sm opacity-80">Etkinlik Adı</p>
        <p className="text-lg font-bold">Örnek Etkinlik</p>
        <div className="flex justify-between text-xs opacity-75 pt-2">
          <span>Tarih: 15.06.2026</span>
          <span>Saat: 20:00</span>
        </div>
      </div>

      {/* Ticket Info */}
      <div
        className="p-3 rounded text-white text-center text-sm"
        style={{ backgroundColor: design.secondary_color }}
      >
        <p className="font-mono font-bold">TKT123456789</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bilet Tasarımı
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Bilet görünümünü özelleştirin
        </p>
      </div>

      <div className={cn(
        'grid gap-6',
        isMobile ? 'grid-cols-1' : 'grid-cols-3'
      )}>
        {/* Design Controls */}
        <div className={cn(
          'space-y-6',
          isMobile ? 'col-span-1' : 'col-span-2'
        )}>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Logo
              </label>
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer block">
                    {uploading ? (
                      <Loader className="mx-auto animate-spin text-blue-600 mb-2" />
                    ) : (
                      <Upload className="mx-auto text-gray-400 mb-2" />
                    )}
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {uploading ? 'Yükleniyor...' : 'Resim seç veya buraya sürükle'}
                    </p>
                  </label>
                </div>

                {design.logo_url && (
                  <div className="relative inline-block">
                    <img
                      src={design.logo_url}
                      alt="Logo"
                      className="h-16 w-16 object-contain rounded bg-gray-100 dark:bg-gray-800 p-2"
                    />
                    <button
                      onClick={() => setDesign({ ...design, logo_url: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Birincil Renk
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={design.primary_color}
                      onChange={(e) =>
                        setDesign({ ...design, primary_color: e.target.value })
                      }
                      className="w-14 h-14 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <input
                    type="text"
                    value={design.primary_color}
                    onChange={(e) =>
                      setDesign({ ...design, primary_color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  İkincil Renk
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={design.secondary_color}
                      onChange={(e) =>
                        setDesign({ ...design, secondary_color: e.target.value })
                      }
                      className="w-14 h-14 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <input
                    type="text"
                    value={design.secondary_color}
                    onChange={(e) =>
                      setDesign({ ...design, secondary_color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Font Family Select */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Yazı Tipi
              </label>
              <select
                value={design.font_family}
                onChange={(e) =>
                  setDesign({ ...design, font_family: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fontFamilies.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Logo URL
              </label>
              <input
                type="url"
                value={design.logo_url}
                onChange={(e) =>
                  setDesign({ ...design, logo_url: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Cloudinary URL otomatik olarak ayarlanır veya manuel olarak yapıştırabilirsiniz
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Eye size={20} />
                <span>Önizleme</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save size={20} />
                <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className={cn(
          'bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
          isMobile ? 'col-span-1' : 'col-span-1'
        )}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Önizleme
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <TicketPreview />
          </div>
        </div>
      </div>
    </div>
  );
}
