# optimum.ba

[optimum.ba](https://optimum.ba/) is the website for Optimum Tech, a software development and product consulting company. Clients work with Almir Sarajčić; the site also presents the company's products, tools and historical Optimum BH writing.

Built with Astro and Tailwind CSS. Public pages and generated Markdown share the authored source.

The homepage lives in `src/pages/index.astro`; company information is in `src/pages/about.astro` and `src/pages/contact.astro`. `agent-site.json` supplies agent-facing summaries, while the production build generates page Markdown from rendered HTML. `src/styles/brand.css` owns the existing visual system. `static/` contains deployment assets; `public/` is retained historical output, not the active Astro public directory.

## Development

Install dependencies:

```bash
npm install
```

Build the site:

```bash
npm run build
```

Watch for changes and serve locally:

```bash
npm run serve
```

The production build uses Python 3 to generate Markdown page representations from rendered HTML. Cloudflare Pages negotiates those representations for GET and HEAD requests that prefer `text/markdown`.
