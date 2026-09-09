import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {load} from 'cheerio';
const baseline='871478f6bd3ae5bca6729b2cbc1f77be60d2eb9c';
test('all original blog source files and article URLs are preserved',()=>{
 const files=execFileSync('git',['ls-tree','-r','--name-only',baseline,'content/blog'],{encoding:'utf8'}).trim().split('\n').filter(f=>f.endsWith('.md'));
 assert.equal(files.length,15);
 for(const file of files){
  assert.equal(fs.readFileSync(file,'utf8'),execFileSync('git',['show',`${baseline}:${file}`],{encoding:'utf8'}),file);
  const slug=file.split('/').at(-1).replace(/\.md$/,'');
  const $=load(fs.readFileSync(`dist/blog/${slug}/index.html`));
  assert.equal($('link[rel=canonical]').attr('href'),`https://optimum.ba/blog/${slug}/`);
  assert.ok($('.blog-post-body').text().trim().length>0);
  for(const el of $('.toc-list a').toArray())assert.ok($('[id]').toArray().some(n=>$(n).attr('id')===$(el).attr('href').slice(1)),`${slug} TOC ${$(el).attr('href')}`);
 }
});
