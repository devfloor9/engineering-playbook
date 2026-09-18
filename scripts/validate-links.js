#!/usr/bin/env node

// Validate published routes when a build is available; source inference is advisory.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const dns = require('node:dns').promises;
const {BlockList, isIP} = require('node:net');
const matter = require('gray-matter');
const {parse, parseFragment} = require('parse5');
const {loadFreshModule, createSlugger, parseMarkdownHeadingId} = require('@docusaurus/utils');

const ROOT = path.resolve(__dirname, '..');
const ACTIONABLE = new Set(['missing_page', 'invalid_url', 'invalid_placeholder', 'redirect_error', 'http_error', 'blocked_destination']);
let parserPromise;

function walkFiles(dir, accept = () => true) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkFiles(file, accept);
    return entry.isFile() && accept(file) ? [file] : [];
  });
}

function visit(node, fn) {
  fn(node);
  for (const child of node.children || node.childNodes || []) visit(child, fn);
}

function decode(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function routeKey(value) {
  return decode(value).replace(/\/$/, '') || '/';
}

function joinRoute(...parts) {
  return '/' + parts.map(part => String(part || '').replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
}

function within(root, file) {
  const relative = path.relative(root, file);
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}

function fileExists(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

async function markdownParser() {
  parserPromise ||= Promise.all([import('unified'), import('remark-parse'), import('remark-gfm')])
    .then(([{unified}, {default: markdown}, {default: gfm}]) => unified().use(markdown).use(gfm));
  return parserPromise;
}

function htmlInfo(content, fragment = false) {
  const ids = new Set();
  const links = [];
  let redirect;
  const tree = (fragment ? parseFragment : parse)(content, {sourceCodeLocationInfo: true});
  visit(tree, node => {
    const attrs = Object.fromEntries((node.attrs || []).map(({name, value}) => [name, value]));
    if (attrs.id) ids.add(attrs.id);
    if (node.tagName === 'a' && attrs.name) ids.add(attrs.name);
    if (node.tagName === 'meta' && attrs['http-equiv']?.toLowerCase() === 'refresh') {
      redirect = attrs.content?.match(/url\s*=\s*["']?([^"']+)/i)?.[1]?.trim();
    }
    for (const key of ['href', 'to', 'src']) {
      if (!attrs[key] || (key === 'src' && !['img', 'source', 'video', 'audio'].includes(node.tagName))) continue;
      links.push({url: attrs[key], type: key === 'src' ? 'image' : 'html-link', line: node.sourceCodeLocation?.startLine || 1});
    }
  });
  return {ids, links, redirect};
}

async function extractDocument(content) {
  const {data, content: body} = matter(content);
  const offset = content.slice(0, content.length - body.length).split('\n').length - 1;
  const parser = await markdownParser();
  const tree = parser.parse(body);
  const definitions = new Map();
  const links = [];
  const ids = new Set();
  const slugger = createSlugger();
  const text = node => node.type === 'html' ? '' : node.value ?? node.alt ?? (node.children || []).map(text).join('');
  visit(tree, node => { if (node.type === 'definition') definitions.set(node.identifier, node.url); });
  function readTree(root, lineOffset) {
    visit(root, node => {
      const line = (node.position?.start.line || 1) + lineOffset;
      if (['link', 'image', 'linkReference', 'imageReference'].includes(node.type)) {
        const url = node.url ?? definitions.get(node.identifier);
        if (url !== undefined) links.push({url, type: node.type.startsWith('image') ? 'image' : 'link', line});
      }
      if (node.type === 'heading') {
        const heading = text(node);
        ids.add(parseMarkdownHeadingId(heading).id ?? slugger.slug(heading));
      }
      if (node.type === 'html') {
        const info = htmlInfo(node.value, true);
        info.ids.forEach(id => ids.add(id));
        links.push(...info.links.map(link => ({...link, line: line + link.line - 1})));
        // CommonMark treats JSX containers as HTML blocks; retain Markdown inside them.
        const nested = node.value.replace(/<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>/gi, value => value.replace(/[^\n]/g, ' '))
          .replace(/<[^>]*>/g, value => value.replace(/[^\n]/g, ' '));
        readTree(parser.parse(nested), line - 1);
      }
    });
  }
  readTree(tree, offset);
  return {data, links, ids};
}

async function loadConfig(root) {
  const configFile = ['docusaurus.config.js', 'docusaurus.config.ts', 'docusaurus.config.mjs'].map(name => path.join(root, name)).find(fileExists);
  if (!configFile) throw new Error('Docusaurus config not found; use the site root with --root.');
  return loadFreshModule(configFile);
}

function contentGroups(root, config) {
  const classic = (config.presets || []).find(preset => Array.isArray(preset) && /classic/.test(String(preset[0])))?.[1] || {};
  const docs = classic.docs === false ? null : {path: 'docs', routeBasePath: 'docs', ...classic.docs};
  const blog = classic.blog === false ? null : {path: 'blog', routeBasePath: 'blog', ...classic.blog};
  const groups = [];
  const {defaultLocale = 'en', locales = [defaultLocale], localeConfigs = {}, path: i18nPath = 'i18n'} = config.i18n || {};
  for (const locale of locales) {
    const prefix = localeConfigs[locale]?.baseUrl || joinRoute(config.baseUrl, locale === defaultLocale ? '' : locale);
    for (const [kind, options] of [['docs', docs], ['blog', blog], ['pages', {path: 'src/pages', routeBasePath: ''}]]) {
      if (!options) continue;
      const originalDir = path.resolve(root, options.path);
      const dir = locale === defaultLocale ? originalDir : path.join(root, i18nPath, localeConfigs[locale]?.path || locale,
        `docusaurus-plugin-content-${kind}`, kind === 'docs' ? 'current' : '');
      groups.push({dir, originalDir, locale, prefix, kind, routeBasePath: options.routeBasePath});
    }
  }
  return groups;
}

function inferRoute(file, group, data, config) {
  const rel = path.relative(group.dir, file).split(path.sep).join('/').replace(/\.mdx?$/, '');
  const parts = rel.split('/').map(part => data.parse_number_prefixes === false ? part : part.replace(/^\d+[-_]/, ''));
  const basename = parts.pop();
  const categoryIndex = /^(index|readme)$/i.test(basename) || basename.toLowerCase() === parts.at(-1)?.toLowerCase();
  let slug = data.slug;
  if (!slug) slug = [...parts, categoryIndex ? '' : (data.id || basename)].filter(Boolean).join('/');
  else if (!slug.startsWith('/')) slug = [...parts, slug].join('/');
  let route = joinRoute(group.prefix, group.routeBasePath, slug);
  if (config.trailingSlash === true || (config.trailingSlash === undefined && categoryIndex)) route += '/';
  return route;
}

async function createContext(options = {}) {
  const root = path.resolve(options.root || ROOT);
  const config = options.config || await loadConfig(root);
  const buildDir = path.resolve(options.buildDir || path.join(root, 'build'));
  const generatedDir = path.resolve(options.generatedDir || path.join(root, '.docusaurus'));
  const context = {root, config, buildDir, generatedDir, documents: new Map(), sourceRoutes: new Map(), routes: new Map(), warnings: []};
  context.baseUrl = joinRoute(config.baseUrl) + (joinRoute(config.baseUrl) === '/' ? '' : '/');
  context.origin = new URL(config.url).origin;
  for (const group of contentGroups(root, config)) {
    for (const file of walkFiles(group.dir, file => /\.mdx?$/.test(file))) {
      if (path.relative(group.dir, file).split(path.sep).some(part => part.startsWith('_'))) continue;
      try {
        const doc = {...await extractDocument(fs.readFileSync(file, 'utf8')), file, group};
        if (doc.data.draft) continue;
        doc.route = inferRoute(file, group, doc.data, config);
        context.documents.set(file, doc);
      } catch (error) {
        context.warnings.push({file: path.relative(root, file), reason: error.message});
      }
    }
  }
  // JSON metadata preserves frontmatter slugs and plugin-generated permalinks without executing routes.js.
  for (const file of options.externalOnly ? [] : walkFiles(generatedDir, file => file.endsWith('.json') && /docusaurus-plugin-content-(docs|pages|blog)/.test(file))) {
    const metadata = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!metadata.source?.startsWith('@site/') || !metadata.permalink) continue;
    const doc = context.documents.get(path.resolve(root, metadata.source.slice(6)));
    if (doc && metadata.permalink.startsWith(joinRoute(doc.group.prefix, doc.group.routeBasePath) + '/')) {
      doc.route = metadata.permalink;
    }
  }
  for (const doc of context.documents.values()) context.sourceRoutes.set(routeKey(doc.route), doc);
  context.hasBuild = fileExists(path.join(buildDir, 'index.html'));
  if (!context.hasBuild && !options.externalOnly) context.warnings.push({reason: 'No complete build detected. Source fallback cannot verify generated pages, redirects or component heading IDs.'});
  if (context.hasBuild && !options.externalOnly) {
    for (const file of walkFiles(buildDir, file => file.endsWith('.html'))) {
      const rel = path.relative(buildDir, file).split(path.sep).join('/');
      if (rel === '404.html' || rel.endsWith('/404.html')) continue;
      // A built HTML file is a concrete route, including pages absent from the sitemap.
      const info = htmlInfo(fs.readFileSync(file, 'utf8'));
      const literal = joinRoute(context.baseUrl, rel);
      const route = literal.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
      const entry = {file, route, ids: info.ids, redirect: info.redirect};
      context.routes.set(routeKey(route), entry);
      context.routes.set(routeKey(literal), entry);
    }
  }
  return context;
}

function targetResult(context, route, anchor, seen = new Set()) {
  const key = routeKey(route);
  if (seen.has(key)) return {exists: false, category: 'redirect_error', reason: 'Internal redirect loop', target: route};
  seen.add(key);
  const built = context.routes.get(key);
  if (built?.redirect) {
    const url = new URL(built.redirect, context.origin + built.route);
    if (url.origin !== context.origin) return {exists: null, category: 'unverified', reason: 'Internal route redirects to an external origin', target: url.href};
    return targetResult(context, url.pathname, decode(url.hash.slice(1)) || anchor, seen);
  }
  if (built) {
    if (anchor && anchor.toLowerCase() !== 'top' && !built.ids.has(anchor)) return {exists: false, category: 'missing_fragment', reason: `Fragment #${anchor} is absent from built HTML`, target: route, evidence: 'build'};
    return {exists: true, category: 'valid', target: route, evidence: 'build'};
  }
  if (context.hasBuild) return {exists: false, category: 'missing_route', reason: 'Route is absent from the build', target: route, evidence: 'build'};
  const source = context.sourceRoutes.get(key);
  if (!source) return {exists: null, category: 'unverified', reason: 'No source route; a build is required for generated or component pages', target: route};
  if (anchor && !source.ids.has(anchor)) return {exists: null, category: 'unverified', reason: `Fragment #${anchor} is absent from source headings; check rendered IDs`, target: route, evidence: 'source'};
  return {exists: true, category: 'valid', target: route, evidence: 'source'};
}

function checkInternalLink(url, currentFile, context) {
  const doc = typeof currentFile === 'string' ? context.documents.get(path.resolve(currentFile)) : currentFile;
  if (!doc) throw new Error(`Source document not indexed: ${currentFile}`);
  let absolute;
  try { absolute = new URL(url, context.origin + doc.route); } catch {
    return {exists: false, category: 'invalid_url', reason: 'Invalid internal URL'};
  }
  const anchor = decode(absolute.hash.slice(1));
  const pathname = decode(url.split(/[?#]/)[0]);
  const isAbsoluteUrl = /^(https?:)?\/\//i.test(url);
  if (/\.mdx?$/.test(pathname) && !isAbsoluteUrl) {
    // Match Docusaurus's content-root, site-root and bare-path lookup order.
    const directories = pathname.startsWith('/') ? [doc.group.dir, doc.group.originalDir, context.root]
      : pathname.startsWith('.') ? [path.dirname(doc.file)]
      : [path.dirname(doc.file), doc.group.dir, doc.group.originalDir, context.root];
    const candidates = pathname.startsWith('@site/') ? [path.resolve(context.root, pathname.slice(6))]
      : directories.map(dir => path.join(dir, pathname));
    const candidate = candidates.find(file => context.documents.has(file));
    let target = context.documents.get(candidate);
    if (!target && within(doc.group.dir, candidates[0])) {
      target = context.documents.get(path.join(doc.group.originalDir, path.relative(doc.group.dir, candidates[0])));
    }
    if (target && target.group.locale !== doc.group.locale && within(doc.group.originalDir, target.file)) {
      target = context.documents.get(path.join(doc.group.dir, path.relative(doc.group.originalDir, target.file))) || target;
    }
    if (target) {
      const route = target.group.locale === doc.group.locale ? target.route
        : joinRoute(doc.group.prefix, doc.group.routeBasePath, target.route.slice(joinRoute(target.group.prefix, target.group.routeBasePath).length));
      return targetResult(context, route, anchor);
    }
    return {exists: false, category: 'missing_source', reason: 'Markdown source target does not exist', target: pathname};
  }
  // Source Markdown root links are wrapped by Docusaurus Link with the configured base URL.
  if (!isAbsoluteUrl && pathname.startsWith('/') && !absolute.pathname.startsWith(context.baseUrl)) {
    absolute.pathname = joinRoute(doc.group.prefix, pathname);
  }
  const route = decode(absolute.pathname);
  if (context.routes.has(routeKey(route)) || context.sourceRoutes.has(routeKey(route))) return targetResult(context, route, anchor);
  if (route.startsWith(context.baseUrl)) {
    const rel = route.slice(context.baseUrl.length);
    for (const dir of [context.buildDir, path.join(context.root, 'static')]) {
      const candidate = path.resolve(dir, rel);
      if (within(dir, candidate) && fileExists(candidate)) return {exists: true, category: 'valid', evidence: dir === context.buildDir ? 'build' : 'static', target: route};
    }
  }
  if (pathname && !pathname.startsWith('/') && !isAbsoluteUrl && !/\.html?$/.test(pathname)) {
    const candidate = path.resolve(path.dirname(doc.file), pathname);
    if (within(context.root, candidate) && fileExists(candidate) && !/\.mdx?$/.test(candidate)) {
      return {exists: true, category: 'valid', evidence: 'source-asset', target: pathname};
    }
  }
  return targetResult(context, route, anchor);
}

function normalizeExternal(url) {
  const parsed = new URL(url.startsWith('//') ? 'https:' + url : url);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Unsupported or credential-bearing URL');
  parsed.hash = '';
  return parsed.href;
}

function classifyResponse(statusCode, headers = {}, body = '') {
  if (statusCode === 401 || statusCode === 407) return 'authentication_required';
  if (statusCode === 403) return 'forbidden_or_bot_protection';
  if (statusCode === 429) return 'rate_limited';
  if (headers['cf-mitigated'] === 'challenge' || /<title>\s*(just a moment|attention required|access denied)/i.test(body)) return 'bot_protection';
  if (statusCode === 404 || statusCode === 410) return 'missing_page';
  if (statusCode >= 500) return 'transient_error';
  if (statusCode >= 300 && statusCode < 400) return 'redirect';
  return statusCode >= 200 && statusCode < 300 ? 'valid' : 'http_error';
}

function placeholderReason(url) {
  const {hostname, pathname, searchParams} = new URL(url);
  if (/(^|\.)(example\.(com|org|net)|localhost|local|invalid|test)$/.test(hostname) || /^(your[-.]|\$|%)/.test(hostname)) return 'Example or local URL; no public request made';
  if (/(^|\.)youtube\.com$/.test(hostname) && pathname === '/watch' && !searchParams.get('v')) return 'YouTube watch URL has no video ID';
  return null;
}

// Exclude special-purpose IPv4 ranges, including documentation and multicast.
const nonPublicAddresses = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
]) nonPublicAddresses.addSubnet(address, prefix, 'ipv4');
// Conservatively admit IPv6 global unicast only, excluding special-purpose,
// documentation and tunneling ranges. This also rejects mapped IPv4 and NAT64.
const globalIpv6 = new BlockList();
globalIpv6.addSubnet('2000::', 3, 'ipv6');
for (const [address, prefix] of [
  ['2001::', 23], ['2001:db8::', 32], ['2002::', 16], ['3fff::', 20],
]) nonPublicAddresses.addSubnet(address, prefix, 'ipv6');
const loopbackAddresses = new BlockList();
loopbackAddresses.addSubnet('127.0.0.0', 8, 'ipv4');
loopbackAddresses.addAddress('::1', 'ipv6');

async function destinationLookup(url, {resolve = dns.lookup, timeoutMs, allowLocal}) {
  const hostname = new URL(url).hostname.replace(/^\[|\]$/g, '');
  const literalFamily = isIP(hostname);
  let addresses;
  let timer;
  try {
    addresses = literalFamily ? [{address: hostname, family: literalFamily}] : await Promise.race([
      Promise.resolve().then(() => resolve(hostname, {all: true, verbatim: true})),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error('DNS lookup timed out'), {code: 'TIMEOUT'})), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
  if (!Array.isArray(addresses) || !addresses.length ||
      addresses.some(entry => !entry || ![4, 6].includes(entry.family) || isIP(entry.address) !== entry.family)) {
    throw Object.assign(new Error('DNS lookup returned no usable addresses'), {code: 'ENOTFOUND'});
  }
  // Copy the resolution before checking it; neither a resolver nor a transport
  // may mutate the verified addresses used by the pinned lookup.
  addresses = addresses.map(({address, family}) => ({address, family}));
  const blocked = addresses.some(({address, family}) => {
    const type = family === 4 ? 'ipv4' : 'ipv6';
    // This boolean is an in-process test hook, never a CLI or environment flag.
    if (allowLocal === true && loopbackAddresses.check(address, type)) return false;
    return nonPublicAddresses.check(address, type) || (family === 6 && !globalIpv6.check(address, type));
  });
  if (blocked) throw Object.assign(new Error('Non-public destination; no request made'), {code: 'BLOCKED_DESTINATION'});
  return (requestedHost, options, callback) => {
    const family = typeof options === 'number' ? options : options.family;
    const matches = addresses.filter(entry => !family || entry.family === family);
    queueMicrotask(() => {
      if (requestedHost !== hostname || !matches.length) {
        callback(Object.assign(new Error('No verified address for this lookup'), {code: 'ENOTFOUND'}));
      } else if (options.all) {
        callback(null, matches.map(entry => ({...entry})));
      } else {
        callback(null, matches[0].address, matches[0].family);
      }
    });
  };
}

function requestUrl(url, {timeoutMs, method, lookup}) {
  return new Promise(resolve => {
    const client = url.startsWith('https:') ? https : http;
    let settled = false;
    let timer;
    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    // Keep the URL hostname for Host/SNI, but use only the verified resolution.
    // A fresh agent prevents a pooled socket from bypassing this request's check.
    const req = client.request(url, {method, lookup, agent: false, headers: {'User-Agent': 'EngineeringPlaybook-LinkValidator/1.0', Accept: 'text/html,application/xhtml+xml,*/*;q=0.8'}}, res => {
      let body = '';
      const complete = () => finish({statusCode: res.statusCode, headers: res.headers, body});
      // Only a bounded prefix is needed to recognize common bot challenge pages.
      res.on('data', chunk => {
        body += chunk.toString('utf8');
        if (body.length >= 8192) { complete(); res.destroy(); }
      });
      res.on('end', complete);
      res.on('error', error => finish({error: error.code || error.message}));
      if (method === 'HEAD' || (res.statusCode >= 300 && res.statusCode < 400)) { complete(); res.destroy(); }
    });
    timer = setTimeout(() => { finish({error: 'TIMEOUT'}); req.destroy(); }, timeoutMs);
    req.on('error', error => finish({error: error.code || error.message}));
    req.end();
  });
}

async function checkExternalLink(input, options = {}) {
  let url;
  try { url = normalizeExternal(input); } catch { return {category: 'invalid_url', exists: false, reason: 'Invalid HTTP(S) URL'}; }
  const allowLocal = options.allowLocal === true;
  const placeholder = placeholderReason(url);
  if (placeholder && !allowLocal) return {category: /video ID/.test(placeholder) ? 'invalid_placeholder' : 'excluded_example', exists: null, reason: placeholder};
  const timeoutMs = options.timeoutMs || 10000;
  const maxRedirects = options.maxRedirects ?? 5;
  const request = options.request || requestUrl;
  const redirects = [];
  const visited = new Set();
  let current = url;
  for (;;) {
    if (visited.has(current)) return {category: 'redirect_error', exists: false, reason: 'Redirect loop', finalUrl: current, redirects};
    visited.add(current);
    const started = Date.now();
    let lookup;
    try {
      lookup = await destinationLookup(current, {resolve: options.resolve, timeoutMs, allowLocal});
    } catch (error) {
      const category = error.code === 'BLOCKED_DESTINATION' ? 'blocked_destination' : error.code === 'TIMEOUT' ? 'timeout' : 'network_error';
      return {category, exists: null, reason: error.code === 'BLOCKED_DESTINATION' ? error.message : error.code || error.message, finalUrl: current, redirects};
    }
    const response = await request(current, {timeoutMs: Math.max(1, timeoutMs - (Date.now() - started)), method: 'GET', lookup});
    if (response.error) return {category: response.error === 'TIMEOUT' ? 'timeout' : 'network_error', exists: null, reason: response.error, finalUrl: current, redirects};
    const {statusCode, headers = {}, body = ''} = response;
    const category = classifyResponse(statusCode, headers, body);
    if (category === 'redirect') {
      if (!headers.location || redirects.length >= maxRedirects) return {category: 'redirect_error', exists: false, statusCode, reason: headers.location ? 'Redirect limit exceeded' : 'Redirect has no Location', finalUrl: current, redirects};
      let next;
      try { next = normalizeExternal(new URL(headers.location, current).href); } catch {
        return {category: 'redirect_error', exists: false, statusCode, reason: 'Invalid redirect target', finalUrl: current, redirects};
      }
      redirects.push({from: current, to: next, statusCode});
      if (!allowLocal && placeholderReason(next)) return {category: 'redirect_error', exists: null, reason: 'Redirect targets an example or local URL', finalUrl: next, redirects};
      current = next;
      continue;
    }
    return {category: category === 'valid' && redirects.length ? 'redirect' : category, exists: category === 'valid' ? true : ACTIONABLE.has(category) ? false : null,
      statusCode, finalUrl: current, redirects, reason: `HTTP ${statusCode}`};
  }
}

function readPreviousReport(file) {
  const urls = new Set();
  for (const match of fs.readFileSync(file, 'utf8').matchAll(/^\* \[[^\]]+\] <(https?:\/\/[^>]+)>/gm)) {
    try { urls.add(normalizeExternal(match[1])); } catch { /* Invalid URLs are reported during source scanning. */ }
  }
  return urls;
}

async function mapConcurrent(items, concurrency, fn) {
  const output = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({length: Math.min(concurrency, items.length)}, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      output[index] = await fn(items[index]);
    }
  }));
  return output;
}

function countsBy(items) {
  const counts = {};
  for (const item of items) counts[item.category] = (counts[item.category] || 0) + 1;
  return counts;
}

async function validate(options = {}) {
  const context = await createContext(options);
  const internal = [];
  const external = new Map();
  const previous = options.externalFromReport ? readPreviousReport(options.externalFromReport) : null;
  let totalLinks = 0;
  for (const doc of context.documents.values()) {
    for (const link of doc.links) {
      totalLinks++;
      const occurrence = {file: path.relative(context.root, doc.file).split(path.sep).join('/'), line: link.line, url: link.url, type: link.type};
      if (/^(mailto|tel|data|javascript):/i.test(link.url)) continue;
      let parsed;
      try { parsed = new URL(link.url, context.origin + doc.route); } catch { /* Keep malformed URLs as findings. */ }
      const remote = /^(https?:)?\/\//i.test(link.url) && parsed?.origin !== context.origin;
      if (remote) {
        let key;
        try { key = normalizeExternal(link.url); } catch { key = link.url; }
        if (previous && !previous.has(key)) continue;
        if (!external.has(key)) external.set(key, {url: key, occurrences: []});
        external.get(key).occurrences.push(occurrence);
      } else if (!options.externalOnly) {
        internal.push({...occurrence, ...checkInternalLink(link.url, doc, context)});
      }
    }
  }
  const externalResults = await mapConcurrent([...external.values()], options.concurrency || 8, async entry => ({...entry,
    ...(options.external ? await checkExternalLink(entry.url, options) : {category: 'not_checked', exists: null})}));
  const internalFindings = internal.filter(item => item.exists !== true);
  const externalFindings = externalResults.filter(item => !['valid', 'not_checked', 'excluded_example'].includes(item.category));
  const summary = {files: context.documents.size, links: totalLinks,
    internalChecked: internal.length, internalFindings: internalFindings.length, internalCategories: countsBy(internal),
    internalEvidence: internal.reduce((counts, item) => {counts[item.evidence || 'unverified'] = (counts[item.evidence || 'unverified'] || 0) + 1; return counts;}, {}),
    externalUnique: externalResults.length, externalOccurrences: externalResults.reduce((sum, item) => sum + item.occurrences.length, 0),
    externalFindings: externalFindings.length, externalActionable: externalResults.filter(item => ACTIONABLE.has(item.category)).length,
    externalCategories: countsBy(externalResults), warnings: context.warnings.length};
  const report = {schemaVersion: 1, checkedAt: new Date().toISOString(), advisory: !!options.advisory,
    status: internalFindings.length || externalFindings.length || context.warnings.length ? 'findings' : (!options.external || options.externalOnly ? 'partial' : 'clear_in_checked_scope'),
    scope: {buildAvailable: context.hasBuild, internal: !options.externalOnly, external: !!options.external,
      externalFilter: previous ? 'URLs still referenced from the prior report' : 'all extracted HTTP(S) URLs',
      previousUnique: previous?.size, previousNoLongerReferenced: previous ? [...previous].filter(url => !external.has(url)) : undefined,
      limitations: ['External fragments are not checked.', 'Dynamic JSX props, JavaScript pages and plugin-specific source routing require rendered validation.',
        'Source fallback is advisory; a build must match the reviewed revision and include every configured locale.',
        'HTTP success can still be a soft 404 or login page; authentication and bot responses need manual review.']},
    summary, internalFindings, external: externalResults, warnings: context.warnings};
  return report;
}

function markdownReport(report) {
  const lines = ['# Link validation report', '', `Status: **${report.status}**. Advisory: **${report.advisory}**. Checked: ${report.checkedAt}.`, '',
    '**A successful advisory job means the report was generated, not that links are valid.**', '',
    `Files: ${report.summary.files}; internal findings: ${report.summary.internalFindings}; external findings: ${report.summary.externalFindings} unique URLs (${report.summary.externalActionable} actionable).`, '',
    `Build available: ${report.scope.buildAvailable}; internal checking: ${report.scope.internal}; external checking: ${report.scope.external}.`,
    `External scope: ${report.scope.externalFilter}.`, '', '| External classification | Unique URLs |', '| --- | ---: |'];
  for (const [category, count] of Object.entries(report.summary.externalCategories)) lines.push(`| ${category} | ${count} |`);
  lines.push('', '## Internal findings', '');
  for (const item of report.internalFindings) lines.push(`- ${item.category}: ${item.file}:${item.line} — \`${item.url.replace(/`/g, '')}\` — ${item.reason}`);
  if (!report.internalFindings.length) lines.push(report.scope.internal ? 'No findings in the checked internal scope.' : 'Internal links were not checked in this run.');
  lines.push('', '## External findings', '');
  for (const item of report.external.filter(item => !['valid', 'not_checked', 'excluded_example'].includes(item.category))) {
    lines.push(`- **${item.category}**: <${item.url}> — ${item.reason || ''}${item.finalUrl && item.finalUrl !== item.url ? `; final: <${item.finalUrl}>` : ''}`);
    for (const location of item.occurrences) lines.push(`  - ${location.file}:${location.line}`);
  }
  lines.push('', '## Coverage and integration limits', '', ...report.scope.limitations.map(limit => '- ' + limit), ...report.warnings.map(warning => `- ${warning.file || 'Validation'}: ${warning.reason}`));
  if (report.scope.previousNoLongerReferenced?.length) lines.push('', '## Prior URLs no longer referenced in this scope', '', ...report.scope.previousNoLongerReferenced.map(url => `- <${url}>`));
  return lines.join('\n') + '\n';
}

function exitCode(report, options) {
  if (options.advisory) return 0;
  if (report.summary.warnings || report.summary.internalFindings || report.summary.externalActionable) return 1;
  return 0;
}

function parseArgs(args) {
  const options = {};
  const values = {'--root': 'root', '--build-dir': 'buildDir', '--generated-dir': 'generatedDir', '--json': 'json', '--markdown': 'markdown',
    '--external-from-report': 'externalFromReport', '--timeout-ms': 'timeoutMs', '--concurrency': 'concurrency'};
  const flags = {'--external': 'external', '--external-only': 'externalOnly', '--advisory': 'advisory', '--help': 'help'};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (flags[arg]) options[flags[arg]] = true;
    else if (values[arg]) {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      options[values[arg]] = value;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  for (const key of ['timeoutMs', 'concurrency']) {
    if (options[key] !== undefined) {
      options[key] = Number(options[key]);
      if (!Number.isSafeInteger(options[key]) || options[key] < 1) throw new Error(`${key} must be a positive integer`);
    }
  }
  if (options.externalOnly || options.externalFromReport) options.external = true;
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: node scripts/validate-links.js [--root DIR] [--build-dir DIR] [--generated-dir DIR]\n  [--external | --external-only] [--external-from-report FILE] [--advisory]\n  [--json FILE] [--markdown FILE] [--timeout-ms N] [--concurrency N]\nExternal requests are opt-in. Strict mode fails internal findings, parse warnings and actionable external failures.\nAuthentication, bot protection, rate limits and network failures remain report findings.');
    return;
  }
  const report = await validate(options);
  for (const [file, content] of [[options.json, JSON.stringify(report, null, 2) + '\n'], [options.markdown, markdownReport(report)]]) {
    if (!file) continue;
    fs.mkdirSync(path.dirname(path.resolve(file)), {recursive: true});
    fs.writeFileSync(file, content);
  }
  console.log(`Link validation: ${report.status}${options.advisory ? ' (advisory exit policy)' : ''}`);
  console.log(JSON.stringify(report.summary, null, 2));
  console.log('Advisory success does not mean zero findings. See the JSON/Markdown report for scope and URLs.');
  process.exitCode = exitCode(report, options);
}

if (require.main === module) main().catch(error => { console.error(error.stack); process.exitCode = 2; });
module.exports = {walkFiles, extractDocument, htmlInfo, createContext, checkInternalLink, normalizeExternal, classifyResponse,
  checkExternalLink, readPreviousReport, validate, markdownReport, exitCode, parseArgs};
