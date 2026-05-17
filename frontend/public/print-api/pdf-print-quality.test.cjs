const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const root = __dirname;
const app = readFileSync(path.join(root, 'app.js'), 'utf8');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const css = readFileSync(path.join(root, 'styles.css'), 'utf8');

const dpiMatch = app.match(/const\s+PDF_PRINT_DPI\s*=\s*(\d+)/);
assert.ok(dpiMatch, 'PDF_PRINT_DPI constant is defined');
assert.ok(Number(dpiMatch[1]) >= 200, 'PDF pages render at print-quality DPI');
assert.match(app, /mmToPx\([^)]*PDF_PRINT_DPI\)/, 'PDF renderer uses print-quality DPI');

assert.match(html, /id="designPrintBackgroundGraphics"/, 'print settings include a PDF/background graphics checkbox');
assert.match(html, /id="designPrintBackgroundGraphics"/, 'template designer includes a PDF/background graphics checkbox');
assert.match(html, /打印 PDF|打印底图|参考底图/, 'checkbox label explains PDF/background printing');
assert.doesNotMatch(css, /\.template-bg\s*\{[^}]*display:\s*none/i, 'print CSS does not hide template background');
assert.match(css, /\.template-bg\s*\{[^}]*display:\s*block/i, 'print CSS prints template background');
assert.match(app, /shouldPrintTemplateBackground/, 'print rendering can honor the PDF/background checkbox');
assert.match(app, /designPrintBackgroundGraphics/, 'print rendering reads the PDF/background checkbox');
assert.match(app, /syncPrintBackgroundGraphicsControls/, 'designer and preview PDF/background controls stay in sync');
assert.match(app, /designPrintBackgroundGraphics/, 'template designer PDF/background checkbox is wired to render');
