import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { AdminCrudStatus, AdminEndpointHint } from '@/components/admin/AdminCrudStatus';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ImageUpload } from '@/components/ui/FormControls';
import { eventsService } from '@/services/events.service';
import { useApiResource } from '@/hooks/useApiResource';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import { POSTER_PLACEHOLDER, normalizeEvent } from '@/utils/apiAdapters';
import type { Event, EventStatus } from '@/types';

type EventLanguage = 'tr' | 'en' | 'ar' | 'other';

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseCast(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, role] = line.split(/—|-/).map((part) => part.trim());

      return {
        name: name || line,
        role: role || 'Oyuncular'
      };
    });
}

function normalizeLanguage(value: string): EventLanguage {
  const map: Record<string, EventLanguage> = {
    tr: 'tr',
    Türkçe: 'tr',
    Turkish: 'tr',

    en: 'en',
    English: 'en',

    ar: 'ar',
    Arabic: 'ar',
    العربية: 'ar',

    other: 'other',
    Other: 'other'
  };

  return map[value] ?? 'other';
}

function normalizeAgeLimit(value: string | number | undefined) {
  if (value === undefined || value === null || value === '') return undefined;

  const numberValue = Number(String(value).replace('+', '').trim());

  return Number.isNaN(numberValue) ? undefined : numberValue;
}

function cleanOptionalString(value: string) {
  const clean = value.trim();

  return clean ? clean : undefined;
}

function cleanOptionalUrl(value: string) {
  const clean = value.trim();

  if (!clean) return undefined;

  // Prevent base64 image from being sent as trailerUrl.
  if (clean.startsWith('data:image')) return undefined;

  return clean;
}

function parseSeoKeywords(value: string) {
  return value
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

const emptyForm = {
  title: '',
  slug: '',
  shortDescription: '',
  description: '',
  category: 'Drama',
  status: 'DRAFT' as EventStatus,
  durationMinutes: 100,
  language: 'tr' as EventLanguage,
  director: '',
  ageLimit: '7',
  posterImage: '',
  trailerUrl: '',
  castText: '',
  seoTitle: '',
  seoKeywords: ''
};

export function AdminEventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const isEditing = Boolean(id);

  const eventQuery = useApiResource(
    ['admin-event-form', id],
    async () => {
      if (!id) return undefined;

      return normalizeEvent(await eventsService.getBySlug(id));
    },
    undefined,
    { enabled: Boolean(id) }
  );

  const event = eventQuery.data?.data;

  useEffect(() => {
    if (!event) return;

    setForm({
      title: event.title ?? '',
      slug: event.slug ?? '',
      shortDescription: event.shortDescription ?? '',
      description: event.description ?? '',
      category: event.category ?? 'Drama',
      status: event.status ?? 'DRAFT',
      durationMinutes: Number(event.durationMinutes) || 100,
      language: normalizeLanguage(String(event.language ?? 'tr')),
      director: event.director ?? '',
      ageLimit: String(event.ageLimit ?? '7').replace('+', ''),
      posterImage: event.posterImage ?? '',
      trailerUrl: event.trailerUrl ?? '',
      castText: Array.isArray(event.cast)
        ? event.cast.map((member) => `${member.name} — ${member.role ?? 'Cast'}`).join('\n')
        : '',
      seoTitle: `${event.title ?? ''} biletleri | Tiatru`,
      seoKeywords: `${event.category ?? ''}, tiyatro, bilet, Tiatru`
    });
  }, [event]);

  const previewEvent = useMemo<Event>(
    () => ({
      id: event?.id ?? 'preview',
      title: form.title || 'Yeni prodüksiyon',
      slug: form.slug || slugify(form.title || 'new-production'),
      shortDescription: form.shortDescription,
      description: form.description,
      category: form.category,
      status: form.status,
      durationMinutes: Number(form.durationMinutes) || 0,
      language: form.language,
      director: form.director,
      ageLimit: form.ageLimit,
      posterImage: form.posterImage || POSTER_PLACEHOLDER,
      gallery: [],
      cast: parseCast(form.castText),
      trailerUrl: form.trailerUrl
    }),
    [event?.id, form]
  );

  const saveMutation = useAdminMutation<Partial<Event>, Event>({
    mutationFn: (payload) => {
      if (isEditing && id) {
        // If the route param is a slug, use the real event id after loading.
        const updateTarget = event?.id ?? id;
        return eventsService.update(updateTarget, payload);
      }

      return eventsService.create(payload);
    },
    successMessage: isEditing ? 'Etkinlik başarıyla güncellendi.' : 'Etkinlik başarıyla oluşturuldu.',
    invalidate: ['admin-events'],
    onSuccess: () => navigate('/admin/events')
  });

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      status: form.status,
      durationMinutes: Math.max(1, Number(form.durationMinutes) || 1),
      language: normalizeLanguage(form.language),
      director: cleanOptionalString(form.director),
      ageLimit: normalizeAgeLimit(form.ageLimit),
      posterImage: form.posterImage || POSTER_PLACEHOLDER,
      gallery: [],
      trailerUrl: cleanOptionalUrl(form.trailerUrl),
      cast: parseCast(form.castText),
      seo: {
        title: cleanOptionalString(form.seoTitle),
        description: cleanOptionalString(form.shortDescription),
        keywords: parseSeoKeywords(form.seoKeywords)
      }
    };

    saveMutation.mutate(payload as unknown as Partial<Event>);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <AdminPageHeader
        eyebrow={isEditing ? 'Prodüksiyonu düzenle' : 'Yeni prodüksiyon'}
        title={isEditing ? `Düzenle ${event?.title ?? form.title}` : 'Yeni bir sahne hikâyesi oluştur.'}
        description="Durum, oyuncu kadrosu, medya, SEO alanları ve yayın durumunu içeren herkese açık etkinlik detaylarını kaydet."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/events')}>
              <ArrowLeft size={18} /> Geri
            </Button>

            <Button type="submit">
              <Save size={18} /> Kaydet event
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <AdminSectionCard
          title="Temel detaylar"
          description="Müşterilerin bilet almadan önce gördüğü bilgiler."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Başlık"
              value={form.title}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  title: e.target.value,
                  slug: current.slug || slugify(e.target.value)
                }))
              }
              placeholder="Kış Masalı"
              required
            />

            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => setField('slug', e.target.value)}
              placeholder="kis-masali"
              required
            />

            <Textarea
              label="Kısa açıklama"
              value={form.shortDescription}
              onChange={(e) => setField('shortDescription', e.target.value)}
              className="md:col-span-2"
              required
            />

            <Textarea
              label="Tam açıklama"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="md:col-span-2 min-h-36"
              required
            />

            <Select
              label="Kategori"
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
            >
              <option value="Drama">Drama</option>
              <option value="Komedi">Komedi</option>
              <option value="Müzikal">Müzikal</option>
              <option value="Çocuk">Çocuk</option>
              <option value="Deneysel">Deneysel</option>
            </Select>

            <Select
              label="Durum"
              value={form.status}
              onChange={(e) => setField('status', e.target.value as EventStatus)}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
              <option value="CANCELLED">CANCELLED</option>
            </Select>

            <Input
              label="Süre (dakika)"
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={(e) => setField('durationMinutes', Number(e.target.value))}
            />

            <Select
              label="Dil"
              value={form.language}
              onChange={(e) => setField('language', e.target.value as EventLanguage)}
            >
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="other">Other</option>
            </Select>

            <Input
              label="Yönetmen"
              value={form.director}
              onChange={(e) => setField('director', e.target.value)}
            />

            <Input
              label="Yaş sınırı"
              type="number"
              min={0}
              value={form.ageLimit}
              onChange={(e) => setField('ageLimit', e.target.value)}
              placeholder="7"
            />
          </div>
        </AdminSectionCard>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="aspect-[4/5] bg-black/30">
              {previewEvent.posterImage ? (
                <img
                  src={previewEvent.posterImage}
                  alt={previewEvent.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-white/35">
                  Poster preview
                </div>
              )}
            </div>

            <CardContent className="space-y-4 p-5">
              <Input
                label="Afiş görsel URL’si"
                value={form.posterImage}
                onChange={(e) => setField('posterImage', e.target.value)}
                placeholder="https://..."
              />

              <ImageUpload label="Afiş / galeri yükleme alanı" />

              <Button
                type="button"
                className="w-full"
                variant="outline"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    shortDescription:
                      current.shortDescription ||
                      'Perde açıldığında izleyiciyi içine çeken, unutulmaz ve duygusal bir sahne deneyimi.'
                  }))
                }
              >
                <Sparkles size={16} /> Generate emotional copy
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AdminSectionCard
        title="Oyuncular, fragman ve SEO"
        description="Keşif sayfalarını güzel ve aranabilir tut."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Fragman video URL’si"
            value={form.trailerUrl}
            onChange={(e) => setField('trailerUrl', e.target.value)}
            placeholder="https://youtube.com/..."
          />

          <Input
            label="SEO başlığı"
            value={form.seoTitle}
            onChange={(e) => setField('seoTitle', e.target.value)}
          />

          <Textarea
            label="Oyuncular"
            value={form.castText}
            onChange={(e) => setField('castText', e.target.value)}
            className="md:col-span-2"
            placeholder="Oyuncu adı — Rol"
          />

          <Input
            label="SEO anahtar kelimeleri"
            value={form.seoKeywords}
            onChange={(e) => setField('seoKeywords', e.target.value)}
            className="md:col-span-2"
            placeholder="Drama, tiyatro, bilet"
          />
        </div>

        <AdminEndpointHint>
          {isEditing ? 'Bağlı işlem: PUT /api/events/:id.' : 'Bağlı işlem: POST /api/events.'}
        </AdminEndpointHint>
      </AdminSectionCard>
    </form>
  );
}