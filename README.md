# Prevención y Acompañamiento

Infraestructura digital del proyecto: landings SEO de estructura silo
(sector + provincia) para captación B2B de seguros de vida colectivos
de convenio, alimentadas con estadística oficial (MITES / INSST).

## Stack

- **Generador:** Python + Jinja2 (HTML estático puro)
- **Hosting:** Netlify (deploy automático desde este repo)
- **Formularios:** Netlify Forms (sin backend)
- **Datos:** pipeline Python sobre fuentes públicas MITES / INSST

## Estructura

```
data/raw/         Descargas originales MITES/INSST (evidencia)
data/processed/   Un JSON por landing (sector + provincia)
scripts/          descarga_mites.py · genera_landings.py
templates/        landing.html.j2 (6 secciones)
static/css/       estilo.css (identidad "señal industrial")
dist/             Salida generada (lo que publica Netlify)
docs/             Guía estratégica del proyecto
```

## Uso

```bash
pip install jinja2
python scripts/genera_landings.py            # genera landings verificadas
python scripts/genera_landings.py --forzar   # incluye borradores
```

## Regla de oro

Ningún JSON pasa a `"verificado": true` hasta que sus tres cifras
estadísticas estén contrastadas con el fichero oficial guardado en
`data/raw/`. El generador omite por defecto las no verificadas.
