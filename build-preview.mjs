/**
 * build-preview.mjs
 *
 * Flattens the whole site into ONE standalone .html file that runs from a
 * double-click, with no server and no network.
 *
 *  - every ES module is wrapped in a tiny registry so module scoping survives
 *  - every stylesheet is inlined
 *  - every image is re-encoded small and inlined as a data URI
 *  - localStorage / history are shimmed so it works inside a sandboxed frame
 *
 * The real project in src/ is untouched. This is a preview artefact.
 *
 *   node build-preview.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve('.');
const LIGHT = process.argv.includes('--light') || process.argv.includes('--tiny');
const TINY = process.argv.includes('--tiny');
const OUT = process.argv.find((a) => a.endsWith('.html'))
  || (TINY ? 'dist/zeng-cafe-tiny.html' : LIGHT ? 'dist/zeng-cafe-share.html' : 'dist/zeng-cafe-preview.html');

/* ------------------------------------------------------------------ *
 * 1. Collect modules
 * ------------------------------------------------------------------ */

const modules = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) modules.push(path.relative(ROOT, full).replace(/\\/g, '/'));
  }
})('src');

/* ------------------------------------------------------------------ *
 * 2. Rewrite ESM syntax into the registry form
 * ------------------------------------------------------------------ */

const resolveId = (fromFile, spec) =>
  path.normalize(path.join(path.dirname(fromFile), spec)).replace(/\\/g, '/');

function transform(file) {
  let src = fs.readFileSync(file, 'utf8');
  const exported = new Set();

  // import { a, b as c } from './x.js'
  src = src.replace(/^import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?\s*$/gm, (_, names, spec) => {
    const list = names.split(',').map((n) => {
      const [orig, alias] = n.trim().split(/\s+as\s+/);
      return alias ? `${orig.trim()}: ${alias.trim()}` : orig.trim();
    }).filter(Boolean).join(', ');
    return `const { ${list} } = __req(${JSON.stringify(resolveId(file, spec))});`;
  });

  // import * as ns from './x.js'
  src = src.replace(/^import\s*\*\s*as\s+(\w+)\s*from\s*['"]([^'"]+)['"];?\s*$/gm,
    (_, ns, spec) => `const ${ns} = __req(${JSON.stringify(resolveId(file, spec))});`);

  // bare side-effect import
  src = src.replace(/^import\s+['"]([^'"]+)['"];?\s*$/gm,
    (_, spec) => `__req(${JSON.stringify(resolveId(file, spec))});`);

  // dynamic import of a local module
  src = src.replace(/\bimport\(\s*['"](\.[^'"]+)['"]\s*\)/g,
    (_, spec) => `Promise.resolve(__req(${JSON.stringify(resolveId(file, spec))}))`);

  // export function / class / const / let
  src = src.replace(/^export\s+(async\s+function|function|class|const|let|var)\s+([A-Za-z0-9_$]+)/gm,
    (_, kind, name) => { exported.add(name); return `${kind} ${name}`; });

  // export { a, b as c }
  src = src.replace(/^export\s*\{([^}]*)\};?\s*$/gm, (_, names) => {
    names.split(',').map((n) => n.trim()).filter(Boolean).forEach((n) => {
      const [orig, alias] = n.split(/\s+as\s+/);
      exported.add(`${(alias || orig).trim()}: ${orig.trim()}`);
    });
    return '';
  });

  // Sandboxed frames throw on window.location / history writes.
  src = src.replace(/\bwindow\.location\b/g, '__zloc')
           .replace(/\bwindow\.history\b/g, '__zhist')
           .replace(/\bwindow\.open\b/g, '__zopen');

  const leftovers = src.match(/^\s*(import|export)\s/gm);
  if (leftovers) throw new Error(`Unhandled module syntax in ${file}: ${leftovers.join(', ')}`);

  const registrations = [...exported]
    .map((e) => (e.includes(':') ? e : `${e}: ${e}`))
    .join(', ');

  return `__def(${JSON.stringify(file)}, function (__exports, __req) {\n${src}\nObject.assign(__exports, { ${registrations} });\n});`;
}

let bundle = modules.map(transform).join('\n\n');

if (LIGHT) {
  const { minify } = await import('terser');
  const before = bundle.length;
  const result = await minify(bundle, {
    compress: { passes: 2 },
    mangle: true,
    format: { comments: false }
  });
  if (result.error) throw result.error;
  bundle = result.code;
  console.log(`js minified    : ${(before / 1024).toFixed(0)} KB -> ${(bundle.length / 1024).toFixed(0)} KB`);
}

/* ------------------------------------------------------------------ *
 * 3. Images, re-encoded small and inlined
 * ------------------------------------------------------------------ */

// Two budgets. The full build looks better; the light build is small enough
// to publish as a shareable artefact, where a hard size ceiling applies.
const GALLERY = [
  'tree-lounge.jpg', 'exterior-night.jpg', 'arch-cabins.jpg', 'mural-neon.jpg',
  'rooftop.jpg', 'bar-counter.jpg', 'water-wall.jpg', 'hookah-art.jpg',
  'tram-wall.jpg', 'corridor.jpg', 'lounge-wide.jpg', 'window-lounge.jpg',
  'bar-gold.jpg', 'mural-green.jpg', 'washroom-neon.jpg', 'facade-street.jpg'
];
const IMAGE_PLAN = TINY
  ? [['hero-main.jpg', 620, 48], ['hero-mobile.jpg', 380, 46],
     ...GALLERY.map((n) => [n, 200, 42])]
  : LIGHT
  ? [['hero-main.jpg', 760, 52], ['hero-mobile.jpg', 420, 50],
     ...GALLERY.map((n) => [n, 280, 48])]
  : [['hero-main.jpg', 1280, 70], ['hero-mobile.jpg', 780, 68],
     ...GALLERY.map((n) => [n, 620, 66])];


fs.mkdirSync('.preview-tmp', { recursive: true });
const script = `
import sys, json, base64, io
from PIL import Image
plan = json.loads(sys.argv[1])
out = {}
for name, edge, q in plan:
    im = Image.open('assets/img/' + name).convert('RGB')
    if im.width > edge:
        im = im.resize((edge, round(im.height * edge / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=q, optimize=True, progressive=True)
    out[name] = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
logo = open('assets/img/logo.png','rb').read()
out['logo.png'] = 'data:image/png;base64,' + base64.b64encode(logo).decode()
json.dump(out, open('.preview-tmp/images.json','w'))
print(sum(len(v) for v in out.values()))
`;
fs.writeFileSync('.preview-tmp/enc.py', script);
const encodedBytes = execFileSync('python3', ['.preview-tmp/enc.py', JSON.stringify(IMAGE_PLAN)], { cwd: ROOT }).toString().trim();
const images = JSON.parse(fs.readFileSync('.preview-tmp/images.json', 'utf8'));

/* ------------------------------------------------------------------ *
 * 4. Styles
 * ------------------------------------------------------------------ */

let css = ['tokens', 'base', 'components', 'pages', 'admin']
  .map((n) => fs.readFileSync(`src/styles/${n}.css`, 'utf8'))
  .join('\n');

if (LIGHT) {
  css = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/* ------------------------------------------------------------------ *
 * 5. Assemble
 * ------------------------------------------------------------------ */

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#050505">
<title>Zen G Café Kolkata | Chill. Connect. Create.</title>
<meta name="description" content="Zen G Café Kolkata — food, friends, conversations, music and unforgettable experiences.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,400..900&family=Instrument+Sans:wght@400;500;600&family=Caveat:wght@500;700&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
<body>
<a class="skip-link" href="#app">Skip to content</a>
<main id="app" aria-live="polite">
  <div class="state" style="padding-top:30vh">
    <div class="spinner"></div>
    <p class="faint" style="margin-top:16px;letter-spacing:.2em;text-transform:uppercase;font-size:.72rem">Zen G</p>
  </div>
</main>

<script>
/* ================= preview shims ================= *
 * Only present in this single-file build. The real project needs none of it.
 * ================================================= */
(function () {
  'use strict';

  // Sandboxed frames can throw on storage access entirely, not just on write.
  function memoryStore() {
    var map = Object.create(null);
    return {
      getItem: function (k) { return k in map ? map[k] : null; },
      setItem: function (k, v) { map[k] = String(v); },
      removeItem: function (k) { delete map[k]; },
      clear: function () { map = Object.create(null); },
      key: function (i) { return Object.keys(map)[i] || null; },
      get length() { return Object.keys(map).length; }
    };
  }
  ['localStorage', 'sessionStorage'].forEach(function (name) {
    var ok = false;
    try { window[name].setItem('__t', '1'); window[name].removeItem('__t'); ok = true; } catch (e) { ok = false; }
    if (!ok) {
      try { Object.defineProperty(window, name, { value: memoryStore(), configurable: true }); }
      catch (e) { window[name] = memoryStore(); }
    }
  });

  // A virtual URL, because history.pushState is blocked without a real origin.
  var virtual = { pathname: '/', search: '', hash: '' };
  function parse(url) {
    var s = String(url);
    var hash = '', search = '';
    var h = s.indexOf('#'); if (h >= 0) { hash = s.slice(h); s = s.slice(0, h); }
    var q = s.indexOf('?'); if (q >= 0) { search = s.slice(q); s = s.slice(0, q); }
    return { pathname: s || '/', search: search, hash: hash };
  }
  window.__zloc = {
    get pathname() { return virtual.pathname; },
    get search() { return virtual.search; },
    get hash() { return virtual.hash; },
    get origin() { return 'https://zeng-cafe.example'; },
    get href() { return 'https://zeng-cafe.example' + virtual.pathname + virtual.search; },
    set href(v) { if (/^https?:/i.test(v)) window.__zopen(v, '_blank'); else Object.assign(virtual, parse(v)); },
    reload: function () { Object.assign(virtual, { pathname: '/', search: '', hash: '' }); location.reload(); },
    assign: function (v) { this.href = v; },
    replace: function (v) { this.href = v; }
  };
  window.__zhist = {
    pushState: function (s, t, url) { Object.assign(virtual, parse(url)); },
    replaceState: function (s, t, url) { Object.assign(virtual, parse(url)); },
    back: function () {}, forward: function () {}, go: function () {}
  };
  window.__zopen = function (url, target, features) {
    try { return window.open(url, target || '_blank', features); } catch (e) { return null; }
  };

  // Inlined imagery, swapped in wherever a bundled path shows up.
  var IMG = ${JSON.stringify(images)};
  function swap(node) {
    if (!node || node.nodeType !== 1) return;
    var list = node.matches && node.matches('img,source') ? [node] : [];
    if (node.querySelectorAll) list = list.concat(Array.prototype.slice.call(node.querySelectorAll('img,source')));
    list.forEach(function (el) {
      var attr = el.tagName === 'SOURCE' ? 'srcset' : 'src';
      var value = el.getAttribute(attr);
      if (!value || value.indexOf('data:') === 0) return;
      var file = (value.match(/([\\w-]+\\.(?:jpg|png|webp))(?:$|\\?)/) || [])[1];
      if (!file) return;
      var hit = IMG[file] || IMG[file.replace(/\\.webp$/, '.jpg')];
      if (hit) el.setAttribute(attr, hit);
      else if (el.tagName === 'SOURCE') el.remove();
    });
  }
  new MutationObserver(function (records) {
    records.forEach(function (record) {
      Array.prototype.forEach.call(record.addedNodes, swap);
      if (record.type === 'attributes') swap(record.target);
    });
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] });
  window.addEventListener('DOMContentLoaded', function () { swap(document.body); });

  window.__ZENG_BASE__ = '';
})();

/* ================= module registry ================= */
(function () {
  'use strict';
  var defs = {}, cache = {};
  function __def(id, factory) { defs[id] = factory; }
  function __req(id) {
    if (cache[id]) return cache[id];
    var factory = defs[id];
    if (!factory) throw new Error('Module not bundled: ' + id);
    var exports = cache[id] = {};
    factory(exports, __req);
    return exports;
  }

${bundle}

  __req('src/app.js');
})();
</script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
fs.rmSync('.preview-tmp', { recursive: true, force: true });

console.log(`modules bundled : ${modules.length}`);
console.log(`images inlined  : ${Object.keys(images).length} (${(Number(encodedBytes) / 1024 / 1024).toFixed(2)} MB base64)`);
console.log(`css inlined     : ${(css.length / 1024).toFixed(0)} KB`);
console.log(`output          : ${OUT}  ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB`);
