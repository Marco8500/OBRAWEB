#!/bin/bash
# Instala la voz (piper + modelo davefx). Necesita pypi y github.com.
set -e; P=$(cd "$(dirname "$0")" && pwd); M=$P/modelos; mkdir -p $M
pip install -q piper-tts
[ -d $M/vits-piper-es_ES-davefx-medium ] || curl -sSL https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-es_ES-davefx-medium.tar.bz2 | tar xj -C $M
