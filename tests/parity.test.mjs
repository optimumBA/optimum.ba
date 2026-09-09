import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {load} from 'cheerio';
const baseline = process.env.BASELINE_DIR;
const norm = value => value.replace(/\s+/g, ' ').trim();
const files = root => fs.readdirSync(root, {recursive: true}).filter(file => fs.statSync(path.join(root, file)).isFile());
test('existing pages preserve text, metadata, links, anchors and code rendering', {skip: !baseline}, () => {
 for (const file of files(baseline).filter(file => file.endsWith('.html'))) {
  const old = load(fs.readFileSync(path.join(baseline, file))), next = load(fs.readFileSync(path.join('dist', file)));
  assert.equal(norm(next('body').text()), norm(old('body').text()), `${file}: body text`);
  assert.equal(norm(next('title').text()), norm(old('title').text()), `${file}: title`);
  for (const selector of ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image"]']) assert.equal(next(selector).attr('content'), old(selector).attr('content'), `${file}: ${selector}`);
  for (const [selector, attribute] of [['a','href'], ['[id]','id'], ['img','src']]) assert.deepEqual(next(selector).map((i,e)=>next(e).attr(attribute)).get(), old(selector).map((i,e)=>old(e).attr(attribute)).get(), `${file}: ${attribute}`);
  assert.deepEqual(next('pre').map((i,e)=>next.html(e)).get(), old('pre').map((i,e)=>old.html(e)).get(), `${file}: syntax rendering`);
 }
});
test('existing assets are unchanged', {skip: !baseline}, () => {
 for (const file of files(baseline).filter(file => /\.(png|gif|svg|ico|js)$/.test(file))) assert.deepEqual(fs.readFileSync(path.join('dist', file)), fs.readFileSync(path.join(baseline, file)), file);
});
test('all existing feeds retain their items and descriptions', {skip: !baseline}, () => {
 for (const file of ['index.xml','blog/index.xml','portfolio/index.xml']) {
  const old=load(fs.readFileSync(path.join(baseline,file)),{xml:true}),next=load(fs.readFileSync(path.join('dist',file)),{xml:true});
  for(const selector of ['channel > title','channel > link','channel > description','item > title','item > link','item > guid','item > pubDate']) assert.deepEqual(next(selector).map((i,e)=>norm(next(e).text())).get(),old(selector).map((i,e)=>norm(old(e).text())).get(),`${file}: ${selector}`);
  assert.deepEqual(next('item > description').map((i,e)=>norm(load(next(e).text().replace(/<br\s*\/?>/gi,' ')).text())).get(),old('item > description').map((i,e)=>norm(load(old(e).text().replace(/<br\s*\/?>/gi,' ')).text())).get(),`${file}: descriptions`);
 }
});
