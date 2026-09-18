const path = require('node:path');

module.exports = function cssFixtureLoader(source) {
  const prefix = path.basename(path.dirname(this.resourcePath));
  const classes = {};
  const css = source.replace(/\.([a-zA-Z_][\w-]*)/g, (_, name) => {
    classes[name] = `${prefix}_${name}`;
    return `.${classes[name]}`;
  });
  return `const sheet = document.createElement('style');
sheet.textContent = ${JSON.stringify(css)};
document.head.append(sheet);
export default ${JSON.stringify(classes)};`;
};
