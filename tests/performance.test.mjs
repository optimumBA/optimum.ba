import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {load} from 'cheerio';
test('responsive variants preserve original image ownership and use cacheable built assets', () => {
 const pages=fs.readdirSync('dist',{recursive:true}).filter(file=>file.endsWith('.html')&&file!=='404.html');
 for(const file of pages){
  const $=load(fs.readFileSync('dist/'+file));
  $('img[data-original-src]').each((i,image)=>{
   const el=$(image),original=el.attr('data-original-src');
   assert.ok(fs.existsSync('static'+original),original);
   assert.ok(Number(el.attr('width'))>0 && Number(el.attr('height'))>0,`${file}: image dimensions`);
   if(original.endsWith('.gif')){assert.equal(el.attr('src'),original);return;}
   assert.match(el.attr('src'),/^\/_astro\/.+\.webp$/);
   const candidates=el.attr('srcset').split(',').map(part=>part.trim().split(/\s+/));
   assert.ok(candidates.length>0);
   for(const [url,width]of candidates){assert.ok(fs.existsSync('dist'+url),url);assert.ok(parseInt(width)<=Number(el.attr('width')),'never upscale');}
   assert.ok(el.attr('sizes'));
  });
  assert.equal($('link[href*="fonts.googleapis.com"]').length,0);
  assert.equal($('link[rel="stylesheet"][href^="/_astro/"]').length,1);
 }
 const home=load(fs.readFileSync('dist/index.html'));
 assert.equal(home('img[src="/brand/optimum-symbol-cobalt.svg"]').length,1);
 assert.equal(home('.article-row').length,3);
 for(const file of fs.readdirSync('static/fonts').filter(file=>file.endsWith('.woff2'))){assert.equal(fs.readFileSync('static/fonts/'+file).subarray(0,4).toString(),'wOF2');assert.match(file,/-[0-9a-f]{12}\.woff2$/);}
 for(const family of ['montserrat','jetbrains-mono'])assert.match(fs.readFileSync(`static/fonts/${family}-OFL.txt`,'utf8'),/SIL OPEN FONT LICENSE/);
});
