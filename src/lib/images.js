import {getImage} from 'astro:assets';
import {load} from 'cheerio';
const sources = import.meta.glob('/static/images/**/*.{png,jpg,jpeg,gif}', {eager: true, import: 'default'});
const generated = new Map();
export async function imageAttributes(src, sizes = '100vw') {
  const image = sources[`/static${src}`];
  if (!image) return {src};
  const original = {'data-original-src': src, width: image.width, height: image.height, style: `aspect-ratio: ${image.width} / ${image.height};`};
  if (src.endsWith('.gif')) return {...original, src};
  if (!generated.has(src)) generated.set(src, Promise.all([...new Set([480, 640, 768, 1024, 1200, 1920].map(width => Math.min(width, image.width)))].map(width => getImage({src: image, width, format: 'webp', quality: 90}))));
  const variants = await generated.get(src);
  return {...original, src: variants.at(-1).src, srcset: variants.map(item => `${item.src} ${item.options.width}w`).join(', '), sizes};
}
export async function articleImages(html) {
  const $ = load(html, null, false);
  await Promise.all($('img').toArray().map(async node => {
    const element = $(node), src = element.attr('src');
    if (!src?.startsWith('/images/')) return;
    const attributes = await imageAttributes(src, '(min-width: 1536px) 1044px, (min-width: 768px) 73vw, 100vw');
    const existingStyle = element.attr('style') || '';
    for (const [name, value] of Object.entries(attributes)) element.attr(name, String(value));
    // Intrinsic ratios apply to the content box; article images include padding.
    element.attr('style', `aspect-ratio: ${attributes.width} / ${attributes.height}; box-sizing: content-box; max-width: calc(100% - 1rem); ${existingStyle}`.trim());
    element.attr('loading', 'lazy').attr('decoding', 'async');
  }));
  return $.html();
}
