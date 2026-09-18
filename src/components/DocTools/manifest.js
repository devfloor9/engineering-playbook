const manifests = new Map();

function absoluteUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value) ||
      /[\s\\\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error('Invalid document URL');
  }
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('Invalid document URL');
  }
  return url;
}

export function markdownUrlFromManifest(manifest, {locale, permalink, root, siteUrl}) {
  if (!manifest || typeof manifest.language !== 'string' || !Array.isArray(manifest.docs)) {
    throw new Error('Invalid Markdown index');
  }
  if (manifest.language !== locale) return null;

  const origin = new URL(siteUrl).origin;
  const entry = manifest.docs.find(doc => {
    try {
      const url = absoluteUrl(doc?.url);
      return url.origin === origin && url.pathname === permalink;
    } catch {
      return false;
    }
  });
  if (!entry) return null;

  const url = absoluteUrl(entry.md_url);
  // Reject ambiguous encoded separators, nested escapes and dot segments before
  // a server or proxy can interpret the path differently from the browser.
  if (/%(?:2f|5c|25)/i.test(entry.md_url) ||
      /(?:^|\/)\.{1,2}(?:\/|$)/.test(decodeURIComponent(entry.md_url))) {
    throw new Error('Invalid Markdown path');
  }
  if (url.origin !== origin || !url.pathname.startsWith(`${root}llm-wiki/`) ||
      !url.pathname.endsWith('.md')) {
    throw new Error('Invalid Markdown URL');
  }
  return url.pathname;
}

export function loadManifest(url) {
  if (!manifests.has(url)) {
    const request = fetch(url, {redirect: 'error'}).then(response => {
      if (!response.ok) throw new Error('Markdown index is unavailable');
      return response.json();
    }).then(manifest => {
      if (!manifest || typeof manifest.language !== 'string' || !Array.isArray(manifest.docs)) {
        throw new Error('Invalid Markdown index');
      }
      return manifest;
    }).catch(error => {
      manifests.delete(url);
      throw error;
    });
    manifests.set(url, request);
  }
  return manifests.get(url);
}

export function forgetManifest(url) {
  manifests.delete(url);
}

export async function loadMarkdownText(url) {
  if (!url) throw new Error('Markdown source is unavailable');
  const response = await fetch(url, {redirect: 'error'});
  const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (!response.ok || (type && ![
    'text/markdown', 'text/x-markdown', 'text/plain', 'application/octet-stream',
  ].includes(type))) {
    throw new Error('Markdown source is unavailable');
  }
  const text = await response.text();
  if (/^\s*(?:<!doctype\s+html\b|<(?:html|head|body)\b)/i.test(text)) {
    throw new Error('Markdown source returned HTML');
  }
  return text;
}
