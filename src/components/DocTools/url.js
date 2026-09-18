export function canonicalDocumentUrl({permalink, siteUrl, trailingSlash, hash = ''}) {
  const url = new URL(permalink, siteUrl);
  // Category metadata can retain "/" even when the build emits a .html route.
  if (trailingSlash === false && url.pathname !== '/') {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }
  url.hash = hash;
  return url.href;
}
