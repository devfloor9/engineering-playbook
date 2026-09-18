const path = require('node:path');
const crypto = require('node:crypto');
module.exports = function scopedCss(source) {
  const names = {};
  const prefix = crypto.createHash('sha1').update(path.relative(process.cwd(), this.resourcePath)).digest('hex').slice(0, 6);
  const css = source.replace(/([^{}]+)\{/g, (match, selector) => {
    if (selector.trim().startsWith('@')) return match;
    const globals = [];
    return selector.replace(/:global\(([^)]+)\)/g, (_, text) => `GLOBAL${globals.push(text) - 1}`)
      .replace(/\.([a-zA-Z_][\w-]*)/g, (_, name) => `.${names[name] ||= `ep${prefix}_${name}`}`)
      .replace(/GLOBAL(\d+)/g, (_, index) => globals[index]) + '{';
  });
  return `const style = document.createElement('style'); style.textContent = ${JSON.stringify(css)}; document.head.append(style); export default ${JSON.stringify(names)};`;
};
