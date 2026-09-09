export const GET = () => new Response(`User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

Sitemap: https://optimum.ba/sitemap.xml
`, {headers: {'Content-Type': 'text/plain; charset=utf-8'}});
