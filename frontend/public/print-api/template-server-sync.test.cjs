const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const app = readFileSync(path.join(__dirname, 'app.js'), 'utf8');

assert.match(app, /function canSyncServerTemplates\(\)/, 'template sync has a shared server-sync gate');
assert.match(app, /return !isDesktopRuntime\(\) \|\| Boolean\(authToken\(\)\);/, 'web template sync relies on cookie-backed requests');
assert.doesNotMatch(app, /const shouldSync = syncTemplate && \(isDesktopRuntime\(\) \|\| Boolean\(authToken\(\)\)\);/, 'template mutation sync is not blocked by missing localStorage token');
assert.doesNotMatch(app, /const shouldSync = isDesktopRuntime\(\) \|\| Boolean\(authToken\(\)\);/, 'manual template save is not blocked by missing localStorage token');
assert.doesNotMatch(app, /\n\s*if \(!authToken\(\)\) return;\n\s*if \(remoteId\)/, 'web server sync does not return before cookie-authenticated upload');
