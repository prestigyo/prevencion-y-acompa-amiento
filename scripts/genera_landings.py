#!/usr/bin/env python3
"""
Generador de landings — Prevención y Acompañamiento
====================================================
Lee cada JSON de data/processed/ y genera una landing HTML en dist/
siguiendo la plantilla templates/landing.html.j2 (estructura silo:
una URL por binomio sector + provincia).

Uso:
    python scripts/genera_landings.py           # genera todas
    python scripts/genera_landings.py --forzar  # incluye las no verificadas

Por seguridad, las landings cuyo JSON tenga "verificado": false
NO se generan salvo que se use --forzar (evita publicar estadísticas
de ejemplo como si fueran datos oficiales del MITES).
"""

import json
import shutil
import sys
from datetime import date
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

RAIZ = Path(__file__).resolve().parent.parent
DATOS = RAIZ / "data" / "processed"
PLANTILLAS = RAIZ / "templates"
ESTATICOS = RAIZ / "static"
SALIDA = RAIZ / "dist"


def main() -> None:
    forzar = "--forzar" in sys.argv

    env = Environment(
        loader=FileSystemLoader(PLANTILLAS),
        autoescape=select_autoescape(["html", "j2"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    plantilla = env.get_template("landing.html.j2")

    SALIDA.mkdir(exist_ok=True)
    # Copiar estáticos (css, imágenes futuras)
    shutil.copytree(ESTATICOS, SALIDA, dirs_exist_ok=True)

    generadas, omitidas = 0, 0
    publicadas = []
    for fichero in sorted(DATOS.glob("*.json")):
        datos = json.loads(fichero.read_text(encoding="utf-8"))

        if not datos.get("verificado", False) and not forzar:
            print(f"  OMITIDA  {fichero.name}  (verificado=false; usa --forzar para incluirla)")
            omitidas += 1
            continue

        datos["anio"] = date.today().year
        html = plantilla.render(**datos)

        carpeta = SALIDA / datos["slug"]
        carpeta.mkdir(parents=True, exist_ok=True)
        (carpeta / "index.html").write_text(html, encoding="utf-8")
        print(f"  GENERADA {datos['slug']}/index.html")
        publicadas.append(datos)
        generadas += 1

    # ── Página raíz: índice de todas las landings publicadas ──
    publicadas.sort(key=lambda d: (d["sector"]["nombre"], d["provincia"]["nombre"]))
    home = env.get_template("home.html.j2").render(
        landings=publicadas, anio=date.today().year
    )
    (SALIDA / "index.html").write_text(home, encoding="utf-8")
    print(f"  GENERADA index.html (home con {len(publicadas)} landings)")

    print(f"\nResumen: {generadas} generadas, {omitidas} omitidas → {SALIDA}")


if __name__ == "__main__":
    main()
