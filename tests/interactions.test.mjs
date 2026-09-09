import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium} from '@playwright/test';

test('archive navigation, article anchors and responsive images work', async () => {
 const server = http.createServer((request, response) => {
  let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.join('dist', pathname);
  try {
   for (const line of fs.readFileSync('dist/_headers', 'utf8').split('\n\n')[0].split('\n').slice(1)) {const colon = line.indexOf(':');if(colon > 0) response.setHeader(line.slice(0,colon).trim(),line.slice(colon+1).trim());}
   response.setHeader('Content-Type', ({'.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.png':'image/png', '.svg':'image/svg+xml', '.gif':'image/gif'})[path.extname(file)] || 'application/octet-stream');
   response.end(fs.readFileSync(file));
  } catch { response.statusCode = 404; response.end(); }
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const browser = await chromium.launch({headless: true});
 try {
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  const violations = [];
  page.on('console', message => {if (message.text().includes('Content Security Policy')) violations.push(message.text());});
  const origin = `http://127.0.0.1:${server.address().port}`;
  await page.goto(origin);
  await page.getByRole('link', {name: 'Blog', exact: true}).click();
  assert.equal(await page.locator('.article-row').count(),15);
  await page.locator('.article-row').first().click();
  assert.ok(await page.locator('.blog-post-body').isVisible());
  await page.goto(`${origin}/blog/getting-started-with-ash-framework-in-elixir/`);
  await page.locator('.toc-list a[href="#installing-ash-framework"]').click();
  assert.ok(page.url().endsWith('#installing-ash-framework'));
  await page.goto(`${origin}/blog/dripping-elixir-knowledge/`);
  for (const width of [390, 1440]) {
   await page.setViewportSize({width, height: 1000});
   for (const image of await page.locator('.blog-post-body figure img').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(image => image.decode());
    const dimensions = await image.evaluate(image => {
     const style = getComputedStyle(image), rect = image.getBoundingClientRect();
     return {alt: image.alt, width: rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), height: rect.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom), ratio: Number(image.getAttribute('width')) / Number(image.getAttribute('height'))};
    });
    assert.ok(dimensions.alt.length > 20, 'article screenshots have descriptive alternatives');
    assert.ok(Math.abs(dimensions.width / dimensions.height - dimensions.ratio) < 0.001, 'padded screenshot content retains its intrinsic ratio');
   }
  }
  assert.deepEqual(violations, []);
 } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
