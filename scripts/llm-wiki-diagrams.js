const fs = require('node:fs');
const path = require('node:path');
const {StaticGap, element} = require('./llm-wiki-static');
const {fromHtml, descendants, flatten, markdown} = require('./llm-wiki-markdown');
const {parseFragment} = require('parse5');

function walk(node, fn) {
  if (!node || typeof node !== 'object') return;
  if (node.type) fn(node);
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'comments', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach(n => walk(n, fn));
    else if (value && typeof value === 'object') walk(value, fn);
  }
}

// Read the literal drawing commands, not the DOM implementation or roughjs.
// Coordinates and polylines remain available in the export, so the geometry is
// not replaced by an invented edge list or by a bag of unconnected labels.
function openClaw(props, renderer, file) {
  if (Object.keys(props).some(key => key !== 'children')) throw new StaticGap('OpenClaw diagram does not declare props');
  let drawAll;
  walk(renderer.ast(file), node => {
    if (node.type === 'FunctionDeclaration' && node.id?.name === 'drawAll') drawAll = node;
  });
  if (!drawAll) throw new StaticGap('OpenClaw drawAll source not found');
  const scope = renderer.globals(file);
  scope.set('isDark', false);
  const commands = [];
  for (const statement of drawAll.body.body) {
    const call = statement.expression;
    if (statement.type !== 'ExpressionStatement' || call?.type !== 'CallExpression' ||
        !['rRect', 'addText', 'addArrow'].includes(call.callee.name)) {
      throw new StaticGap('OpenClaw drawing command is no longer static');
    }
    commands.push({name: call.callee.name, args: call.arguments.map(a => renderer.evaluate(a, scope))});
  }
  const texts = commands.filter(c => c.name === 'addText').map(c => ({x: c.args[0], y: c.args[1], text: c.args[2]}));
  const boxes = commands.filter(c => c.name === 'rRect').map((c, i) => {
    const [x, y, width, height] = c.args;
    return {id: `B${i + 1}`, x, y, width, height, labels: []};
  });
  // A label belongs to the smallest enclosing box. Group titles stay with the
  // group; free-standing arrow labels remain in the complete label table.
  for (const text of texts) {
    const box = boxes.filter(b => text.x >= b.x && text.x <= b.x + b.width && text.y >= b.y && text.y <= b.y + b.height)
      .sort((a, b) => a.width * a.height - b.width * b.height)[0];
    if (box) box.labels.push(text.text);
  }
  function endpoint(point) {
    // A boundary hit is exact in this source. Some arrows start inside a box.
    const hits = boxes.filter(b => point[0] >= b.x && point[0] <= b.x + b.width &&
      point[1] >= b.y && point[1] <= b.y + b.height).sort((a, b) => a.width * a.height - b.width * b.height);
    return hits[0]?.id || `(${point.join(', ')})`;
  }
  const arrows = commands.filter(c => c.name === 'addArrow').map(c => {
    const points = c.args[0];
    return [endpoint(points[0]), endpoint(points.at(-1)), points.map(p => `(${p.join(', ')})`).join(' → ')];
  });
  return element('section', {}, [
    element('h4', {}, ['OpenClaw architecture — source drawing data']),
    element('p', {}, ['Boxes list their original coordinates and labels. Arrows follow the source polyline direction; unbound labels are retained with coordinates. Animation and colour are presentation only.']),
    // Use ordinary tree tables so escaping and cell boundaries share one path.
    dataTable(['Box', 'x', 'y', 'width', 'height', 'Labels'], boxes.map(b => [b.id, b.x, b.y, b.width, b.height, b.labels.join('\n')])),
    dataTable(['From box', 'To box', 'Directed polyline'], arrows),
    dataTable(['Label', 'x', 'y'], texts.map(t => [t.text, t.x, t.y])),
  ]);
}

function dataTable(headers, rows) {
  return element('table', {}, [
    element('tr', {}, headers.map(h => element('th', {}, [h]))),
    ...rows.map(row => element('tr', {}, row.map(c => element('td', {}, [c])))),
  ]);
}

function inlinePipeline(tag, {filePath, declarations, renderer}) {
  const relative = filePath && renderer.relative(filePath);
  if (relative !== 'docs/agentic-ai-platform/reference-architecture/inference-gateway/setup/index.md' ||
      tag !== 'InferencePipelineDiagram') return null;
  const declaration = declarations.get(tag);
  let iframe;
  walk(declaration, n => { if (n.type === 'JSXElement' && n.openingElement.name.name === 'iframe') iframe = n; });
  const src = iframe?.openingElement.attributes.find(a => a.name?.name === 'src')?.value?.expression;
  if (src?.type !== 'TemplateLiteral' ||
      src.quasis.map(q => q.value.cooked).join('') !== '/engineering-playbook/agentic-platform-architecture.html?theme=' ||
      src.expressions.length !== 1 || src.expressions[0].name !== 'colorMode') {
    throw new StaticGap('Pipeline iframe source changed; review the static HTML adapter');
  }
  const htmlFile = path.join(renderer.root, 'static/agentic-platform-architecture.html');
  const tree = fromHtml(fs.readFileSync(htmlFile, 'utf8'));
  const main = descendants(tree, 'main');
  if (main.length !== 1) throw new StaticGap('Pipeline HTML main content is missing or ambiguous');
  function convert(node) {
    if (Array.isArray(node)) return node.map(convert);
    if (!node || typeof node !== 'object') return node;
    const classes = (node.props.class || '').split(/\s+/);
    if (classes.includes('arrow')) {
      // These arrows are CSS shapes, not text nodes. The source class defines
      // their downward direction; keep adjacent labels in source order.
      return element('p', {}, ['↓ ', ...flatten(node.children).map(convert)]);
    }
    if (node.tag === 'svg') return ''; // Small decorative service icons only.
    return {...node, children: node.children.map(convert)};
  }
  return {
    name: tag,
    markdown: 'Static text equivalent of the embedded architecture (including source labels and flow order).\n\n' +
      markdown(convert(main)) + '\n\n[Interactive architecture](/agentic-platform-architecture.html)',
    method: 'static-html-source',
    source: `${relative}#${tag}`,
    source_files: [relative, renderer.relative(htmlFile)],
  };
}

function embeddedDiagram(block, {filePath, renderer}) {
  if (block.node.openingElement.name.name !== 'iframe') return null;
  const src = block.node.openingElement.attributes.find(a => a.name?.name === 'src')?.value;
  if (src?.type !== 'StringLiteral') throw new StaticGap('Runtime iframe source is not static');
  let url;
  try { url = new URL(src.value); }
  catch { throw new StaticGap('Iframe URL is not a supported static resource'); }
  if (url.hostname !== 'viewer.diagrams.net') throw new StaticGap('External iframe content has no static source adapter');
  let raw;
  try { raw = new URL(url.searchParams.get('url')); }
  catch { throw new StaticGap('Viewer URL does not identify a static drawing'); }
  const prefix = '/devfloor9/engineering-playbook/main/static/';
  if (raw.hostname !== 'raw.githubusercontent.com' || !raw.pathname.startsWith(prefix)) throw new StaticGap('Diagram is not a repository-owned static file');
  const name = decodeURIComponent(raw.pathname.slice(prefix.length));
  const file = path.resolve(renderer.root, 'static', name);
  if (!file.startsWith(path.join(renderer.root, 'static') + path.sep) || !file.endsWith('.drawio')) throw new StaticGap('Unsupported diagram source path');
  if (!fs.existsSync(file)) throw new StaticGap('Local diagram source is missing');
  const xml = fs.readFileSync(file, 'utf8');
  if (!xml.includes('<mxGraphModel') || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new StaticGap('Only uncompressed draw.io graph data is supported');
  // Parse each XML start tag as an isolated HTML fragment. Explicit mxCell IDs,
  // source/target and parent attributes carry the graph; HTML parser nesting
  // rules cannot alter it. No XML entities, scripts or remote URLs are executed.
  const tags = [...xml.matchAll(/<mxCell\b(?:"[^"]*"|'[^']*'|[^'">])*>/g)];
  const cells = tags.map(([tag]) => Object.fromEntries(parseFragment(tag).childNodes[0].attrs.map(a => [a.name, a.value])));
  if (!cells.length || new Set(cells.map(c => c.id)).size !== cells.length) throw new StaticGap('Diagram cell IDs are missing or duplicated');
  const ids = new Set(cells.map(c => c.id));
  for (const cell of cells) for (const key of ['parent', 'source', 'target']) {
    if (cell[key] && !ids.has(cell[key])) throw new StaticGap(`Diagram has unresolved ${key}: ${cell[key]}`);
  }
  const vertices = cells.filter(c => c.vertex === '1');
  const edges = cells.filter(c => c.edge === '1');
  const label = c => c.value ? fromHtml(c.value) : '';
  const style = c => Object.fromEntries((c.style || '').split(';').filter(s => s.includes('=')).map(s => s.split('=')));
  const tree = [
    element('h4', {}, ['Architecture — draw.io source graph']),
    element('p', {}, ['Source node IDs, parent groups, labels and edge endpoints are retained below. Arrow styles are copied literally; an unspecified arrow style is not inferred. Layout and interactive zoom remain in the linked drawing.']),
    dataTable(['Node ID', 'Parent ID', 'Label'], vertices.map(c => [c.id, c.parent || '', label(c)])),
    dataTable(['Edge ID', 'Parent ID', 'Source ID', 'Target ID', 'Label', 'Start arrow', 'End arrow', 'Dashed'], edges.map(c => [
      c.id, c.parent || '', c.source || '(unspecified)', c.target || '(unspecified)', label(c),
      style(c).startArrow || '(unspecified)', style(c).endArrow || '(unspecified)', style(c).dashed || '(unspecified)',
    ])),
    element('a', {href: `/${name}`}, ['Source drawing']),
  ];
  return {name: 'iframe', method: 'static-drawio-source',
    markdown: markdown(tree), source: `static/${name}`,
    source_files: [renderer.relative(filePath), renderer.relative(file)],
    graph_counts: {vertices: vertices.length, edges: edges.length}};
}

module.exports = {openClaw, inlinePipeline, embeddedDiagram, walk, dataTable};
