// Static analysis of print module - checks logic consistency without browser
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BASE = 'I:/temple-os/frontend/public/print-api';
let errors = [];

function read(file) {
  return readFileSync(join(BASE, file), 'utf-8');
}
function check(condition, msg) {
  if (!condition) errors.push(msg);
  else console.log('  OK:', msg);
}

console.log('=== Print Module Static Analysis ===\n');

// ── 1. Check template consistency ──
console.log('1. Template data consistency');
const configContent = read('shared-config.js');

// Verify that for each template in the templates array, TEMPLATE_CATALOG has matching mode/dataGroup
const tplPairs = [
  ['cmp6uyyk10003bjnjsqkn2uwn', '延生通名', 'summary', 'blessing'],
  ['cmowl79v5000a2rdgs4czs9bo', '往生通名', 'summary', 'deliverance'],
  ['cmoz9dtgc015wcyyxjcwqcumq', '红牒', 'single', 'blessing'],
  ['cmp6vaj3l000gbjnjoak9q9wx', '延生禄位', 'single', 'blessing'],
  ['92171e1d-e697-46df-bfcc-4cb8f9a29661', '红壳', 'single', 'blessing'],
  ['cmp15pgnz000op0s9vkqcx9wt', '黄壳', 'single', 'deliverance'],
  ['cmozm19an001ahmbwqm8nmi1q', '超度牌位', 'single', 'deliverance'],
  ['cmoy8qpet023lp6guzs8mne81', '黄牒', 'single', 'deliverance'],
];

for (const [id, name, expectedMode, expectedGroup] of tplPairs) {
  // Find in templates array
  const tplRegex = new RegExp(`id:\\s*"${id}"[^}]*mode:\\s*"([^"]+)"[^}]*dataGroup:\\s*"([^"]+)"`);
  const tplMatch = configContent.match(tplRegex);
  if (!tplMatch) {
    check(false, `${name}: template not found in templates array`);
    continue;
  }
  const actualMode = tplMatch[1];
  const actualGroup = tplMatch[2];
  check(actualMode === expectedMode, `${name}: mode=${actualMode} (expected ${expectedMode})`);
  check(actualGroup === expectedGroup, `${name}: dataGroup=${actualGroup} (expected ${expectedGroup})`);

  // Also verify TEMPLATE_CATALOG entry exists
  const catRegex = new RegExp(`${id}[^}]*mode:\\s*"([^"]+)"[^}]*dataGroup:\\s*"([^"]+)"`);
  const catMatch = configContent.match(catRegex);
  if (catMatch) {
    check(catMatch[1] === expectedMode, `${name} catalog: mode=${catMatch[1]}`);
    check(catMatch[2] === expectedGroup, `${name} catalog: dataGroup=${catMatch[2]}`);
  }
}

// ── 2. Check for duplicate function definitions ──
console.log('\n2. Duplicate function definitions across files');
const allFiles = ['shared-config.js', 'shared-state.js', 'shared-render.js',
                   'shared-layout.js', 'shared-ui.js', 'shared-data.js',
                   'print.js', 'designer.js', 'manual.js'];

const functionDefs = {};
for (const file of allFiles) {
  try {
    const content = read(file);
    const matches = content.matchAll(/function (\w+)/g);
    for (const m of matches) {
      const fnName = m[1];
      if (!functionDefs[fnName]) functionDefs[fnName] = [];
      functionDefs[fnName].push(file);
    }
  } catch (e) {
    console.log(`  WARN: Cannot read ${file}`);
  }
}

let duplicates = 0;
for (const [fn, files] of Object.entries(functionDefs)) {
  if (files.length > 1) {
    console.log(`  DUPLICATE: "${fn}" in ${files.join(', ')}`);
    duplicates++;
  }
}
if (duplicates === 0) console.log('  OK: No duplicate function definitions');

// ── 3. Check HTML loading order ──
console.log('\n3. HTML loading order consistency');
for (const [name, htmlFile] of [['Index', 'index.html'], ['Designer', 'designer.html'], ['Manual', 'manual.html']]) {
  try {
    const html = read(htmlFile);
    const scripts = Array.from(html.matchAll(/<script src="([^"]+)"/g)).map(m => m[1].split('?')[0]);
    const shared = scripts.filter(s => s.startsWith('shared-'));
    const pageScript = scripts.filter(s => !s.startsWith('shared-'));
    const hasConfig = shared.some(s => s === 'shared-config.js');
    const hasState = shared.some(s => s === 'shared-state.js');
    const hasRender = shared.some(s => s === 'shared-render.js');
    const hasLayout = shared.some(s => s === 'shared-layout.js');
    const hasUi = shared.some(s => s === 'shared-ui.js');
    const hasData = shared.some(s => s === 'shared-data.js');
    check(hasConfig && hasState && hasRender && hasLayout && hasUi && hasData,
      `${name}: All 6 shared files loaded`);
    // shared-config.js should be loaded before shared-state.js
    const configIdx = shared.indexOf('shared-config.js');
    const stateIdx = shared.indexOf('shared-state.js');
    check(configIdx < stateIdx, `${name}: shared-config.js loaded before shared-state.js (config=${configIdx}, state=${stateIdx})`);
  } catch (e) {
    console.log(`  WARN: ${htmlFile} not found`);
  }
}

// ── 4. Verify dead code removed ──
console.log('\n4. Dead code removal');
let deadFound = false;
for (const file of allFiles) {
  try {
    const content = read(file);
    if (content.includes('BUILTIN_SINGLE_TEMPLATES')) {
      console.log(`  FAIL: BUILTIN_SINGLE_TEMPLATES still in ${file}`);
      deadFound = true;
    }
    if (content.includes('ensureBuiltinSingleTemplates')) {
      console.log(`  FAIL: ensureBuiltinSingleTemplates still in ${file}`);
      deadFound = true;
    }
  } catch (e) {}
}
if (!deadFound) console.log('  OK: Dead code fully removed');

// ── 5. plaqueToRow duplicates ──
console.log('\n5. plaqueToRow duplicate keys');
const renderContent = read('shared-render.js');
const keyNames = ['亡者阴庚', '亡者二阴庚', '亡者生日', '亡者忌日', '亡者二生日', '亡者二忌日'];
let dupKeys = 0;
for (const key of keyNames) {
  const regex = new RegExp(`"${key}":`, 'g');
  const matches = renderContent.match(regex);
  if (matches && matches.length > 1) {
    console.log(`  FAIL: "${key}": appears ${matches.length} times in plaqueToRow`);
    dupKeys++;
  }
}
if (dupKeys === 0) console.log('  OK: All keys unique');

// ── 6. Verify shared.js deleted ──
console.log('\n6. Stale merged file check');
const files = readdirSync(BASE);
const sharedExists = files.includes('shared.js');
check(!sharedExists, 'shared.js removed');

// ── 7. Check print-service static serving path ──
console.log('\n7. Print service config');
try {
  const printServiceIndex = readFileSync('I:/temple-os/print-service/index.js', 'utf-8');
  const hasPrintApiPath = printServiceIndex.includes('print-api') || printServiceIndex.includes('public');
  check(hasPrintApiPath, 'Print service serves static files');
} catch (e) {
  console.log('  WARN: Cannot read print-service/index.js');
}

// ── 8. Check Next.js print pages ──
console.log('\n8. Next.js print pages');
try {
  const printApiPage = readFileSync('I:/temple-os/frontend/src/app/print-api/page.tsx', 'utf-8');
  check(printApiPage.includes('redirect'), 'print-api/page.tsx has redirect logic');
  check(printApiPage.includes('designer'), 'print-api/page.tsx handles designer mode');
} catch (e) {
  console.log('  WARN: Cannot read print-api/page.tsx');
}

// ── Summary ──
console.log('\n=== Summary ===');
if (errors.length) {
  console.log(`FAILURES (${errors.length}):`);
  errors.forEach(e => console.log(`  X ${e}`));
  process.exit(1);
} else {
  console.log('All checks passed!');
  process.exit(0);
}
