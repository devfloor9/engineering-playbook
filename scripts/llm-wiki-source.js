const {parse, parseExpression} = require('@babel/parser');
const {OPTIONS} = require('./llm-wiki-static');

function fenceMarker(line, fence) {
  const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  if (!marker) return {fence, boundary: false};
  if (!fence) return {fence: marker[1], boundary: true};
  if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) {
    return {fence: null, boundary: true};
  }
  return {fence, boundary: false};
}

// Parse a single ESM declaration at a time. Complete declarations cannot borrow
// the next import, paragraph, JSX block, or fenced code example.
function readImports(content) {
  const lines = content.split('\n');
  const imports = new Map();
  const declarations = new Map();
  let fence = null;
  for (let index = 0; index < lines.length; index++) {
    const marker = fenceMarker(lines[index], fence);
    fence = marker.fence;
    if (marker.boundary || fence || !/^(import\s|export\s)/.test(lines[index])) continue;
    let declaration;
    let end = index;
    for (; end < lines.length && end - index < 500; end++) {
      if (end > index && /^(import\s|export\s|#{1,6}\s|```|~~~)/.test(lines[end])) break;
      let program;
      try { program = parse(lines.slice(index, end + 1).join('\n'), OPTIONS).program; }
      catch { continue; }
      if (program.body.length === 1 && /^(ImportDeclaration|ExportNamedDeclaration|ExportDefaultDeclaration)$/.test(program.body[0].type)) {
        declaration = program.body[0];
      }
      break;
    }
    if (!declaration) continue;
    if (declaration.type === 'ImportDeclaration') {
      for (const specifier of declaration.specifiers) {
        const exported = specifier.type === 'ImportDefaultSpecifier' ? 'default'
          : specifier.type === 'ImportNamespaceSpecifier' ? '*'
            : specifier.imported.name ?? specifier.imported.value;
        imports.set(specifier.local.name, {source: declaration.source.value, exported});
      }
    } else {
      const body = declaration.declaration;
      if (body?.type === 'VariableDeclaration') {
        for (const d of body.declarations) if (d.id.type === 'Identifier') declarations.set(d.id.name, d.init);
      } else if (body?.id) declarations.set(body.id.name, body);
    }
    for (let removed = index; removed <= end; removed++) lines[removed] = '';
    index = end;
  }
  return {lines, imports, declarations};
}

function jsxBlock(lines, start) {
  let source = '';
  for (let end = start; end < lines.length && end - start < 1000; end++) {
    const line = lines[end];
    const before = source.length;
    source += (end === start ? '' : '\n') + line;
    // Babel validates the entire prefix, including nested elements, strings
    // containing > and literal arrays/objects. No JSX is evaluated here.
    for (let offset = source.indexOf('>', before); offset !== -1; offset = source.indexOf('>', offset + 1)) {
      const text = source.slice(0, offset + 1).trim();
      try {
        const node = parseExpression(text, OPTIONS);
        if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
          return {text, node, end, trailing: source.slice(offset + 1)};
        }
      } catch { /* an incomplete prefix */ }
    }
    if (source.length > 150000) break;
  }
  return null;
}

function compactMarkdown(source) {
  let fence = null, blanks = 0;
  return source.split('\n').filter(line => {
    const marker = fenceMarker(line, fence);
    fence = marker.fence;
    if (marker.boundary || fence) { blanks = 0; return true; }
    blanks = line.trim() ? 0 : blanks + 1;
    return blanks <= 2;
  }).join('\n');
}

function inlineComponentOffset(line, imports, declarations) {
  let ticks = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '\\') { i++; continue; }
    if (line[i] === '`') {
      const count = line.slice(i).match(/^`+/)[0].length;
      ticks = ticks === count ? 0 : ticks || count;
      i += count - 1;
      continue;
    }
    if (!ticks && line[i] === '<') {
      const name = line.slice(i).match(/^<([A-Z][\w.]*)\b/)?.[1];
      if (name && (imports.has(name.split('.')[0]) || declarations.has(name))) return i;
    }
  }
  return -1;
}

module.exports = {readImports, fenceMarker, jsxBlock, compactMarkdown, inlineComponentOffset};
