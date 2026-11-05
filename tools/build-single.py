"""Build dist/index.html: the whole game (HTML + Three.js + game code) in one file."""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / 'game'
three = (root / 'lib/three.module.min.js').read_text()
game = (root / 'game.js').read_text()
html = (root / 'index.html').read_text()

# turn Three's trailing `export{a as B,...};` into a THREE namespace object
m = re.search(r'export\{([^}]*)\};?\s*$', three)
assert m, 'export block not found'
pairs = []
for item in m.group(1).split(','):
    local, _, name = item.strip().partition(' as ')
    pairs.append(f'{(name or local).strip()}:{local.strip()}')
three = 'const THREE=(()=>{' + three[:m.start()] + 'return {' + ','.join(pairs) + '};})();'
assert 'export' not in three[-2000:]

imp = "import * as THREE from './lib/three.module.min.js';"
assert imp in game
game = game.replace(imp, '')
code = three + '\n' + game
code = code.replace('</script', '<\\/script')

tag = '<script type="module" src="game.js"></script>'
assert tag in html
out = html.replace(tag, '<script type="module">\n' + code + '\n</script>')
dist = root.parent / 'dist'
dist.mkdir(exist_ok=True)
(dist / 'index.html').write_text(out)
print('wrote', dist / 'index.html', len(out) // 1024, 'KB')
