const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../../..');
const dependencyRoot = process.env.DOC_TOOLS_DEPENDENCIES ||
  (fs.existsSync(path.join(root, 'node_modules')) ? root : path.resolve(root, '../integration'));
const dependency = createRequire(path.join(dependencyRoot, 'package.json'));
const foundation = process.env.DOC_TOOLS_FOUNDATION ||
  (fs.existsSync(path.join(root, 'src/components/Icon')) ? root : path.resolve(root, '../structure'));
const babel = dependency('@babel/core');

// Only the owned components and the shared Icon are compiled. Dependencies are
// read from the coordinator checkout without installing or changing anything.
function sourceLoader(stubs = {}) {
  const cache = new Map();
  function load(filename) {
    if (!path.extname(filename)) {
      filename = fs.existsSync(`${filename}.js`) ? `${filename}.js` : path.join(filename, 'index.js');
    }
    if (cache.has(filename)) return cache.get(filename).exports;
    if (filename.endsWith('.css')) {
      return new Proxy({}, {get: (_, name) => name === '__esModule' ? false : String(name)});
    }
    const module = {exports: {}};
    cache.set(filename, module);
    const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
      filename, babelrc: false, configFile: false,
      presets: [dependency.resolve('@babel/preset-react')],
      plugins: [dependency.resolve('@babel/plugin-transform-modules-commonjs')],
    }).code;
    const localRequire = request => {
      if (Object.hasOwn(stubs, request)) return stubs[request];
      if (request === '@site/src/components/Icon') return load(path.join(foundation, 'src/components/Icon'));
      if (request.startsWith('@site/')) return load(path.join(root, request.slice(6)));
      if (request === '@theme/DocMeta') return load(path.join(root, 'src/theme/DocMeta'));
      if (request.startsWith('.')) return load(path.resolve(path.dirname(filename), request));
      return dependency(request);
    };
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, {filename})(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}

module.exports = {root, foundation, dependencyRoot, dependency, sourceLoader};
