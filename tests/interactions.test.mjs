import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium} from '@playwright/test';

test('navigation, pagination, slideshow and article scroll tracking still work', async () => {
 const server = http.createServer((request, response) => {
  let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.join('dist', pathname);
  try {
   response.setHeader('Content-Type', ({'.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.png':'image/png', '.svg':'image/svg+xml', '.gif':'image/gif'})[path.extname(file)] || 'application/octet-stream');
   response.end(fs.readFileSync(file));
  } catch { response.statusCode = 404; response.end(); }
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const browser = await chromium.launch({headless: true});
 try {
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  const origin = `http://127.0.0.1:${server.address().port}`;
  await page.goto(origin);
  assert.equal(await page.locator('#mobile-menu').isVisible(), false);
  await page.locator('#mobile-menu-btn').click();
  assert.equal(await page.locator('#mobile-menu').isVisible(), true);
  await page.locator('#mobile-menu-btn').click();
  assert.equal(await page.locator('#mobile-menu').isVisible(), false);
  await page.locator('#pagination-controls [data-page="2"]').click();
  assert.equal(await page.locator('[data-blog-page="1"]:visible').count(), 0);
  assert.equal(await page.locator('[data-blog-page="2"]:visible').count(), 6);
  await page.locator('#pagination-controls [data-page="3"]').click();
  assert.equal(await page.locator('[data-blog-page="3"]:visible').count(), 3);
  await page.locator('.slide.show .next-slide-btn').click();
  assert.equal(await page.locator('.slide.show').getAttribute('data-slide'), '2');
  await page.setViewportSize({width: 1440, height: 1000});
  await page.goto(`${origin}/blog/getting-started-with-ash-framework-in-elixir/`);
  await page.locator('#installing-ash-framework').evaluate(el => el.scrollIntoView());
  await page.waitForFunction(() => document.querySelector('.toc-active a')?.getAttribute('href') === '#installing-ash-framework');
 } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
