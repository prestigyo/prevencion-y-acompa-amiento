#!/usr/bin/env python3
"""
Descarga del Avance de la Estadística de Accidentes de Trabajo (MITES)
=======================================================================
ESQUELETO — ejecutar en tu máquina local (requiere acceso a mites.gob.es).

El avance mensual se publica en:
  https://www.mites.gob.es/estadisticas/eat/welcome.htm
en ficheros Excel con series por provincia, sector y gravedad.

Flujo previsto:
  1. Descargar el Excel del último avance disponible a data/raw/
  2. (procesa_datos.py, pendiente) Extraer las tablas por provincia
     y CNAE y volcar los datos a data/processed/*.json con
     "verificado": true y la referencia exacta de la fuente.

IMPORTANTE: cada cifra publicada en una landing debe poder trazarse
a la tabla y periodo exactos del fichero oficial. Guardar siempre el
Excel original en data/raw/ como evidencia.

Dependencias locales:
    pip install requests openpyxl pandas
"""

import sys
from pathlib import Path

RAW = Path(__file__).resolve().parent.parent / "data" / "raw"

# TODO (siguiente sesión): localizar la URL estable del último avance,
# descargarlo con requests y validar su estructura con pandas.
# Las URLs de MITES cambian con cada publicación mensual, así que
# probablemente haya que parsear la página índice para encontrar
# el enlace más reciente.

if __name__ == "__main__":
    print("Esqueleto pendiente de implementar. Ver docstring.")
    sys.exit(0)
