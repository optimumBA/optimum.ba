import {defineConfig} from 'astro/config';
export default defineConfig({site: 'https://optimum.ba', output: 'static', publicDir: './static', trailingSlash: 'always', compressHTML: false, devToolbar: {enabled: false}});
