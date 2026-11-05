"""Genera app-movil/todo-en-uno.html: la app completa en UN solo archivo
(fuentes e icono incrustados) para pegarla directamente en Hugging Face."""
import base64, json, pathlib, re

base = pathlib.Path(__file__).resolve().parent.parent / 'app-movil'
b64 = lambda p: base64.b64encode((base / p).read_bytes()).decode()
html = (base / 'index.html').read_text(encoding='utf-8')

icon = 'data:image/png;base64,' + b64('icons/apple-touch-icon.png')
html = html.replace("url(fonts/Inter-Regular.otf)", "url(data:font/woff2;base64," + b64('fonts/inter-Regular.woff2') + ")")
html = html.replace("url(fonts/Inter-Light.otf)", "url(data:font/woff2;base64," + b64('fonts/inter-Light.woff2') + ")")
html = re.sub(r'<link rel="manifest"[^>]*>\n', '', html)
html = re.sub(r'<link rel="icon"[^>]*>\n', '', html)
html = html.replace('<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
                    f'<link rel="apple-touch-icon" href="{icon}">')
html = html.replace('<img src="icons/icon-192.png" alt="">', '<img id="logo" alt="">')
manifest = {
    "name": "OBRAWEB · Videos de relojes", "short_name": "OBRAWEB", "display": "standalone",
    "orientation": "portrait", "background_color": "#0d0d0f", "theme_color": "#0d0d0f", "lang": "es",
}
html = html.replace(
    "if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});",
    "// Manifest creado al vuelo (todo en un solo archivo) para poder instalar la app con su icono.\n"
    "(() => {\n"
    f"  const m = {json.dumps(manifest, ensure_ascii=False)};\n"
    "  m.start_url = location.href.split('#')[0];\n"
    "  m.scope = location.origin + '/';\n"
    "  m.icons = [{ src: document.querySelector('link[rel=apple-touch-icon]').href, sizes: '180x180', type: 'image/png', purpose: 'any' }];\n"
    "  const icon = document.querySelector('link[rel=apple-touch-icon]').href;\n"
    "  document.getElementById('logo').src = icon;\n"
    "  const fav = document.createElement('link');\n"
    "  fav.rel = 'icon'; fav.href = icon;\n"
    "  document.head.appendChild(fav);\n"
    "  const link = document.createElement('link');\n"
    "  link.rel = 'manifest';\n"
    "  link.href = 'data:application/manifest+json,' + encodeURIComponent(JSON.stringify(m));\n"
    "  document.head.appendChild(link);\n"
    "})();")
assert 'fonts/' not in html and 'icons/' not in html and 'sw.js' not in html, 'quedó una referencia externa'
(base / 'todo-en-uno.html').write_text(html, encoding='utf-8')
print('OK', len(html) // 1024, 'KB')
