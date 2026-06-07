import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { eventsApi } from '../../lib/api';
import { uploadToCloudinary } from '../../lib/cloudinary';

const CATEGORIES = ['Tiyatro', 'Konser', 'Sinema', 'Spor', 'Stand-up', 'Diğer'];

const SAMPLE_IMAGES = [
  'https://images.pexels.com/photos/2609/pexels-photo-2609.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1105663/pexels-photo-1105663.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800'
];

export default function EventForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(id ? true : false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slogan: '',
    description: '',
    poster_url: '',
    cover_url: '',
    category: 'Konser',
    start_date: '',
    end_date: '',
    is_active: true
  });

  const [posterPreview, setPosterPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [posterUploading, setPosterUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    if (!id) return;

    try {
      const data = await eventsApi.get(id);
      setIsEditMode(true);
      setFormData({
        title: data.title,
        slogan: data.slogan || '',
        description: data.description || '',
        poster_url: data.poster_url || '',
        cover_url: data.cover_url || '',
        category: data.category ?? 'Konser',
        start_date: data.start_date.split('T')[0],
        end_date: (data.end_date || '').split('T')[0],
        is_active: data.is_active
      });
      setPosterPreview(data.poster_url || '');
      setCoverPreview(data.cover_url || '');
    } catch (error) {
      console.error('Error fetching event:', error);
      alert('Etkinlik yüklenirken hata oluştu');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPosterUploading(true);

      const url = await uploadToCloudinary(file);
      setFormData(prev => ({ ...prev, poster_url: url }));
      setPosterPreview(url);
    } catch (error) {
      console.error('Error uploading poster:', error);
      alert('Afişi yüklerken hata oluştu');
    } finally {
      setPosterUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCoverUploading(true);

      const url = await uploadToCloudinary(file);
      setFormData(prev => ({ ...prev, cover_url: url }));
      setCoverPreview(url);
    } catch (error) {
      console.error('Error uploading cover:', error);
      alert('Kapak resmini yüklerken hata oluştu');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Etkinlik adı gereklidir');
      return;
    }

    try {
      setSubmitting(true);

      const eventData = {
        title: formData.title,
        slogan: formData.slogan,
        description: formData.description,
        poster_url: formData.poster_url,
        cover_url: formData.cover_url,
        category: formData.category,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        is_active: formData.is_active
      };

      if (isEditMode && id) {
        await eventsApi.update(id, eventData);
      } else {
        await eventsApi.create(eventData);
      }

      navigate('/events');
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Etkinlik kaydedilirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={20} />
          Geri Dön
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {isEditMode ? 'Etkinliği Düzenle' : 'Yeni Etkinlik Oluştur'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Etkinlik Adı *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Etkinlik adını girin"
              />
            </div>

            {/* Slogan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Slogan
              </label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Etkinlik sloganını girin"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Etkinlik açıklamasını girin"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Poster Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Afişi Yükle
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {posterPreview ? (
                  <div className="relative inline-block w-full">
                    <img
                      src={posterPreview}
                      alt="Poster preview"
                      className="max-h-64 rounded-lg mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, poster_url: '' });
                        setPosterPreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block text-center">
                    <div className="flex justify-center mb-2">
                      <Upload className="text-gray-400" size={32} />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {posterUploading ? 'Yükleniyor...' : 'Afişi seçmek için tıklayın'}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePosterUpload}
                      disabled={posterUploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Cover Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kapak Resmini Yükle
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {coverPreview ? (
                  <div className="relative inline-block w-full">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="max-h-64 rounded-lg mx-auto w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, cover_url: '' });
                        setCoverPreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block text-center">
                    <div className="flex justify-center mb-2">
                      <Upload className="text-gray-400" size={32} />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {coverUploading ? 'Yükleniyor...' : 'Kapak resmini seçmek için tıklayın'}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={coverUploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Sample Images */}
            {!formData.poster_url && (
              <div>
                <p className="text-sm text-gray-600 mb-3">Örnek resimleri kullan:</p>
                <div className="grid grid-cols-3 gap-3">
                  {SAMPLE_IMAGES.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, poster_url: imgUrl });
                        setPosterPreview(imgUrl);
                      }}
                      className="rounded-lg overflow-hidden hover:opacity-75 transition"
                    >
                      <img src={imgUrl} alt="Sample" className="w-full h-24 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 cursor-pointer"
              />
              <label className="text-sm font-semibold text-gray-700">
                Etkinliği Aktif Yap
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
              >
                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
