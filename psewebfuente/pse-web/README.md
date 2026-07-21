# Previsión Social Empresarial — web de captación (Astro)

Proyecto estático (Astro) con la **fase 2** del silo de captación de un consultor de
previsión social empresarial:

1. **Página pilar** — `/prevision-social-empresarial/` (hub del topic cluster).
2. **Landing hija** — `/plan-pensiones-empleo-pymes/` (PPE/PPPC) con el gancho fiscal.
3. **Calculadora de ahorro fiscal** — isla interactiva embebida en la landing (lead magnet).

Cero JS por defecto; solo la calculadora se hidrata (de forma diferida, al entrar en
viewport). Contenido en JSON (una página = un JSON). Sin webfonts externas, sin cookies,
sin analítica de terceros (RGPD limpio).

## Requisitos

- Node 22+
- npm

## Arranque

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # genera /dist (estático)
npm run preview   # sirve /dist localmente
npm test          # tests de la calculadora (node, sin dependencias)
```

## Estructura

```
src/
  data/            # contenido en JSON (una página = un JSON)
    pilar-prevision-social-empresarial.json
    ppe-pymes.json
  layouts/Base.astro         # head SEO, CSS global, cabecera/pie
  components/                # Hero, BloqueEstadistico, BloqueFiscal, Faq,
                             # LeadForm, CalculadoraPPE (isla), TarjetaCluster
  lib/
    calculadoraPPE.js        # lógica de cálculo (función pura)
    calculadoraPPE.test.mjs  # tests ejecutables con node
  pages/
    index.astro
    prevision-social-empresarial/index.astro
    plan-pensiones-empleo-pymes/index.astro
    gracias.astro            # destino del formulario (noindex)
public/            # robots.txt, favicon.svg  (falta og.png → ver más abajo)
astro.config.mjs   # site (dominio), sitemap
netlify.toml
```

## Cómo añadir una nueva página hija (solo con un JSON)

Las páginas se alimentan de JSON. Para publicar una hija hoy marcada como
«próximamente» (p. ej. *retribución flexible*):

1. Crea `src/data/mi-nueva-pagina.json` copiando la estructura de `ppe-pymes.json`
   (o de la pilar, según el tipo).
2. Crea `src/pages/mi-nueva-pagina/index.astro` importando ese JSON y los componentes
   que necesites (usa la landing PPE como plantilla).
3. En `pilar-prevision-social-empresarial.json`, busca la sección correspondiente y
   cambia su `enlace` a `{ "url": "/mi-nueva-pagina/", "publicada": true }`.
   La tarjeta dejará de mostrarse como «próximamente» y pasará a enlazar.

## Cómo rellenar los `[PENDIENTE-DATO]`

Hay marcadores `[PENDIENTE-DATO]`, `[PENDIENTE-ENLACE]`, `[PENDIENTE-TEXTO-LEGAL]` y
`[PENDIENTE-ASSET]` a la espera de contenido verificado. **No se han inventado cifras.**

- **Datos de impacto** (`ppe-pymes.json` → `impacto[]`): sustituye `dato` y rellena
  `fuente` con el organismo oficial (Seguridad Social, INVERCO, INE, DGSFP).
- **FAQ marcadas `"verificar": true`**: revísalas con la normativa vigente del ejercicio
  antes de publicarlas; ajusta el texto y pon `"verificar": false`.
- **Texto legal RGPD** (`ppe-pymes.json` → `lead.textoRGPD`): pega la cláusula real de
  protección de datos del consultor.
- **Enlaces a los silos de convenio** (`pilar…json` → `clusterConvenio.enlaces[]`):
  añade las URLs reales de la fase 1 cuando existan.
- **Dominio**: cambia `https://PENDIENTE-DOMINIO.es` en `astro.config.mjs`,
  `public/robots.txt` y (si procede) en los canonical.
- **og.png**: añade una imagen Open Graph (1200×630) en `public/og.png`.

## Fiscalidad de la calculadora

La lógica vive **solo** en `src/lib/calculadoraPPE.js` (fuente única). Las constantes
normativas (tope de aportación, límites, tipos de IS, tope de reducción de SS) están al
principio del fichero, comentadas, para revisarlas cada ejercicio. Cualquier cambio de
tramos o límites se hace ahí y queda cubierto por los tests (`npm test`).

> La calculadora ofrece una **estimación orientativa**; no es asesoramiento fiscal.

## Formularios

Por defecto usa **Netlify Forms**: el `<form>` lleva `data-netlify="true"`, un honeypot
(`netlify-honeypot="bot-field"`) y un campo oculto `simulacion` que la calculadora
rellena con los parámetros usados (el lead llega con contexto). El destino tras enviar es
`/gracias/`.

### Fallback sin Netlify: Google Apps Script

Si no se despliega en Netlify, se puede enviar el formulario a un Google Apps Script
enlazado a una hoja de cálculo. Pasos:

1. Crea una Google Sheet. Extensiones → Apps Script y pega:

   ```javascript
   // Code.gs
   function doPost(e) {
     const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads')
                  || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Leads');
     const p = e.parameter;
     hoja.appendRow([
       new Date(), p.nombre || '', p.email || '', p.telefono || '',
       p.empleados || '', p.sector || '', p.simulacion || ''
     ]);
     return ContentService.createTextOutput(JSON.stringify({ ok: true }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

2. Implementar → Nueva implementación → «Aplicación web», acceso «Cualquiera». Copia la URL.
3. En `src/components/LeadForm.astro`, sustituye los atributos de Netlify por
   `method="POST" action="URL_DEL_APPS_SCRIPT"` (o intercepta el `submit` con `fetch`
   para no abandonar la página) y elimina `data-netlify`/honeypot.

## Despliegue en Netlify (paso a paso)

1. Sube este directorio a un repositorio de GitHub.
2. En Netlify: **Add new site → Import an existing project** y elige el repo.
3. Netlify detecta `netlify.toml` (build `npm run build`, publish `dist`). Deja los valores.
4. **Deploy site**. Con el primer deploy, Netlify activa la detección de formularios.
5. Configura el dominio propio y actualiza `site` en `astro.config.mjs` (afecta a
   canonical, Open Graph y sitemap). Vuelve a desplegar.
6. Revisa los formularios recibidos en **Forms** del panel de Netlify.

### Alternativa: GitHub Pages

`npm run build` genera `/dist`. Publícalo con GitHub Actions o en una rama `gh-pages`.
Ojo: Netlify Forms no funciona en GitHub Pages → usa el fallback de Apps Script.

## SEO

- `astro build` genera `sitemap-index.xml` (integración `@astrojs/sitemap`).
- Datos estructurados JSON-LD por página: `Article` + `BreadcrumbList` (pilar);
  `Service` + `FAQPage` + `BreadcrumbList` (landing). El `FAQPage` se genera
  automáticamente desde el array `faqs` del JSON.
- Un solo `<h1>` por página; jerarquía semántica; `system font stack`.
- Hueco comentado para Plausible/GA4 en `Base.astro` si se decide añadir analítica.
