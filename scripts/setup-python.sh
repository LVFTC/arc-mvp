#!/usr/bin/env bash
# Instala dependências Python do pdf_service antes de subir o Node em produção.
# Usa /usr/bin/python3 -m pip com --user para instalar em ~/.local/lib/python3.x/site-packages,
# que é acessível pelo spawn com cleanEnv (HOME preservado).
# O flag --no-warn-script-location suprime warnings de PATH (irrelevantes pois usamos -m uvicorn).
set -e

REQUIREMENTS="$(cd "$(dirname "$0")/.." && pwd)/pdf_service/requirements.txt"

if [ ! -f "$REQUIREMENTS" ]; then
  echo "[setup-python] requirements.txt não encontrado — pulando instalação Python"
  exit 0
fi

echo "[setup-python] Instalando dependências Python do pdf_service..."
/usr/bin/python3 -m pip install \
  --quiet \
  --user \
  --no-warn-script-location \
  -r "$REQUIREMENTS" 2>&1
echo "[setup-python] Dependências Python instaladas ✓"
