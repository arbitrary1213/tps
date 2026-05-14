const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const deploy = readFileSync(path.join(root, 'deploy.sh'), 'utf8');
const workflow = readFileSync(path.join(root, '.github', 'workflows', 'deploy-production.yml'), 'utf8');

assert.match(deploy, /sync_print_api_assets\(\)/, 'deploy.sh defines a print asset sync step');
assert.match(deploy, /frontend\/\.next\/standalone\/public\/print-api/, 'deploy.sh syncs print-api into the Next standalone public directory');
assert.match(deploy, /if has_target print; then[\s\S]*sync_print_api_assets[\s\S]*restart_frontend[\s\S]*build_print_image[\s\S]*restart_print[\s\S]*fi/, 'deploy.sh print target refreshes frontend static assets before rebuilding print service');
assert.match(deploy, /if has_target print; then verify_frontend; fi/, 'deploy.sh verifies frontend after print-only deploys');

[
  'launch-template-order.test.cjs',
  'pdf-print-quality.test.cjs',
  'print-output.test.cjs',
  'template-load-order.test.cjs',
  'template-server-sync.test.cjs',
].forEach((testFile) => {
  assert.match(workflow, new RegExp(`node \\.\\./frontend/public/print-api/${testFile.replace('.', '\\.')}`), `deploy workflow executes ${testFile}`);
});
