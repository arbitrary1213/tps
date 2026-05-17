const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const root = __dirname;
const app = readFileSync(path.join(root, 'shared.js'), 'utf8');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(html, /id="workflowStatus"/, 'print page renders a workflow status panel');
assert.match(html, /id="dataSourceValue"/, 'workflow status shows the current data source');
assert.match(html, /id="templateSourceValue"/, 'workflow status shows the template source');

assert.match(app, /setWorkflowStatus/, 'app exposes workflow status updates');
assert.match(app, /setDataSourceStatus/, 'app tracks where print data came from');
assert.match(app, /setTemplateStatus/, 'app tracks template source and sync state');
assert.match(app, /setStorageModelStatus/, 'app tracks where configuration is stored');
assert.match(app, /markTemplateSavedLocally/, 'local-only template saves are reflected in workflow status');
assert.match(app, /markTemplateSyncing/, 'template sync in progress is reflected in workflow status');
assert.match(app, /markTemplateSynced/, 'successful template sync is reflected in workflow status');
assert.match(app, /markTemplateSyncFailed/, 'failed template sync is reflected in workflow status');
assert.match(app, /params\.get\("mode"\)/, 'launch params can carry a requested print mode');
assert.match(app, /launchMode === "summary" \? "summary" : "single"/, 'summary launch mode is respected');
assert.doesNotMatch(
  app,
  /const token = authToken\(\);\s*if \(!token\)\s*\{\s*alert\("请先登录后台系统，再读取系统牌位数据。"\);\s*return;\s*\}/,
  'web system data loading no longer blocks on a localStorage token before cookie auth can work'
);
