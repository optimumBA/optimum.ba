import {posts, escape, homePage, portfolioPage} from './content.js';
export function feed(section = '') {
 const title = section === 'portfolio' ? portfolioPage.title : section === 'blog' ? 'Blogs' : homePage.title;
 const url = `https://optimum.ba/${section ? `${section}/` : ''}`;
 const items = section === 'portfolio' ? [] : posts;
 return `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${escape(title)} on Optimum</title><link>${url}</link>
<description>Recent content in ${escape(title)} on Optimum</description>
<generator>Astro</generator><language>en-us</language>
${items.length ? `<lastBuildDate>${items[0].date.toUTCString().replace('GMT','+0000')}</lastBuildDate>` : ''}
<atom:link href="${url}index.xml" rel="self" type="application/rss+xml" />
${items.map(post => `<item><title>${escape(post.title)}</title><link>${post.url}</link><pubDate>${post.date.toUTCString().replace('GMT','+0000')}</pubDate><guid>${post.url}</guid><description>${escape(post.summaryHTML)}</description></item>`).join('\n')}
</channel></rss>`;
}
