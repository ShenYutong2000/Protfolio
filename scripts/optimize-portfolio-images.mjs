import sharp from 'sharp';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const images = JSON.parse(await readFile(new URL('src/data/portfolio-images.json', root), 'utf8'));
const output = new URL('vendor/portfolio-template/public/gallery/', root);
await mkdir(output, { recursive: true });
let before = 0;
let after = 0;
for (const { file } of images) {
  const source = new URL(`vendor/portfolio-template/public/images/${file}`, root);
  const target = new URL(file, output);
  const buffer = await sharp(await readFile(source))
    .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 }).toBuffer();
  await writeFile(target, buffer);
  before += (await stat(source)).size;
  after += buffer.length;
}
console.log(JSON.stringify({ beforeBytes: before, afterBytes: after, reduction: `${Math.round((1 - after / before) * 100)}%` }));
