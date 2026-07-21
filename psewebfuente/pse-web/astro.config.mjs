// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio de producción. Cambiar el placeholder por el dominio real antes de publicar:
// afecta a canonical, Open Graph y sitemap.
const SITE = 'https://PENDIENTE-DOMINIO.es';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  // Salida 100% estática (cero JS por defecto; solo la isla de la calculadora se hidrata).
  output: 'static',
  integrations: [sitemap()],
  build: {
    // CSS crítico inline para mejores Core Web Vitals.
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
