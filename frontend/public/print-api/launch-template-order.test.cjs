const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = __dirname;
const targetTemplateId = 'server-row-1';
const localTemplateId = 'custom_remote_template';

function serverTemplate(id, localId, name) {
  return {
    id,
    name,
    type: 'LONGEVITY',
    paperWidth: 125,
    paperHeight: 360,
    elements: {
      source: 'tablet-print',
      version: 1,
      template: {
        id: localId,
        name,
        mode: 'single',
        dataGroup: 'blessing',
        tabletType: 'blessing',
        width: 125,
        height: 360,
        font: 'KaiTi, STKaiti, serif',
        vertical: true,
      },
      defaults: {
        positions: { subject: { x: 50, y: 30 } },
        styles: { subject: { fontSize: 18 } },
        sizes: { subject: { w: 20, h: 20 } },
      },
      layout: {
        paper: { width: 125, height: 360, vertical: true },
        positions: { subject: { x: 50, y: 30 } },
        styles: { subject: { fontSize: 18 } },
        sizes: { subject: { w: 20, h: 20 } },
      },
    },
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(1).toISOString(),
  };
}

async function createServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/api/plaque-templates') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        data: [
          serverTemplate('server-row-other', 'custom_other_template', 'Other Template'),
          serverTemplate(targetTemplateId, localTemplateId, 'Remote Launch Template'),
        ],
      }));
      return;
    }
    if (url.pathname === '/api/plaques') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, data: [] }));
      return;
    }
    if (url.pathname === '/api/rituals' || url.pathname === '/api/system/settings') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, data: [] }));
      return;
    }
    const filePath = url.pathname === '/' || url.pathname === '/print-api/index.html'
      ? path.join(root, 'index.html')
      : path.join(root, url.pathname.replace(/^\/print-api\//, ''));
    try {
      const content = await readFile(filePath);
      res.setHeader('Content-Type', filePath.endsWith('.js') ? 'application/javascript' : 'text/html');
      res.end(content);
    } catch {
      res.statusCode = 404;
      res.end('not found');
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server;
}

(async () => {
  const server = await createServer();
  const { port } = server.address();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  try {
    await page.goto(`http://127.0.0.1:${port}/print-api/index.html?templateId=${targetTemplateId}&type=LONGEVITY&plaqueId=p1`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForFunction((id) => document.querySelector('#templateSelect')?.value === id, localTemplateId, { timeout: 2000 });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
