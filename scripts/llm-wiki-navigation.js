const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const {parseExpression} = require('@babel/parser');
const {StaticGap, OPTIONS} = require('./llm-wiki-static');
const {escapeText, destination} = require('./llm-wiki-markdown');

function sidebarCards(block, imports, {filePath, renderer}) {
  if (!filePath) return null;
  const node = parseExpression(block, OPTIONS);
  const tag = node.openingElement.name.name;
  const binding = imports.get(tag);
  if (binding?.source !== '@theme/DocCardList' || binding.exported !== 'default') return null;
  if (node.children.length) throw new StaticGap('DocCardList children are unsupported');
  const items = node.openingElement.attributes.find(a => a.name?.name === 'items')?.value?.expression;
  if (items?.type === 'ArrayExpression' && node.openingElement.attributes.length === 1) {
    const cards = renderer.evaluate(items, renderer.globals(filePath));
    if (!cards.length || cards.some(c => c.type !== 'link' || typeof c.label !== 'string' ||
        typeof c.href !== 'string' || !/^(\/|https?:\/\/)/.test(c.href) ||
        (c.description !== undefined && typeof c.description !== 'string'))) {
      throw new StaticGap('DocCardList literals must be static labelled links');
    }
    return {
      names: ['DocCardList'], method: 'static-props', source: '@theme/DocCardList#default',
      source_files: [renderer.relative(filePath)],
      markdown: cards.map(c => `- [${escapeText(c.label)}](${destination(c.href)})${c.description ? ` — ${escapeText(c.description)}` : ''}`).join('\n'),
    };
  }
  for (const attr of node.openingElement.attributes) {
    const expr = attr.value?.expression;
    const hook = expr?.object?.callee?.name;
    const hookBinding = imports.get(hook);
    if (attr.type !== 'JSXAttribute' || attr.name.name !== 'items' ||
        expr?.type !== 'MemberExpression' || expr.computed || expr.property.name !== 'items' ||
        expr.object.type !== 'CallExpression' || expr.object.arguments.length ||
        hookBinding?.source !== '@docusaurus/theme-common' || hookBinding.exported !== 'useCurrentSidebarCategory') {
      throw new StaticGap('Dynamic navigation expression is not the source sidebar category');
    }
  }
  const sidebarFile = path.join(renderer.root, 'sidebars.js');
  const ast = renderer.ast(sidebarFile);
  // The checked-in sidebar is a static object. Never require its JS module.
  const declaration = ast.body.find(s => s.type === 'VariableDeclaration' && s.declarations.some(d => d.id.name === 'sidebars'));
  const initializer = declaration?.declarations.find(d => d.id.name === 'sidebars')?.init;
  if (!initializer) throw new StaticGap('Static sidebar declaration not found');
  const sidebar = renderer.evaluate(initializer, renderer.globals(sidebarFile));
  const docsRoot = path.join(renderer.root, renderer.locale === 'en'
    ? 'i18n/en/docusaurus-plugin-content-docs/current' : 'docs');
  if (!filePath.startsWith(docsRoot + path.sep)) throw new StaticGap('Navigation source is outside the locale document root');
  const id = path.relative(docsRoot, filePath).replace(/\.mdx?$/, '').replaceAll(path.sep, '/');
  let translations = {};
  if (renderer.locale === 'en') {
    const translationFile = path.join(renderer.root, 'i18n/en/docusaurus-plugin-content-docs/current.json');
    translations = JSON.parse(fs.readFileSync(translationFile, 'utf8'));
    renderer.files.add(translationFile);
  }
  const categories = [];
  function visit(items, sidebarName) {
    for (const item of items) {
      if (item?.type === 'category') {
        if (item.link?.type === 'doc' && item.link.id === id) categories.push({...item, sidebarName});
        visit(item.items || [], sidebarName);
      }
    }
  }
  Object.entries(sidebar).forEach(([name, items]) => visit(items, name));
  if (categories.length !== 1) throw new StaticGap('Source sidebar category is missing or ambiguous');
  function docMetadata(docId) {
    const base = path.resolve(docsRoot, docId);
    if (!base.startsWith(docsRoot + path.sep)) throw new StaticGap('Sidebar doc outside docs root');
    const file = ['.md', '.mdx'].map(ext => base + ext).find(f => fs.existsSync(f));
    if (!file) throw new StaticGap(`Sidebar target missing: ${docId}`);
    renderer.files.add(file);
    const {data} = matter(fs.readFileSync(file, 'utf8'));
    const route = data.slug ? `/docs/${String(data.slug).replace(/^\//, '')}`
      : `/docs/${docId.replace(/\/index$/, '')}`;
    return {title: data.sidebar_label || data.title || docId, description: data.description, route};
  }
  const cards = [];
  function card(item) {
    if (typeof item === 'string') item = {type: 'doc', id: item};
    if (item.type === 'doc') {
      if (item.id === id) return;
      const doc = docMetadata(item.id);
      cards.push({title: item.label || doc.title, description: doc.description, route: doc.route});
    } else if (item.type === 'category' && item.link?.type === 'doc') {
      const doc = docMetadata(item.link.id);
      const title = translations[`sidebar.${categories[0].sidebarName}.category.${item.label}`]?.message || item.label;
      cards.push({title, description: doc.description, route: doc.route});
    } else if (item.type === 'category' && !item.link) {
      // An unlinked group still has useful descendant navigation.
      item.items.forEach(card);
    } else if (item.type === 'link') {
      cards.push({title: item.label, route: item.href});
    } else throw new StaticGap(`Unsupported sidebar item: ${item.type}`);
  }
  categories[0].items.forEach(card);
  if (!cards.length) throw new StaticGap('Sidebar has no static destinations');
  return {
    names: ['DocCardList'],
    markdown: cards.map(c => `- [${escapeText(c.title)}](${destination(c.route)})${c.description ? ` — ${escapeText(c.description)}` : ''}`).join('\n'),
    method: 'static-sidebar',
    source: '@theme/DocCardList#default',
    source_files: [...renderer.files].map(f => renderer.relative(f)).sort(),
  };
}

module.exports = {sidebarCards};
