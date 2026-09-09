import fs from 'node:fs';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import {load} from 'cheerio';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
export const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const markdown = new MarkdownIt({html: true, typographer: true, linkify: true});
markdown.linkify.set({fuzzyEmail: false, fuzzyLink: false});
markdown.renderer.rules.fence = (tokens, index) => {
 const token = tokens[index], language = token.info.trim().split(/\s+/)[0];
 // Hugo leaves unknown HEEx and unlabelled fences unhighlighted.
 if (!language || language === 'heex') return `<pre tabindex="0"><code${language ? ` class="language-${escape(language)}" data-lang="${escape(language)}"` : ''}>${escape(token.content)}</code></pre>\n`;
 const html = execFileSync(path.resolve('node_modules/.cache/chroma/chroma'), ['--html', '--html-only', '--html-inline-styles', '--html-tab-width=4', '--style=monokai', `--lexer=${language}`], {input: token.content, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024});
 return `<div class="highlight">${html.replace('<pre ', '<pre tabindex="0" ').replace('<code>', `<code class="language-${escape(language)}" data-lang="${escape(language)}">`)}</div>\n`;
};
markdown.core.ruler.after('replacements', 'goldmark-dashes', state => {for(const token of state.tokens)for(const child of token.children || [])if(child.type === 'text')child.content=child.content.replace(/(?<!-)--(?!-)/g,'–');});
markdown.renderer.rules.heading_open = (tokens,index,options,env,self) => {
 const base = tokens[index+1].content.toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu,'').replace(/\s/g,'-');
 env.ids ||= new Set();let id=base,n=1;while(env.ids.has(id))id=`${base}-${n++}`;env.ids.add(id);tokens[index].attrSet('id',id);return self.renderToken(tokens,index,options);
};
function toc(html) {
 const $=load(html),root={children:[]},stack=[root];
 for(const el of $('h1,h2,h3').toArray().filter(el=>$(el).attr('id'))){
  const level=Number(el.tagName.slice(1));
  while(stack.length>level)stack.pop();
  while(stack.length<level){const parent=stack.at(-1);let node=parent.children.at(-1);if(!node){node={children:[]};parent.children.push(node);}stack.push(node);}
  stack.at(-1).children.push({id:$(el).attr('id'),title:$(el).html(),children:[]});
 }
 const render=nodes=>nodes.map(n=>`<li>${n.id?`<a href="#${n.id}">${n.title}</a>`:''}${n.children.length?`\n<ul>\n${render(n.children)}</ul>\n`:''}</li>\n`).join('');
 return '\n'+render(root.children);
}
function summary(html){let count=0,parts=[];for(const part of html.split(/(?<=<\/p>)/)){parts.push(part);count+=load(part).text().trim().split(/\s+/).filter(Boolean).length;if(count>=70)break;}return parts.join('');}
export const posts=fs.readdirSync('content/blog').filter(n=>n.endsWith('.md')).map(name=>{
 const {data,content}=matter(fs.readFileSync(`content/blog/${name}`,'utf8'));
 const slug=data.slug||name.slice(0,-3),html=markdown.render(content,{}),date=new Date(data.date),day=date.getUTCDate();
 const month=date.toLocaleString('en-US',{month:'long',timeZone:'UTC'}),suffix=[1,21,31].includes(day)?'st':[2,22].includes(day)?'nd':[3,23].includes(day)?'rd':'th';
 const summaryHTML=summary(html);
 return {...data,date,slug,explicitSlug:data.slug||'',url:`https://optimum.ba/blog/${slug}/`,html,toc:toc(html),summaryHTML,summary:load(summaryHTML.replace(/<br\s*\/?>/gi,' ')).text().replace(/\n/g,' ').trim(),cardDate:`${month} ${day}${suffix}, ${date.getUTCFullYear()}`,articleDate:`${month} ${day}nd, ${date.getUTCFullYear()}`};
}).filter(p=>!p.draft).sort((a,b)=>b.date-a.date||a.title.localeCompare(b.title));
export const routes=['/','/portfolio/',...posts.map(p=>`/blog/${p.slug}/`)];

export const homePage = matter(fs.readFileSync('content/_index.md', 'utf8')).data;
export const portfolioPage = matter(fs.readFileSync('content/portfolio/_index.md', 'utf8')).data;
