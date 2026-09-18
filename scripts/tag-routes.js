const path = require('node:path');
const {normalizeUrl} = require('@docusaurus/utils');
const getDocSlug = require('@docusaurus/plugin-content-docs/lib/slug.js').default;
const {validateDocFrontMatter} = require('@docusaurus/plugin-content-docs/lib/frontMatter.js');
const {DEFAULT_OPTIONS: DOCS_DEFAULTS} = require('@docusaurus/plugin-content-docs/lib/options.js');
const {DEFAULT_OPTIONS: BLOG_DEFAULTS} = require('@docusaurus/plugin-content-blog/lib/options.js');
const {parseBlogFileName} = require('@docusaurus/plugin-content-blog/lib/blogUtils.js');

// Use the installed docs plugin's rules, including its category-index matcher
// and number-prefix parser. A filename is not a document permalink.
function documentRoute(relativePath, metadata, options = DOCS_DEFAULTS) {
  const source = relativePath.replace(/\\/g, '/');
  const frontMatter = validateDocFrontMatter(metadata);
  const parser = options.numberPrefixParser || DOCS_DEFAULTS.numberPrefixParser;
  const stripPrefixes = frontMatter.parse_number_prefixes !== false;
  const filename = path.posix.basename(source, path.posix.extname(source));
  const baseID = frontMatter.id ?? (stripPrefixes ? parser(filename).filename : filename);
  if (baseID.includes('/')) throw new Error(`Document id "${baseID}" cannot include slash.`);
  const slug = getDocSlug({
    baseID,
    source,
    sourceDirName: path.posix.dirname(source),
    frontMatterSlug: frontMatter.slug,
    stripDirNumberPrefixes: stripPrefixes,
    numberPrefixParser: parser,
  });
  return normalizeUrl([options.routeBasePath ?? 'docs', options.versions?.current?.path ?? '', slug])
    .replace(/^(?!\/)/, '/');
}

function blogRoute(relativePath, metadata, options = BLOG_DEFAULTS) {
  const source = relativePath.replace(/\\/g, '/');
  return normalizeUrl([options.routeBasePath ?? 'blog', metadata.slug ?? parseBlogFileName(source).slug])
    .replace(/^(?!\/)/, '/');
}

function contentOptions(siteConfig, type) {
  const classic = (siteConfig.presets || []).find(entry => {
    const name = Array.isArray(entry) ? entry[0] : entry;
    return typeof name === 'string' && (name === 'classic' || name.includes('preset-classic'));
  });
  const plugin = (siteConfig.plugins || []).find(entry => {
    const name = Array.isArray(entry) ? entry[0] : entry;
    return typeof name === 'string' && name.includes(`plugin-content-${type}`);
  });
  const configured = plugin
    ? (Array.isArray(plugin) ? plugin[1] : {})
    : classic ? (Array.isArray(classic) ? classic[1]?.[type] : undefined) : false;
  if (configured === false) return null;
  const defaults = type === 'docs' ? DOCS_DEFAULTS : BLOG_DEFAULTS;
  return {...defaults, ...configured};
}

module.exports = {documentRoute, blogRoute, contentOptions};
