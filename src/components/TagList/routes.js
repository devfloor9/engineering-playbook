// Custom JSX tag pages use filename URL encoding, not the docs plugin's
// kebab-case tag slugs. For example: scope:ops.js -> /tags/scope%3Aops.
function tagPageRoute(tag) {
  const segments = tag.replace(/\\/g, '/').split('/');
  const index = segments.at(-1).toLowerCase() === 'index';
  if (index) segments.pop();
  return `/tags/${segments.map(encodeURIComponent).join('/')}${index && segments.length ? '/' : ''}`;
}

function documentRouteForLocale(document, locale) {
  return document.pathsByLocale ? document.pathsByLocale[locale] : document.path;
}

module.exports = {tagPageRoute, documentRouteForLocale};
