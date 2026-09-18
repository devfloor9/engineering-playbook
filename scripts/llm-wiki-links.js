// Parse Markdown only to locate link destinations. Apply edits to the original
// source spans, so fenced/inline code, prose, titles and HTML are not reformatted.
let parser;
async function markdownParser() {
  if (!parser) parser = Promise.all(['unified', 'remark-parse', 'remark-gfm'].map(name => import(require.resolve(name))))
    .then(([{unified}, parse, gfm]) => unified().use(parse.default).use(gfm.default));
  return parser;
}

function targetSpan(node, source) {
  const start = node.position.start.offset, end = node.position.end.offset;
  let offset = start;
  if (node.type === 'definition') {
    const prefix = source.slice(start, end).match(/^\s*\[(?:\\.|[^\]])*\]:\s*/);
    if (!prefix) return null;
    offset += prefix[0].length;
  } else {
    const labelEnd = node.type === 'link' && node.children?.at(-1)?.position?.end.offset;
    if (labelEnd && source[labelEnd] === ']') {
      offset = labelEnd + 1;
    } else {
      if (source[offset] === '!') offset++;
      let depth = 0;
      for (; offset < end; offset++) {
        if (source[offset] === '\\') { offset++; continue; }
        if (source[offset] === '[') depth++;
        if (source[offset] === ']' && --depth === 0) { offset++; break; }
      }
    }
    if (source[offset] !== '(') return null;
    offset++;
    while (/\s/.test(source[offset] || '') && offset < end) offset++;
  }
  if (source[offset] === '<') {
    const close = source.indexOf('>', offset);
    return close >= 0 && close < end ? {start: offset + 1, end: close} : null;
  }
  const targetStart = offset;
  let parentheses = 0;
  for (; offset < end; offset++) {
    const char = source[offset];
    if (char === '\\') { offset++; continue; }
    if (/\s/.test(char) || (char === ')' && parentheses === 0)) break;
    if (char === '(') parentheses++;
    if (char === ')') parentheses--;
  }
  return {start: targetStart, end: offset};
}

async function rewriteMarkdownLinks(source, rewrite) {
  const tree = (await markdownParser()).parse(source);
  const edits = [];
  function walk(node) {
    if (['link', 'image', 'definition'].includes(node.type)) {
      const next = rewrite(node.url);
      if (next !== node.url) {
        const span = targetSpan(node, source);
        if (!span) throw new Error(`Cannot locate Markdown link destination at ${node.position.start.line}`);
        edits.push({...span, value: next.replace(/[\s<>]/g, c => encodeURIComponent(c))});
      }
    }
    node.children?.forEach(walk);
  }
  walk(tree);
  for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.value + source.slice(edit.end);
  return source;
}

module.exports = {rewriteMarkdownLinks};
