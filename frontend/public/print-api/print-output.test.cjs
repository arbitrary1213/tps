const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const printApiRoot = __dirname;
const app = readFileSync(path.join(printApiRoot, 'app.js'), 'utf8');
const css = readFileSync(path.join(printApiRoot, 'styles.css'), 'utf8');
const ipc = readFileSync(path.join(printApiRoot, '..', '..', '..', 'desktop-app', 'src', 'main', 'ipc.js'), 'utf8');

const printMediaMatch = css.match(/@media\s+print\s*\{[\s\S]*?\n\}/);
assert.ok(printMediaMatch, 'print stylesheet has an @media print block');
const printMedia = printMediaMatch[0];

assert.match(printMedia, /\.print-settings-panel\b/, 'browser printing hides the right-side print settings panel');
assert.match(printMedia, /\.print-settings-actions\b/, 'browser printing hides the print action buttons');
assert.match(printMedia, /\.print-more-settings\b/, 'browser printing hides expanded print settings');
assert.match(printMedia, /display:\s*none\s*!important/i, 'hidden print controls use a print-enforced display rule');

assert.match(app, /buildDesktopPrintHtml\(\$\("preview"\)\.innerHTML\)/, 'desktop printing sends rendered preview HTML');
assert.match(app, /<body>\$\{previewHtml\}<\/body>/, 'desktop print document contains the preview body only');

assert.match(ipc, /waitForPrintWindowReady/, 'desktop printing waits for print content readiness');
assert.match(ipc, /document\.fonts\.ready/, 'desktop printing waits for fonts before invoking the OS printer');
assert.match(ipc, /document\.images/, 'desktop printing waits for image backgrounds before invoking the OS printer');
assert.match(ipc, /\.decode\(\)/, 'desktop printing uses image decoding when available');
assert.match(ipc, /await\s+waitForPrintWindowReady\(printWindow\.webContents\)/, 'desktop printing waits after loading the temporary print document');
