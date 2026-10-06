import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://cheflink.io',
  // / goes to the English site in `astro dev` and `astro preview`. On Netlify the
  // forced, language-aware redirects in netlify.toml take precedence.
  redirects: {
    '/': '/en/',
  },
  integrations: [
    tailwind(),
    sitemap(),
  ],
});
