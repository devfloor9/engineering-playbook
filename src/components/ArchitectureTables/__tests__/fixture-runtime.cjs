const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const root = path.resolve(__dirname, '../../../..');
const dependencies = path.resolve(process.env.EP65_DEPENDENCIES || path.join(root, '../integration/node_modules'));
const dependency = createRequire(path.join(dependencies, '../package.json'));
const shared = path.resolve(process.env.EP65_SHARED_COMPONENTS || path.join(root, 'src/components'));
const babel = dependency('@babel/core');
const parse = dependency('@babel/parser').parse;
const generate = dependency('@babel/generator').default;
const React = dependency('react');
const renderToStaticMarkup = dependency('react-dom/server').renderToStaticMarkup;
const groups = ['ArchitectureTables', 'AgenticChallengesTables', 'AgenticSolutionsTables', 'DecisionFrameworkTables'];
const files = groups.flatMap(group => fs.readdirSync(path.join(root, 'src/components', group))
  .filter(file => file.endsWith('.js') && !['index.js', 'ManualTable.js'].includes(file))
  .map(file => `src/components/${group}/${file}`))
  .concat(['src/components/ThroughputChart.js', 'src/components/InferenceThroughputChart.js']);
const resolve = file => {
  for (const candidate of [file, file + '.js', path.join(file, 'index.js')]) if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  throw new Error(`Missing component ${file}; supply EP65_SHARED_COMPONENTS with the coordinated DataTableFrame/Figure checkout.`);
};
function runtime(locale = 'en', mode = 'light') {
  const cache = new Map(), css = new Map(), modules = new Map();
  function load(file) {
    if (file.startsWith(path.join(root, 'src/components/Figure')) || file.startsWith(path.join(root, 'src/components/DataTableFrame'))) {
      file = path.join(shared, path.relative(path.join(root, 'src/components'), file));
    }
    file = resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = {exports: {}};
    cache.set(file, module);
    if (file.endsWith('.css')) {
      const prefix = path.basename(path.dirname(file)) + '_' + path.basename(file).replaceAll('.', '_') + '_';
      const names = {};
      const source = fs.readFileSync(file, 'utf8').replace(/\.([a-zA-Z_][\w-]*)/g, (_, name) => '.' + (names[name] = prefix + name));
      css.set(file, source);
      module.exports = names;
      modules.set(file, 'module.exports = ' + JSON.stringify(names));
      return names;
    }
    const code = babel.transformSync(fs.readFileSync(file, 'utf8'), {
      filename: file, configFile: false, babelrc: false,
      plugins: [dependency.resolve('@babel/plugin-transform-react-jsx'), dependency.resolve('@babel/plugin-transform-modules-commonjs')],
    }).code;
    modules.set(file, code);
    function requireLocal(name) {
      if (name === '@docusaurus/useDocusaurusContext') return () => ({i18n: {currentLocale: locale}});
      if (name === '@docusaurus/theme-common') return {useColorMode: () => ({colorMode: mode})};
      if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name));
      return dependency(name);
    }
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, {filename: file})(requireLocal, module, module.exports);
    return module.exports;
  }
  return {load, css, modules, render(file, props = {}) {
    return renderToStaticMarkup(React.createElement(load(path.join(root, file)).default, props), {identifierPrefix: path.basename(file) + locale});
  }};
}
function authoredData(source, locale) {
  const ast = parse(source, {sourceType: 'module', plugins: ['jsx']});
  const declarations = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' &&
      (node.init?.type === 'ArrayExpression' || node.init?.type === 'ObjectExpression' ||
       (node.init?.type === 'ConditionalExpression' && node.init.consequent.type === 'ArrayExpression'))) {
      // These are authored literal datasets, never executable component code.
      if (!['theme', 'challengeColors'].includes(node.id.name)) declarations.push(node);
    }
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else if (value?.type) visit(value);
  }
  visit(ast.program);
  const result = {};
  for (const node of declarations) {
    const value = vm.runInNewContext(`(${generate(node.init).code})`, {isKo: locale === 'ko'});
    result[node.id.name] = JSON.parse(JSON.stringify(value, (key, item) => ['color', 'bgColor', 'icon'].includes(key) ? undefined : item));
  }
  return result;
}
module.exports = {root, shared, dependency, files, runtime, authoredData, parse, React, resolve};
