import { useEffect } from 'react';

type SeoProps = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  image?: string;
};

const DEFAULT_TITLE = 'Tiatru | Modern Tiyatro Biletleri';
const DEFAULT_DESCRIPTION = 'Tiatru ile oyunları keşfet, koltuğunu seç, QR biletini al ve tiyatro geceni planla.';

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    if (property) tag.setAttribute('property', name);
    else tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

export function Seo({ title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, canonicalPath = '/', image = '/tiatru-logo.svg' }: SeoProps) {
  useEffect(() => {
    document.title = title;
    setMeta('description', description);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', 'website', true);
    setMeta('og:image', image, true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}${canonicalPath}`;
  }, [title, description, canonicalPath, image]);

  return null;
}
