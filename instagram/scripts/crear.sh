#!/bin/bash
# Uso: ./crear.sh guiones/XXX.json  -> videos/XXX.mp4
set -e; P=$(cd "$(dirname "$0")" && pwd)
bash $P/voz.sh "$1" && python3 -I $P/reel.py "$1"
T="${1%.json}.txt"; [ -f "$T" ] && cp "$T" $P/videos/
