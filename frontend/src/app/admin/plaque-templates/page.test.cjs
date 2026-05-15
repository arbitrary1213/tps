const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')

const source = readFileSync(path.join(__dirname, 'page.tsx'), 'utf8')

assert.doesNotMatch(source, /redirect\(/, 'admin template library should render a page instead of redirecting')
assert.match(source, /模板库/, 'admin template library page should identify itself')
assert.match(source, /服务器已保存/, 'template cards should surface server persistence state')
assert.match(source, /templateHasBackground/, 'template library should expose background status')
