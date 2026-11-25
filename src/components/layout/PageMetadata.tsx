import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { OG_IMAGE, SITE_NAME, getRouteSeo } from '../../data/seo';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.append(element);
  }
  element.content = content;
}

export function PageMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const seo = getRouteSeo(pathname);
    document.title = seo.fullTitle;

    upsertMeta('name', 'description', seo.description);
    upsertMeta('name', 'robots', seo.robots);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:type', seo.ogType);
    upsertMeta('property', 'og:title', seo.fullTitle);
    upsertMeta('property', 'og:description', seo.description);
    upsertMeta('property', 'og:url', seo.canonical);
    upsertMeta('property', 'og:image', OG_IMAGE);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', seo.fullTitle);
    upsertMeta('name', 'twitter:description', seo.description);
    upsertMeta('name', 'twitter:image', OG_IMAGE);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = seo.canonical;

    document.head.querySelectorAll('script[data-seo-jsonld="true"]').forEach((node) => node.remove());
    for (const entry of seo.jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoJsonld = 'true';
      script.textContent = JSON.stringify(entry);
      document.head.append(script);
    }
  }, [pathname]);
  return null;
}
