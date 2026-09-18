// Independent parity oracle: compile the repository's real JSX to temporary
// files, then render it with React DOM. No full Docusaurus build or installation.
// This is test-only; the exporter never compiles or executes source modules.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {transformSync} = require('@babel/core');
const {parseExpression} = require('@babel/parser');
const {renderToStaticMarkup} = require('react-dom/server');

function reactOracle(root) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-wiki-react-'));
  const compiled = new Map();
  let serial = 0;
  const context = path.join(directory, 'context.cjs');
  fs.writeFileSync(context, `exports.default = () => ({i18n: {currentLocale: 'ko'}});
exports.__esModule = true;
exports.useColorMode = () => ({colorMode: 'light'});
exports.useHistory = () => ({replace() {}});
exports.useLocation = () => ({hash: ''});`);
  const link = path.join(directory, 'link.cjs');
  fs.writeFileSync(link, `const React = require(${JSON.stringify(require.resolve('react'))});
module.exports = props => React.createElement('a', {...props, href: props.to || props.href}, props.children);`);
  const css = path.join(directory, 'css.cjs');
  fs.writeFileSync(css, "module.exports = new Proxy({}, {get: (_, key) => key === '__esModule' ? false : String(key)});");
  const baseUrl = path.join(directory, 'base-url.cjs');
  fs.writeFileSync(baseUrl, 'module.exports = value => value;');
  function resolve(source, from) {
    if (source.endsWith('.css')) return css;
    if (['react', 'prop-types', 'clsx'].includes(source)) return require.resolve(source);
    if (['@docusaurus/useDocusaurusContext', '@docusaurus/theme-common', '@docusaurus/router'].includes(source)) return context;
    if (source === '@docusaurus/Link') return link;
    if (source === '@docusaurus/useBaseUrl') return baseUrl;
    const base = source.startsWith('@site/') ? path.join(root, source.slice(6))
      : source.startsWith('.') ? path.resolve(path.dirname(from), source) : null;
    if (!base) throw new Error(`Oracle has no mock for ${source}`);
    const target = [base, base + '.js', base + '.jsx', path.join(base, 'index.js')]
      .find(f => fs.existsSync(f) && fs.statSync(f).isFile());
    if (!target) throw new Error(`Oracle source missing: ${source}`);
    return target.endsWith('.json') ? target : compile(target);
  }
  function transform(source, file) {
    const relative = path.relative(root, file).replaceAll(path.sep, '/');
    if (!/\bimport\s+React\b/.test(source)) source = `import React from 'react';\n${source}`;
    return transformSync(source, {
      filename: file, babelrc: false, configFile: false,
      plugins: [
        function sourceImports() {
          return {visitor: {
            ImportDeclaration(p) { p.node.source.value = resolve(p.node.source.value, file); },
            ExportNamedDeclaration(p) { if (p.node.source) p.node.source.value = resolve(p.node.source.value, file); },
            VariableDeclarator(p) {
              // Exercise every collapsed category using the component's own
              // category list and real rendering functions.
              if (['src/components/GatewayApiTables/FeatureComparisonMatrix.js', 'src/components/GatewayApiTables/SolutionOverviewMatrix.js'].includes(relative)) {
                const name = p.node.id.type === 'ArrayPattern' && p.node.id.elements[0]?.name;
                if (name === 'expanded') p.node.init.arguments[0] = parseExpression('Object.fromEntries(categories.map(c => [c.id, true]))');
                if (name === 'allExpanded') p.node.init.arguments[0] = parseExpression('true');
              }
            },
          }};
        },
        [require.resolve('@babel/plugin-transform-react-jsx'), {runtime: 'classic'}],
        require.resolve('@babel/plugin-transform-modules-commonjs'),
      ],
    }).code;
  }
  function compile(file) {
    if (compiled.has(file)) return compiled.get(file);
    const output = path.join(directory, `module-${++serial}.cjs`);
    compiled.set(file, output);
    fs.writeFileSync(output, transform(fs.readFileSync(file, 'utf8'), file));
    return output;
  }
  function render(block, imports, file) {
    // Keep only bindings referenced by this JSX expression, not other widgets
    // in the document. Each success was already proved static by the exporter.
    const declarations = [...imports].filter(([name]) => new RegExp(`\\b${name}\\b`).test(block))
      .map(([name, binding]) => `import ${binding.exported === 'default' ? name
        : binding.exported === '*' ? `* as ${name}` : `{${binding.exported} as ${name}}`} from ${JSON.stringify(binding.source)};`);
    const source = `import React from 'react';\n${declarations.join('\n')}\nexport default function Fixture() { return (${block}); }`;
    const output = path.join(directory, `fixture-${++serial}.cjs`);
    fs.writeFileSync(output, transform(source, file));
    const Component = require(output).default;
    return renderToStaticMarkup(require('react').createElement(Component));
  }
  return {
    render,
    close() {
      for (const file of Object.keys(require.cache)) if (file.startsWith(directory + path.sep)) delete require.cache[file];
      fs.rmSync(directory, {recursive: true, force: true});
    },
  };
}

module.exports = {reactOracle};
