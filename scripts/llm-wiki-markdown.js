const {parseFragment} = require('parse5');
const {element, StaticGap} = require('./llm-wiki-static');
const {compactMarkdown} = require('./llm-wiki-source');

const flatten = values => [values].flat(Infinity).filter(v => v !== null && v !== undefined && typeof v !== 'boolean' && v !== '');
const escapeText = value => String(value).replace(/\\/g, '\\\\').replace(/([`*_[\]<>])/g, '\\$1');
const destination = value => String(value).replace(/[\s()<>]/g, c =>
  c === '(' ? '%28' : c === ')' ? '%29' : encodeURIComponent(c));
const plain = node => flatten(node).map(n => typeof n === 'object' ? plain(n.children) : String(n)).join('');

function code(value, block = false, language = '') {
  const text = String(value);
  const longest = Math.max(0, ...[...text.matchAll(/`+/g)].map(m => m[0].length));
  const fence = '`'.repeat(Math.max(block ? 3 : 1, longest + 1));
  return block ? `\n\n${fence}${language}\n${text.replace(/\n$/, '')}\n${fence}\n\n`
    : `${fence}${/^[` ]|[` ]$/.test(text) ? ` ${text} ` : text}${fence}`;
}

function table(headers, rows) {
  const cell = value => String(value).trim().replace(/\|/g, '\\|').replace(/\r?\n+/g, '<br />');
  const width = headers.length;
  if (!width || rows.some(row => row.length !== width)) throw new StaticGap('Non-rectangular static table');
  return '\n\n' + [headers, headers.map(() => '---'), ...rows]
    .map(row => `| ${row.map(cell).join(' | ')} |`).join('\n') + '\n\n';
}

function descendants(node, tag) {
  return flatten(node).flatMap(n => typeof n !== 'object' ? []
    : n.tag === tag ? [n] : descendants(n.children, tag));
}

function gridSignature(node) {
  const style = node?.props?.style;
  return style?.display === 'grid' && style.gridTemplateColumns ? String(style.gridTemplateColumns) : null;
}

function markdown(tree) {
  function renderChildren(children) { return flatten(children).map(render).join(''); }
  function render(node) {
    if (node == null || typeof node === 'boolean') return '';
    if (Array.isArray(node)) return renderChildren(node);
    if (typeof node !== 'object') return escapeText(node);
    if (node.kind !== 'element') throw new StaticGap('Non-text value in rendered content');
    const {tag, props = {}, children} = node;
    const nodes = flatten(children);
    const inner = () => renderChildren(nodes);
    if (['script', 'style', 'input', 'select'].includes(tag)) return '';
    if (props['aria-hidden'] === true || props['aria-hidden'] === 'true') return '';
    if (tag === 'br') return '\n';
    if (tag === 'hr') return '\n\n---\n\n';
    if (tag === 'code') return code(plain(children));
    if (tag === 'pre') return code(plain(children), true, (props.className || '').replace(/^language-/, ''));
    if (tag === 'strong' || tag === 'b') return `**${inner()}**`;
    if (tag === 'em' || tag === 'i') return `*${inner()}*`;
    if (tag === 'del' || tag === 's') return `~~${inner()}~~`;
    if (tag === 'a') {
      const href = props.href || props.to;
      if (!href) return inner();
      if (/^(javascript|data|vbscript):/i.test(href)) throw new StaticGap('Unsupported link scheme');
      return `[${inner().trim()}](${destination(href)})`;
    }
    if (tag === 'img') return props.alt ? `![${escapeText(props.alt)}](${destination(props.src)})` : '';
    if (/^h[1-6]$/.test(tag)) return `\n\n${'#'.repeat(Number(tag[1]))} ${inner().trim()}\n\n`;
    if (tag === 'ul' || tag === 'ol') {
      return '\n\n' + nodes.map((n, i) => `${tag === 'ol' ? `${i + 1}.` : '-'} ${render(n).trim().replace(/\n/g, '\n  ')}`).join('\n') + '\n\n';
    }
    if (tag === 'li') {
      const anchor = props.id ? `<a id="${String(props.id).replace(/["<>]/g, '')}"></a>` : '';
      return anchor + inner();
    }
    if (tag === 'table') {
      const rows = descendants(children, 'tr').map(row => flatten(row.children).filter(c => ['td', 'th'].includes(c?.tag)));
      if (rows.flat().some(cell => Number(cell.props.rowSpan || cell.props.colSpan || 1) !== 1)) {
        // Retain explicit span semantics instead of silently misaligning cells.
        return '\n\n' + semanticHtml(node) + '\n\n';
      }
      const values = rows.map(row => row.map(cell => innerCell(cell)));
      if (!values.length) throw new StaticGap('Empty static table');
      const caption = descendants(children, 'caption').map(innerCell).join('\n');
      return (caption ? `\n\n${caption}` : '') + table(values[0], values.slice(1));
    }
    if (tag === 'svg') {
      throw new StaticGap('SVG geometry needs a source-qualified text equivalent');
    }
    if (tag === 'button') return ` ${inner().trim()} `;
    if (tag === 'summary') return `\n\n**${inner().trim()}**\n\n`;
    if (tag === 'span' && !nodes.length && props['aria-label']) return ` (${escapeText(props['aria-label'])})`;

    // CSS grid tables: require consecutive rows with identical column layout,
    // child count, and at least two columns. Never infer from component names.
    if (['div', 'section'].includes(tag)) {
      let result = '';
      for (let i = 0; i < nodes.length;) {
        const signature = gridSignature(nodes[i]);
        const run = [];
        while (signature && i + run.length < nodes.length && gridSignature(nodes[i + run.length]) === signature) run.push(nodes[i + run.length]);
        const cells = run.map(row => flatten(row.children));
        if (cells.length > 1 && !run[0].mapped && run.slice(1).every(row => row.mapped) &&
            cells[0].length > 1 && cells.every(row => row.length === cells[0].length)) {
          const values = cells.map(row => row.map(n => render(n).trim()));
          result += table(values[0], values.slice(1));
          i += run.length;
        } else {
          result += render(nodes[i]);
          i++;
        }
      }
      return `\n\n${result.trim()}\n\n`;
    }
    const text = inner();
    if (['p', 'details', 'article', 'figure', 'figcaption', 'blockquote'].includes(tag)) return `\n\n${text.trim()}\n\n`;
    return text;
  }
  const innerCell = cell => renderChildren(cell.children).trim();
  return compactMarkdown(render(tree)).trim();
}

function semanticHtml(node) {
  const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  return flatten(node).map(n => {
    if (typeof n !== 'object') return escape(n);
    const attributes = Object.entries(n.props || {}).filter(([key]) => ['href', 'rowSpan', 'colSpan', 'scope', 'id'].includes(key))
      .map(([key, value]) => ` ${key.toLowerCase()}="${escape(value)}"`).join('');
    return `<${n.tag}${attributes}>${semanticHtml(n.children)}</${n.tag}>`;
  }).join('');
}

function fromHtml(html) {
  function convert(node) {
    if (node.nodeName === '#text') return node.value;
    if (!node.tagName) return (node.childNodes || []).map(convert);
    const props = Object.fromEntries((node.attrs || []).map(a => [a.name === 'rowspan' ? 'rowSpan' : a.name === 'colspan' ? 'colSpan' : a.name, a.value]));
    if (props.style) {
      props.style = Object.fromEntries(props.style.split(';').filter(Boolean).map(p => {
        const colon = p.indexOf(':');
        return [p.slice(0, colon).trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), p.slice(colon + 1).trim()];
      }));
    }
    return element(node.tagName, props, (node.childNodes || []).map(convert));
  }
  return convert(parseFragment(html));
}

module.exports = {markdown, table, plain, flatten, descendants, fromHtml, escapeText, destination, code};
