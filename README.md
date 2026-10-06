# optimum.ba

[optimum.ba](https://optimum.ba/) is the website for [Optimum](https://optimum.ba/), a software development agency.

Built with Astro and Tailwind CSS. Public pages and generated Markdown share the authored source.

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
