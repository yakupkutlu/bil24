import { useEffect, useState } from 'react';
import { Loader, Save, Plus, Trash2, Edit2, X } from 'lucide-react';
import { pricingApi } from '../../lib/api';
import { PricingCategory, SeatStatus, SEAT_STATUS_LABELS } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface PricingCategoriesProps {
  sessionId: string;
}

// ─── Sabit Tier Tanımları ─────────────────────────────────────────────────────

interface Tier {
  name: 'Gold' | 'Silver' | 'Bronze';
  label: string;
  defaultStatus: SeatStatus;
  gradient: string;
  border: string;
  badge: string;
  icon: string;
  description: string;
}

const TIERS: Tier[] = [
  {
    name: 'Gold',
    label: 'Gold',
    defaultStatus: 'vip',
    gradient: 'from-yellow-50 to-amber-50',
    border: 'border-yellow-300',
    badge: 'bg-yellow-400 text-white',
    icon: '🥇',
    description: 'Altın Kategori',
  },
  {
    name: 'Silver',
    label: 'Silver',
    defaultStatus: 'reserved',
    gradient: 'from-gray-50 to-slate-100',
    border: 'border-gray-300',
    badge: 'bg-gray-400 text-white',
    icon: '🥈',
    description: 'Gümüş Kategori',
  },
  {
    name: 'Bronze',
    label: 'Bronze',
    defaultStatus: 'empty',
    gradient: 'from-orange-50 to-amber-100',
    border: 'border-orange-300',
    badge: 'bg-orange-400 text-white',
    icon: '🥉',
    description: 'Bronz Kategori',
  },
];

// ─── Özel Kategori Formu ──────────────────────────────────────────────────────

interface CustomFormData {
  category_name: string;
  seat_status_filter: SeatStatus;
  price: string;
}

const SEAT_STATUSES: SeatStatus[] = ['empty', 'occupied', 'reserved', 'vip', 'disabled'];

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export default function PricingCategories({ sessionId }: PricingCategoriesProps) {
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // hangi tier kaydediliyor
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tier fiyat düzenleme state'i
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [tierPrice, setTierPrice] = useState('');

  // Özel kategori
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customForm, setCustomForm] = useState<CustomFormData>({
    category_name: '',
    seat_status_filter: 'empty',
    price: '',
  });

  useEffect(() => {
    fetchCategories();
  }, [sessionId]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await pricingApi.getCategories(sessionId);
      setCategories(data || []);
    } catch {
      setError('Kategoriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 2000);
  };

  // Bir tier'ın mevcut kaydını bul
  const getTierCategory = (tierName: string) =>
    categories.find(c => c.category_name === tierName);

  // Tier fiyat kaydet / güncelle
  const handleSaveTier = async (tier: Tier) => {
    const price = parseFloat(tierPrice);
    if (isNaN(price) || price < 0) { setError('Geçerli bir fiyat girin'); return; }
    setError('');
    setSaving(tier.name);
    try {
      const existing = getTierCategory(tier.name);
      const payload = {
        session_id: sessionId,
        category_name: tier.name,
        seat_status_filter: tier.defaultStatus,
        price,
      };
      if (existing) {
        await pricingApi.updateCategory(existing.id, payload);
      } else {
        await pricingApi.createCategory(payload);
      }
      showSuccess(`${tier.label} fiyatı kaydedildi`);
      setEditingTier(null);
      setTierPrice('');
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
    } finally {
      setSaving(null);
    }
  };

  // Tier sil
  const handleDeleteTier = async (tier: Tier) => {
    const existing = getTierCategory(tier.name);
    if (!existing) return;
    if (!window.confirm(`${tier.label} fiyatlandırmasını kaldırmak istiyor musunuz?`)) return;
    try {
      await pricingApi.deleteCategory(existing.id);
      showSuccess(`${tier.label} kaldırıldı`);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi');
    }
  };

  // Özel kategori kaydet
  const handleSaveCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(customForm.price);
    if (!customForm.category_name.trim() || isNaN(price) || price < 0) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }
    setError('');
    setSaving('custom');
    try {
      const payload = {
        session_id: sessionId,
        category_name: customForm.category_name.trim(),
        seat_status_filter: customForm.seat_status_filter,
        price,
      };
      if (editingCustomId) {
        await pricingApi.updateCategory(editingCustomId, payload);
        showSuccess('Kategori güncellendi');
      } else {
        await pricingApi.createCategory(payload);
        showSuccess('Kategori eklendi');
      }
      setShowCustomForm(false);
      setEditingCustomId(null);
      setCustomForm({ category_name: '', seat_status_filter: 'empty', price: '' });
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
    } finally {
      setSaving(null);
    }
  };

  const openEditCustom = (cat: PricingCategory) => {
    setCustomForm({
      category_name: cat.category_name,
      seat_status_filter: cat.seat_status_filter,
      price: cat.price.toString(),
    });
    setEditingCustomId(cat.id);
    setShowCustomForm(true);
  };

  const handleDeleteCustom = async (cat: PricingCategory) => {
    if (!window.confirm(`"${cat.category_name}" kategorisini silmek istiyor musunuz?`)) return;
    try {
      await pricingApi.deleteCategory(cat.id);
      showSuccess('Kategori silindi');
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi');
    }
  };

  // Tier olmayan özel kategoriler
  const tierNames = TIERS.map(t => t.name);
  const customCategories = categories.filter(c => !tierNames.includes(c.category_name as any));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Kategori Fiyatlandırması</h2>
        <p className="text-sm text-gray-500">Her seans için Gold / Silver / Bronze fiyatlarını belirleyin</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>
      )}

      {/* ─── Tier Kartları ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TIERS.map(tier => {
          const existing = getTierCategory(tier.name);
          const isEditing = editingTier === tier.name;
          const isSaving = saving === tier.name;

          return (
            <div
              key={tier.name}
              className={`rounded-xl border-2 ${tier.border} bg-gradient-to-br ${tier.gradient} p-5 shadow-sm`}
            >
              {/* Başlık */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tier.icon}</span>
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${tier.badge}`}>
                      {tier.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">{tier.description}</p>
                  </div>
                </div>
                {existing && !isEditing && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingTier(tier.name); setTierPrice(existing.price.toString()); }}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-gray-600 transition"
                      title="Düzenle"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTier(tier)}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition"
                      title="Kaldır"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Mevcut fiyat veya düzenleme alanı */}
              {isEditing ? (
                <div className="space-y-2 mt-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={tierPrice}
                      onChange={e => setTierPrice(e.target.value)}
                      placeholder="Fiyat"
                      min="0"
                      step="0.01"
                      autoFocus
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white"
                    />
                    <span className="text-gray-500 font-medium text-sm">₺</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveTier(tier)}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm py-1.5 rounded-lg transition font-medium"
                    >
                      {isSaving ? <Loader size={13} className="animate-spin" /> : <Save size={13} />}
                      Kaydet
                    </button>
                    <button
                      onClick={() => { setEditingTier(null); setTierPrice(''); }}
                      className="p-1.5 bg-white/60 hover:bg-white rounded-lg text-gray-600 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : existing ? (
                <div className="mt-4 pt-3 border-t border-white/60">
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(existing.price)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {SEAT_STATUS_LABELS[existing.seat_status_filter]}
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  <button
                    onClick={() => { setEditingTier(tier.name); setTierPrice(''); }}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-700 py-3 rounded-lg transition text-sm font-medium bg-white/40 hover:bg-white/60"
                  >
                    <Plus size={16} /> Fiyat Belirle
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Özel Kategoriler ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Özel Kategoriler</h3>
          {!showCustomForm && (
            <button
              onClick={() => { setShowCustomForm(true); setEditingCustomId(null); setCustomForm({ category_name: '', seat_status_filter: 'empty', price: '' }); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm"
            >
              <Plus size={16} /> Ekle
            </button>
          )}
        </div>

        {showCustomForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900">{editingCustomId ? 'Kategoriyi Düzenle' : 'Yeni Özel Kategori'}</h4>
              <button onClick={() => { setShowCustomForm(false); setEditingCustomId(null); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveCustom} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Adı *</label>
                  <input
                    type="text"
                    value={customForm.category_name}
                    onChange={e => setCustomForm(p => ({ ...p, category_name: e.target.value }))}
                    placeholder="örn: Öğrenci, Engelli"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Koltuk Durumu *</label>
                  <select
                    value={customForm.seat_status_filter}
                    onChange={e => setCustomForm(p => ({ ...p, seat_status_filter: e.target.value as SeatStatus }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  >
                    {SEAT_STATUSES.map(s => <option key={s} value={s}>{SEAT_STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺) *</label>
                  <input
                    type="number"
                    value={customForm.price}
                    onChange={e => setCustomForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving === 'custom'}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium"
                >
                  {saving === 'custom' && <Loader size={14} className="animate-spin" />}
                  {editingCustomId ? 'Güncelle' : 'Ekle'}
                </button>
                <button type="button" onClick={() => { setShowCustomForm(false); setEditingCustomId(null); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm">
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {customCategories.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Henüz özel kategori eklenmedi</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customCategories.map(cat => (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{cat.category_name}</h4>
                    <p className="text-xs text-gray-500">{SEAT_STATUS_LABELS[cat.seat_status_filter]}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditCustom(cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Düzenle">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDeleteCustom(cat)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Sil">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-3 pt-3 border-t border-gray-100">
                  {formatCurrency(cat.price)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
