export function openShareSheet({ title, text, url }: { title: string; text?: string; url: string }) {
  if (navigator.share) {
    return navigator.share({ title, text, url });
  }
  return Promise.reject(new Error("Web Share API not supported"));
}

export function copyLink(url: string) {
  return navigator.clipboard.writeText(url);
}

export function getWhatsAppShareUrl(text: string, url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
}

export function getFacebookShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

function absoluteUrl(value?: string | null) {
  if (!value) return `${window.location.origin}/brand/nakudin-og.png`;
  try {
    return new URL(value, window.location.origin).toString();
  } catch {
    return `${window.location.origin}/brand/nakudin-og.png`;
  }
}

export function updateOgMeta({ title, description, image, url }: { title: string; description: string; image?: string | null; url: string }) {
  const ensure = (selector: string, attr: string, value: string) => {
    let el = document.head.querySelector(selector) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      const match = selector.match(/\[(name|property)=\"([^\"]+)\"\]/);
      if (match) el.setAttribute(match[1], match[2]);
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  };

  document.title = title;
  ensure('meta[property="og:title"]', 'content', title);
  ensure('meta[property="og:description"]', 'content', description);
  ensure('meta[property="og:url"]', 'content', absoluteUrl(url));
  ensure('meta[property="og:type"]', 'content', 'website');
  ensure('meta[property="og:image"]', 'content', absoluteUrl(image));
  ensure('meta[property="og:image:width"]', 'content', '1200');
  ensure('meta[property="og:image:height"]', 'content', '630');
  ensure('meta[name="twitter:card"]', 'content', 'summary_large_image');
  ensure('meta[name="twitter:title"]', 'content', title);
  ensure('meta[name="twitter:description"]', 'content', description);
  ensure('meta[name="twitter:image"]', 'content', absoluteUrl(image));
}
