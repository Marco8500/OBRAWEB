#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null; then
  echo "Falta instalar Node.js. Descárgalo de https://nodejs.org (botón LTS), instálalo y vuelve a abrir este archivo."
  read -p "Presiona Enter para cerrar"; exit 1
fi
[ -d node_modules ] || { echo "Instalando por primera vez, espera un momento..."; npm install; }
(sleep 2; open http://localhost:3000) &
node server.js
