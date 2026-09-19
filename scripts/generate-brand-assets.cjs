// Rebuild the favicon and default sharing image after changing the brand palette.
// Run from any directory: node scripts/generate-brand-assets.cjs
const fs = require('node:fs');
const path = require('node:path');
const {Resvg} = require('@resvg/resvg-js');
const {renderOgImage} = require('./og-image/render');

async function main() {
  const imageDir = path.resolve(__dirname, '../static/img');
  const svg = fs.readFileSync(path.join(imageDir, 'logo.svg'), 'utf8');
  const sizes = [16, 32, 48];
  const images = sizes.map(size => new Resvg(svg, {
    fitTo: {mode: 'width', value: size},
  }).render().asPng());
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, index) => {
    const entry = 6 + 16 * index;
    header[entry] = size;
    header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(images[index].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += images[index].length;
  });
  fs.writeFileSync(path.join(imageDir, 'favicon.ico'), Buffer.concat([header, ...images]));
  fs.writeFileSync(path.join(imageDir, 'social-card.png'), await renderOgImage({
    title: 'A field manual for cloud native engineering',
    category: '__root__',
    siteLabel: 'devfloor9.github.io/engineering-playbook',
  }));
  console.log('Generated favicon.ico (16/32/48 px) and social-card.png (1200 × 630 px).');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
