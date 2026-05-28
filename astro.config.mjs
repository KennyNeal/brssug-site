import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kennyneal.github.io',
  base: '/brssug-site',
  trailingSlash: 'always',
  integrations: [sitemap()]
});