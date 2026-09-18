// A deliberately small, bounded interpreter for repository-owned static JSX.
// It never imports/executes the source module, evaluates generated JavaScript,
// exposes Node/browser globals, or calls a function obtained from source data.
const fs = require('node:fs');
const path = require('node:path');
const {parse, parseExpression} = require('@babel/parser');

const OPTIONS = {sourceType: 'module', plugins: ['jsx']};
const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor']);
const native = call => ({kind: 'native', call});
const element = (tag, props = {}, children = []) => ({kind: 'element', tag, props, children});

class StaticGap extends Error {}

function property(key) {
  if (typeof key !== 'string' && typeof key !== 'number') throw new StaticGap('Non-static property');
  if (FORBIDDEN.has(String(key))) throw new StaticGap('Prototype access is unsupported');
  return key;
}

class Scope {
  constructor(parent = null, file = '') {
    this.parent = parent;
    this.file = file || parent?.file;
    this.bindings = new Map();
  }
  set(name, value) { this.bindings.set(name, {value}); }
  assign(name, value) {
    if (this.bindings.has(name)) return this.set(name, value);
    if (this.parent) return this.parent.assign(name, value);
    throw new StaticGap(`Assignment to unknown binding: ${name}`);
  }
  lazy(name, read) { this.bindings.set(name, {read}); }
  get(name) {
    if (!this.bindings.has(name)) {
      if (this.parent) return this.parent.get(name);
      throw new StaticGap(`Unresolved identifier: ${name}`);
    }
    const binding = this.bindings.get(name);
    if (binding.busy) throw new StaticGap(`Cyclic binding: ${name}`);
    if (binding.read) {
      binding.busy = true;
      try {
        binding.value = binding.read();
        delete binding.read;
      } finally { binding.busy = false; }
    }
    return binding.value;
  }
}

class StaticRenderer {
  constructor({root, locale = 'ko', adapters = {}, stateProfiles = {}}) {
    this.root = path.resolve(root);
    this.realRoot = fs.realpathSync(this.root);
    this.locale = locale;
    this.adapters = adapters;
    this.stateProfiles = stateProfiles;
    this.parsed = new Map();
    this.reset();
  }
  reset() {
    this.modules = new Map();
    this.files = new Set();
    this.steps = 0;
    this.depth = 0;
  }
  relative(file) { return path.relative(this.root, file).replaceAll(path.sep, '/'); }
  tick() {
    if (++this.steps > 250000) throw new StaticGap('Static interpretation budget exceeded');
  }
  resolve(source, from) {
    const file = source.startsWith('@site/')
      ? path.resolve(this.root, source.slice(6))
      : source.startsWith('.') ? path.resolve(path.dirname(from), source) : null;
    if (!file) return null;
    if (!file.startsWith(`${this.root}${path.sep}`) && !file.startsWith(`${this.realRoot}${path.sep}`)) throw new StaticGap('Import outside repository');
    for (const candidate of [file, `${file}.js`, `${file}.jsx`, path.join(file, 'index.js')]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        const real = fs.realpathSync(candidate);
        if (!real.startsWith(`${this.realRoot}${path.sep}`)) throw new StaticGap('Import symlink outside repository');
        return path.join(this.root, path.relative(this.realRoot, real));
      }
    }
    throw new StaticGap(`Missing source module: ${source}`);
  }
  ast(file) {
    this.files.add(file);
    if (!this.parsed.has(file)) this.parsed.set(file, parse(fs.readFileSync(file, 'utf8'), OPTIONS).program);
    return this.parsed.get(file);
  }
  globals(file) {
    const scope = new Scope(null, file);
    scope.set('undefined', undefined);
    scope.set('NaN', NaN);
    for (const [name, fn] of Object.entries({
      String, Number, parseFloat, parseInt, isNaN, encodeURIComponent, decodeURIComponent,
    })) scope.set(name, native(args => fn(...args)));
    scope.get('Number').isFinite = native(([value]) => Number.isFinite(value));
    scope.set('Math', Object.fromEntries(['min', 'max', 'ceil', 'floor', 'round', 'abs', 'pow']
      .map(name => [name, native(args => Math[name](...args))])));
    scope.set('Object', {
      keys: native(([value]) => Object.keys(value)),
      values: native(([value]) => Object.values(value)),
      entries: native(([value]) => Object.entries(value)),
    });
    scope.set('Array', {isArray: native(([value]) => Array.isArray(value))});
    return scope;
  }
  external(source, exported, file) {
    const unsupported = native(() => { throw new StaticGap(`Runtime dependency: ${source}#${exported}`); });
    if (source === 'react') {
      const react = {
        Fragment: native(([props]) => props.children),
        useMemo: native(([fn]) => this.call(fn, [])),
        useState: native(() => {
          throw new StaticGap(`Interactive state needs an exhaustive source profile: ${this.relative(file)}`);
        }),
        useEffect: unsupported,
        useRef: unsupported,
        useId: native(() => 'static-export-id'),
      };
      return exported === 'default' || exported === '*' ? react : react[exported] || unsupported;
    }
    if (source === '@docusaurus/useDocusaurusContext' && exported === 'default') {
      return native(() => ({i18n: {currentLocale: this.locale}}));
    }
    if (source === '@docusaurus/theme-common' && exported === 'useColorMode') {
      return native(() => ({colorMode: 'light', isDarkTheme: false}));
    }
    if (source === '@docusaurus/Link' && exported === 'default') {
      return native(([props]) => element('a', {...props, href: props.to || props.href}, props.children));
    }
    if (source === '@docusaurus/useBaseUrl' && exported === 'default') return native(([url]) => url);
    if (source === '@theme/Heading' && exported === 'default') {
      return native(([props]) => element(props.as || 'h2', props, props.children));
    }
    throw new StaticGap(`Unsupported import: ${source}#${exported}`);
  }
  imported(source, exported, file) {
    const resolved = this.resolve(source, file);
    if (!resolved) return this.external(source, exported, file);
    this.files.add(resolved);
    if (resolved.endsWith('.json')) {
      if (exported !== 'default') throw new StaticGap('JSON requires a default import');
      return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    }
    if (resolved.endsWith('.module.css') && exported === 'default') return Object.create(null);
    if (!/\.[cm]?jsx?$/.test(resolved)) throw new StaticGap(`Non-data import: ${source}`);
    const adapter = this.adapters[this.relative(resolved)];
    if (adapter && exported === 'default') return {...native(args => adapter(args[0], this, resolved)), sourceFile: resolved};
    const module = this.module(resolved);
    if (exported === '*') return Object.fromEntries([...module.exports].map(([name, read]) => [name, read()]));
    const read = module.exports.get(exported);
    if (!read) throw new StaticGap(`Missing export: ${this.relative(resolved)}#${exported}`);
    return read();
  }
  module(file) {
    if (this.modules.has(file)) return this.modules.get(file);
    const ast = this.ast(file);
    const scope = this.globals(file);
    const exports = new Map();
    this.modules.set(file, {scope, exports});
    for (const statement of ast.body) {
      if (statement.type === 'ImportDeclaration') {
        for (const spec of statement.specifiers) {
          const exported = spec.type === 'ImportDefaultSpecifier' ? 'default'
            : spec.type === 'ImportNamespaceSpecifier' ? '*' : spec.imported.name || spec.imported.value;
          scope.lazy(spec.local.name, () => this.imported(statement.source.value, exported, file));
        }
      } else if (statement.type === 'ExportDefaultDeclaration') {
        const declaration = statement.declaration;
        if (declaration.type === 'FunctionDeclaration') this.declare(declaration, scope);
        exports.set('default', () => this.evaluate(declaration, scope));
      } else if (statement.type === 'ExportNamedDeclaration') {
        if (statement.declaration) {
          this.declare(statement.declaration, scope);
          const names = statement.declaration.type === 'VariableDeclaration'
            ? statement.declaration.declarations.flatMap(d => this.names(d.id))
            : [statement.declaration.id.name];
          for (const name of names) exports.set(name, () => scope.get(name));
        }
        for (const spec of statement.specifiers) {
          exports.set(spec.exported.name, () => statement.source
            ? this.imported(statement.source.value, spec.local.name, file) : scope.get(spec.local.name));
        }
      } else if (['VariableDeclaration', 'FunctionDeclaration'].includes(statement.type)) {
        this.declare(statement, scope);
      } else if (statement.type === 'ExpressionStatement' &&
          statement.expression.type === 'AssignmentExpression' &&
          statement.expression.left.type === 'MemberExpression' &&
          ['propTypes', 'defaultProps'].includes(statement.expression.left.property.name)) {
        // Metadata is never executed. defaultProps need an explicit adapter.
        if (statement.expression.left.property.name === 'defaultProps') throw new StaticGap('defaultProps requires an adapter');
      } else if (statement.type !== 'EmptyStatement') {
        throw new StaticGap(`Module side effect is unsupported: ${statement.type}`);
      }
    }
    return {scope, exports};
  }
  names(pattern) {
    if (pattern.type === 'Identifier') return [pattern.name];
    if (pattern.type === 'AssignmentPattern') return this.names(pattern.left);
    if (pattern.type === 'RestElement') return this.names(pattern.argument);
    if (pattern.type === 'ArrayPattern') return pattern.elements.flatMap(p => p ? this.names(p) : []);
    if (pattern.type === 'ObjectPattern') return pattern.properties.flatMap(p => this.names(p.value || p.argument));
    throw new StaticGap(`Unsupported binding: ${pattern.type}`);
  }
  bind(pattern, value, scope) {
    if (pattern.type === 'Identifier') return scope.set(pattern.name, value);
    if (pattern.type === 'AssignmentPattern') {
      return this.bind(pattern.left, value === undefined ? this.evaluate(pattern.right, scope) : value, scope);
    }
    if (pattern.type === 'ArrayPattern') {
      if (!Array.isArray(value)) throw new StaticGap('Non-static array binding');
      return pattern.elements.forEach((p, i) => p && this.bind(p, value[i], scope));
    }
    if (pattern.type === 'ObjectPattern') {
      if (value == null) throw new StaticGap('Non-static object binding');
      const used = new Set();
      for (const prop of pattern.properties) {
        if (prop.type === 'RestElement') {
          this.bind(prop.argument, Object.fromEntries(Object.entries(value).filter(([k]) => !used.has(k))), scope);
        } else {
          const key = property(prop.computed ? this.evaluate(prop.key, scope) : prop.key.name || prop.key.value);
          used.add(key);
          this.bind(prop.value, Object.hasOwn(value, key) ? value[key] : undefined, scope);
        }
      }
      return;
    }
    throw new StaticGap(`Unsupported binding: ${pattern.type}`);
  }
  declare(statement, scope) {
    if (statement.type === 'FunctionDeclaration') {
      if (statement.id) scope.set(statement.id.name, {kind: 'closure', node: statement, scope});
      return;
    }
    for (const d of statement.declarations) {
      let initialized = false;
      const read = () => {
        if (!initialized) {
          const name = d.id.type === 'ArrayPattern' ? d.id.elements[0]?.name : null;
          const profile = this.stateProfiles[this.relative(scope.file)];
          let value;
          if (name && profile && Object.hasOwn(profile, name)) {
            const callee = d.init?.callee;
            if (d.init?.type !== 'CallExpression' ||
                !(callee?.name === 'useState' || (callee?.object?.name === 'React' && callee.property?.name === 'useState'))) {
              throw new StaticGap(`State profile no longer matches source: ${name}`);
            }
            const replacement = profile[name];
            value = [typeof replacement === 'function' ? replacement(this, scope) : replacement,
              native(() => { throw new StaticGap('State updates are not static'); })];
          } else value = d.init ? this.evaluate(d.init, scope) : undefined;
          this.bind(d.id, value, scope);
          initialized = true;
        }
      };
      for (const name of this.names(d.id)) scope.lazy(name, () => { read(); return scope.get(name); });
    }
  }
  block(node, parent) {
    const scope = new Scope(parent);
    for (const statement of node.body) {
      if (['VariableDeclaration', 'FunctionDeclaration'].includes(statement.type)) this.declare(statement, scope);
    }
    for (const statement of node.body) {
      if (['VariableDeclaration', 'FunctionDeclaration', 'EmptyStatement'].includes(statement.type)) continue;
      const result = this.statement(statement, scope);
      if (result?.returned) return result;
    }
    return {returned: false, scope};
  }
  statement(node, scope) {
    this.tick();
    if (node.type === 'ReturnStatement') return {returned: true, value: this.evaluate(node.argument, scope), scope};
    if (node.type === 'BlockStatement') return this.block(node, scope);
    if (node.type === 'IfStatement') {
      const branch = this.evaluate(node.test, scope) ? node.consequent : node.alternate;
      return branch ? this.statement(branch, scope) : null;
    }
    if (node.type === 'ExpressionStatement') { this.evaluate(node.expression, scope); return; }
    if (node.type === 'VariableDeclaration') { this.declare(node, scope); return; }
    if (node.type === 'ForStatement') {
      const local = new Scope(scope);
      if (node.init?.type !== 'VariableDeclaration') throw new StaticGap('Unsupported loop initializer');
      this.declare(node.init, local);
      let iterations = 0;
      while (this.evaluate(node.test, local)) {
        if (++iterations > 1000) throw new StaticGap('Static loop budget exceeded');
        const result = this.statement(node.body, local);
        if (result?.returned) return result;
        this.evaluate(node.update, local);
      }
      return;
    }
    throw new StaticGap(`Unsupported statement: ${node.type}`);
  }
  call(fn, args) {
    this.tick();
    if (++this.depth > 80) { this.depth--; throw new StaticGap('Static call depth exceeded'); }
    try {
      if (fn?.kind === 'native') return fn.call(args);
      if (fn?.kind !== 'closure' || fn.node.async || fn.node.generator) throw new StaticGap('Non-static call');
      const scope = new Scope(fn.scope);
      fn.node.params.forEach((param, index) => this.bind(param, args[index], scope));
      return fn.node.body.type === 'BlockStatement'
        ? this.block(fn.node.body, scope).value : this.evaluate(fn.node.body, scope);
    } finally { this.depth--; }
  }
  member(value, key) {
    property(key);
    if (value == null) throw new StaticGap(`Missing member: ${key}`);
    if (Object.hasOwn(Object(value), key)) return value[key];
    if (Array.isArray(value)) {
      const callbacks = {
        map: ([fn]) => value.map((v, i) => {
          const result = this.call(fn, [v, i]);
          if (result?.kind === 'element') result.mapped = true;
          return result;
        }),
        filter: ([fn]) => value.filter((v, i) => this.call(fn, [v, i])),
        find: ([fn]) => value.find((v, i) => this.call(fn, [v, i])),
        some: ([fn]) => value.some((v, i) => this.call(fn, [v, i])),
        every: ([fn]) => value.every((v, i) => this.call(fn, [v, i])),
        reduce: ([fn, initial]) => value.reduce((a, v, i) => this.call(fn, [a, v, i]), initial),
      };
      if (Object.hasOwn(callbacks, key)) return native(callbacks[key]);
      if (['includes', 'indexOf', 'slice', 'join', 'concat', 'push'].includes(key)) return native(args => {
        if (key === 'push' && value.length + args.length > 10000) throw new StaticGap('Static array budget exceeded');
        return value[key](...args);
      });
    }
    if (typeof value === 'string' && ['includes', 'startsWith', 'endsWith', 'slice', 'split', 'trim', 'toLowerCase', 'toUpperCase', 'repeat'].includes(key)) {
      return native(args => {
        if (key === 'repeat' && (!Number.isInteger(args[0]) || args[0] < 0 || args[0] > 1000 ||
            value.length * args[0] > 1000000)) throw new StaticGap('Unbounded repeat');
        return value[key](...args);
      });
    }
    if (typeof value === 'string' && key === 'match') return native(([pattern]) => {
      if (pattern?.kind !== 'decimal-pattern') throw new StaticGap('Only the fixed decimal extraction pattern is supported');
      return value.match(/[\d.]+/);
    });
    if (typeof value === 'number' && ['toFixed', 'toLocaleString'].includes(key)) return native(args => value[key](...args));
    // Missing ordinary object properties behave as undefined; prototype members
    // never enter the interpreted environment.
    return undefined;
  }
  evaluate(node, scope) {
    this.tick();
    if (!node) return undefined;
    const ev = n => this.evaluate(n, scope);
    switch (node.type) {
      case 'StringLiteral': case 'NumericLiteral': case 'BooleanLiteral': return node.value;
      case 'NullLiteral': return null;
      case 'RegExpLiteral':
        // One linear-time pattern used to size the instance bandwidth bars.
        // Do not construct arbitrary source-provided regular expressions.
        if (node.pattern === '[\\d.]+' && node.flags === '') return {kind: 'decimal-pattern'};
        throw new StaticGap('Unsupported regular expression');
      case 'Identifier': return scope.get(node.name);
      case 'JSXEmptyExpression': return null;
      case 'ArrayExpression': return node.elements.flatMap(n => n?.type === 'SpreadElement' ? ev(n.argument) : [ev(n)]);
      case 'ObjectExpression': {
        const result = Object.create(null);
        for (const p of node.properties) {
          if (p.type === 'SpreadElement') {
            for (const [k, v] of Object.entries(ev(p.argument) || {})) result[property(k)] = v;
          } else if (p.type === 'ObjectProperty') {
            result[property(p.computed ? ev(p.key) : p.key.name ?? p.key.value)] = ev(p.value);
          } else throw new StaticGap(`Unsupported object member: ${p.type}`);
        }
        return result;
      }
      case 'TemplateLiteral': return node.quasis.map((q, i) => q.value.cooked + (i < node.expressions.length ? String(ev(node.expressions[i])) : '')).join('');
      case 'ArrowFunctionExpression': case 'FunctionExpression': case 'FunctionDeclaration':
        return {kind: 'closure', node, scope};
      case 'ConditionalExpression': return ev(node.test) ? ev(node.consequent) : ev(node.alternate);
      case 'LogicalExpression': {
        const left = ev(node.left);
        return node.operator === '&&' ? left && ev(node.right) : node.operator === '||' ? left || ev(node.right) : left ?? ev(node.right);
      }
      case 'UnaryExpression': {
        const value = ev(node.argument);
        if (node.operator === '!') return !value;
        if (node.operator === '-') return -value;
        if (node.operator === '+') return +value;
        if (node.operator === 'typeof') return typeof value;
        throw new StaticGap(`Unsupported unary operator: ${node.operator}`);
      }
      case 'BinaryExpression': {
        const a = ev(node.left), b = ev(node.right);
        switch (node.operator) {
          case '===': return a === b; case '!==': return a !== b;
          case '==': return a == b; case '!=': return a != b;
          case '<': return a < b; case '<=': return a <= b; case '>': return a > b; case '>=': return a >= b;
          case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': return a / b; case '%': return a % b; case '**': return a ** b;
          default: throw new StaticGap(`Unsupported binary operator: ${node.operator}`);
        }
      }
      case 'MemberExpression': case 'OptionalMemberExpression': {
        const value = ev(node.object);
        if (node.optional && value == null) return undefined;
        return this.member(value, node.computed ? ev(node.property) : node.property.name);
      }
      case 'CallExpression': case 'OptionalCallExpression': {
        const fn = ev(node.callee);
        if (node.optional && fn == null) return undefined;
        return this.call(fn, node.arguments.flatMap(n => n.type === 'SpreadElement' ? ev(n.argument) : [ev(n)]));
      }
      case 'JSXFragment': return node.children.map(ev);
      case 'JSXText': {
        // React/Babel's JSX whitespace rules (not Markdown whitespace rules).
        const lines = node.value.replaceAll('\t', ' ').split(/\r\n|\n|\r/);
        return lines.map((line, i) => {
          if (i) line = line.replace(/^ +/, '');
          if (i < lines.length - 1) line = line.replace(/ +$/, '');
          return line;
        }).filter(Boolean).join(' ');
      }
      case 'JSXExpressionContainer': return ev(node.expression);
      case 'JSXElement': return this.jsx(node, scope);
      case 'AssignmentExpression': {
        if (node.left.type !== 'Identifier' || node.operator !== '=') throw new StaticGap('Only local assignment is supported');
        scope.assign(node.left.name, ev(node.right));
        return scope.get(node.left.name);
      }
      case 'UpdateExpression': {
        if (node.argument.type !== 'Identifier' || !['++', '--'].includes(node.operator)) throw new StaticGap('Only local counters are supported');
        const old = scope.get(node.argument.name);
        const value = old + (node.operator === '++' ? 1 : -1);
        scope.assign(node.argument.name, value);
        return node.prefix ? value : old;
      }
      default: throw new StaticGap(`Unsupported expression: ${node.type}`);
    }
  }
  jsx(node, scope) {
    const name = node.openingElement.name;
    const intrinsic = name.type === 'JSXIdentifier' && /^[a-z]/.test(name.name);
    const props = Object.create(null);
    for (const attribute of node.openingElement.attributes) {
      if (attribute.type === 'JSXSpreadAttribute') {
        for (const [key, value] of Object.entries(this.evaluate(attribute.argument, scope))) props[property(key)] = value;
        continue;
      }
      const key = property(attribute.name.name);
      // Presentation and handlers are not article data. CSS grid metadata is
      // interpreted separately, without executing arbitrary styling functions.
      if (/^on[A-Z]/.test(key) || ['key', 'ref', 'className'].includes(key)) continue;
      if (key === 'dangerouslySetInnerHTML') throw new StaticGap('Raw HTML injection requires an adapter');
      if (key === 'style') {
        props.style = this.evaluate(attribute.value, scope);
        continue;
      }
      props[key] = attribute.value ? this.evaluate(attribute.value, scope) : true;
    }
    const children = node.children.map(n => this.evaluate(n, scope));
    props.children = children;
    if (intrinsic) {
      if (['script', 'iframe', 'canvas', 'object', 'embed'].includes(name.name)) throw new StaticGap(`Embedded content needs an adapter: ${name.name}`);
      return element(name.name, props, children);
    }
    let fn;
    if (name.type === 'JSXIdentifier') fn = scope.get(name.name);
    else if (name.type === 'JSXMemberExpression' && name.object.type === 'JSXIdentifier') {
      fn = this.member(scope.get(name.object.name), name.property.name);
    } else throw new StaticGap('Unsupported component member');
    return this.call(fn, [props]);
  }
  expression(source, bindings = new Map(), file = path.join(this.root, 'docs/unknown.md')) {
    const scope = this.globals(file);
    for (const [local, binding] of bindings) {
      scope.lazy(local, () => this.imported(binding.source, binding.exported, file));
    }
    return this.evaluate(parseExpression(source, OPTIONS), scope);
  }
  componentScope(file, props = {}) {
    const fn = this.module(file).exports.get('default')();
    if (fn?.kind !== 'closure' || fn.node.body.type !== 'BlockStatement') throw new StaticGap('Source adapter no longer matches component');
    const scope = new Scope(fn.scope);
    fn.node.params.forEach((param, i) => this.bind(param, i === 0 ? props : undefined, scope));
    for (const statement of fn.node.body.body) {
      if (['VariableDeclaration', 'FunctionDeclaration'].includes(statement.type)) this.declare(statement, scope);
    }
    return scope;
  }
}

module.exports = {StaticRenderer, StaticGap, Scope, element, native, OPTIONS};
