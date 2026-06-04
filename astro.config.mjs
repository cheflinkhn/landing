import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://cheflink.io',
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => page !== 'https://cheflink.io/',
    }),
  ],
});
