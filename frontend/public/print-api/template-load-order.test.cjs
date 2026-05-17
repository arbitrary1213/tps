const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const print = readFileSync(path.join(__dirname, 'print.js'), 'utf8');
const initMatch = print.match(/async function init\(\) \{([\s\S]*?)\n\}/);

assert.ok(initMatch, 'init function exists');
const initBody = initMatch[1];

const loadIndex = initBody.indexOf('await loadServerTemplates();');
const applyIndex = initBody.indexOf('applyTemplate();');
const emptyRenderIndex = initBody.indexOf('} else {\n    render();\n  }');
const launchIndex = initBody.indexOf('applyLaunchParams();');

assert.ok(loadIndex >= 0, 'init awaits server templates');
assert.ok(applyIndex >= 0, 'init applies a template after startup');
assert.ok(launchIndex >= 0, 'init applies launch params after startup');
assert.ok(loadIndex < applyIndex, 'server templates load before first template application');
assert.ok(emptyRenderIndex < 0 || loadIndex < emptyRenderIndex, 'empty render path does not run before server templates load');
assert.ok(loadIndex < launchIndex, 'launch params apply after server templates load');
