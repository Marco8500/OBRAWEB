#!/bin/bash
# Uso: ./voz.sh guiones/XXX.json  -> build/XXX/v{i}.wav
# Voz oficial: piper es_ES-davefx-medium (natural, sin conversión), length_scale 0.85, pausas mínimas.
set -e
P=$(cd "$(dirname "$0")" && pwd); G=$(realpath "$1"); N=$(basename "$G" .json); B=$P/build/$N
M=$P/modelos/vits-piper-es_ES-davefx-medium/es_ES-davefx-medium.onnx
[ -f $M ] || bash $P/instalar.sh
mkdir -p $B
python3 -I -c "
import json
for i, s in enumerate(json.load(open('$G'))): open('$B/t%d.txt' % i, 'w').write(s['text'])
"
for T in $B/t*.txt; do
  i=$(basename $T .txt); i=${i#t}
  piper -m $M -c $M.json --length_scale ${LENGTH:-0.85} --sentence_silence 0.08 -f $B/raw$i.wav < $T 2>/dev/null
  ffmpeg -loglevel error -y -i $B/raw$i.wav -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=4dB,loudnorm=I=-16" -ar 24000 -ac 1 $B/v$i.wav
done
