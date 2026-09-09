import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {load} from 'cheerio';
test('sitemap contains exactly the canonical HTML routes, excluding errors and feeds', () => {
 const sitemap=load(fs.readFileSync('dist/sitemap.xml'),{xml:true});
 const urls=sitemap('url > loc').map((i,e)=>sitemap(e).text()).get();
 const pages=fs.readdirSync('dist',{recursive:true}).filter(f=>f.endsWith('.html')&&f!=='404.html');
 const expected=pages.map(file=>`https://optimum.ba/${file.replace(/index\.html$/,'')}`).sort();
 assert.deepEqual([...urls].sort(),expected);
 assert.equal(new Set(urls).size,urls.length);
 for(const file of pages){const $=load(fs.readFileSync('dist/'+file));assert.equal($('link[rel=canonical]').length,1);assert.equal($('link[rel=canonical]').attr('href'),`https://optimum.ba/${file.replace(/index\.html$/,'')}`);}
 assert.match(fs.readFileSync('dist/robots.txt','utf8'), /Sitemap: https:\/\/optimum.ba\/sitemap.xml/);
 assert.match(fs.readFileSync('dist/robots.txt','utf8'), /User-agent: OAI-SearchBot\nAllow: \//);
 const $=load(fs.readFileSync('dist/index.html'));
 assert.deepEqual(JSON.parse($('script[type="application/ld+json"]').text()),{'@context':'https://schema.org','@type':'WebSite',name:'Optimum Tech',url:'https://optimum.ba/'});
 const headers=fs.readFileSync('dist/_headers','utf8');
 assert.match(headers,/https:\/\/:project.pages.dev\/\*\n  X-Robots-Tag: noindex/);
 assert.match(headers,/https:\/\/:version.:project.pages.dev\/\*\n  X-Robots-Tag: noindex/);
});
test('sharing metadata and article descriptions describe canonical pages', () => {
 const pages=fs.readdirSync('dist',{recursive:true}).filter(f=>f.endsWith('.html')&&f!=='404.html');
 for(const file of pages){
  const $=load(fs.readFileSync('dist/'+file));
  const image=$('meta[property="og:image"]').attr('content');
  assert.ok(image.startsWith('https://optimum.ba/'));
  assert.ok(fs.existsSync('dist'+new URL(image).pathname));
  assert.equal($('meta[name="twitter:image"]').attr('content'),image);
  assert.equal($('meta[name="twitter:card"]').attr('content'),'summary_large_image');
  assert.equal($('meta[property="og:url"]').attr('content'),$('link[rel=canonical]').attr('href'));
  if($('.blog-post-body').length){
   const description=$('meta[name=description]').attr('content');
   const prose=$('.blog-post-body p, .blog-post-body div').filter((i,p)=>!$(p).find('p, div, h1, h2, h3, pre, ul, ol').length).map((i,p)=>$(p).text()).get().join(' ').replace(/\s+/g,' ').trim();
   assert.ok(description.length>0 && description.length<=160);
   assert.ok(prose.startsWith(description.replace(/…$/,'')));
   assert.equal($('meta[property="og:type"]').attr('content'),'article');
  }else assert.equal(image,'https://optimum.ba/brand/optimum-social-preview.png');
 }
 assert.equal(load(fs.readFileSync('dist/sitemap.xml'),{xml:true})('lastmod').length,0,'omit dates without a maintained modification source');
});
