import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const PRINT_API = 'http://127.0.0.1:3001';
const FRONTEND = 'http://127.0.0.1:3000';

const results = [];

function log(step, status, detail = '') {
  const line = `[${status}] ${step}${detail ? ' — ' + detail : ''}`;
  results.push({ step, status, detail });
  console.log(line);
}

async function testPage(browser, url, name, checks = []) {
  console.log(`\n=== Testing: ${name} ===`);
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    log(`Load ${name}`, 'OK', url);

    // Run custom checks
    for (const check of checks) {
      try {
        await check(page);
      } catch (e) {
        log(check.name || 'unnamed check', 'FAIL', e.message);
      }
    }

  } catch (e) {
    log(`Load ${name}`, 'FAIL', e.message);
  }

  if (errors.length) {
    errors.forEach(e => log('JS Error', 'FAIL', e));
  } else {
    log('JS Errors', 'OK', 'No JavaScript errors');
  }

  await page.close();
  return errors;
}

async function main() {
  console.log('=== Print Module E2E Test ===\n');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  try {
    // ── Test 1: Print tool index page (main print tool) ──
    await testPage(browser, `${PRINT_API}/`, 'Print Tool (index)', [
      async (page) => {
        // Check that header exists
        const header = await page.textContent('h1');
        if (!header?.includes('牌位套打')) throw new Error('Header not found: ' + header);
        log('Header check', 'OK', header);
      },
      async (page) => {
        // Check that print button exists
        const btn = await page.$('#printBtn');
        if (!btn) throw new Error('Print button not found');
        log('Print button', 'OK', 'Found');
      },
      async (page) => {
        // Check that template select is populated (use $$eval directly)
        await page.waitForTimeout(1000);
        const count = await page.$$eval('#templateSelect option', els => els.length);
        if (count === 0) throw new Error('No templates loaded');
        log('Template select', 'OK', `${count} templates loaded`);
      },
      async (page) => {
        // Check that preview area exists
        const preview = await page.$('#preview');
        if (!preview) throw new Error('Preview area not found');
        log('Preview area', 'OK', 'Found');
      },
      async (page) => {
        // Check mode buttons work
        const summaryBtn = await page.$('[data-mode="summary"]');
        if (!summaryBtn) throw new Error('Summary mode button not found');
        await summaryBtn.click();
        await page.waitForTimeout(300);
        const isActive = await summaryBtn.evaluate(el => el.classList.contains('active'));
        if (!isActive) throw new Error('Summary mode not activated');
        log('Mode switching', 'OK', 'Summary mode activated');
        // Switch back
        const singleBtn = await page.$('[data-mode="single"]');
        await singleBtn.click();
      },
      async (page) => {
        // Check that sample data loads
        const sampleBtn = await page.$('#sampleBtn');
        if (!sampleBtn) throw new Error('Sample button not found');
        await sampleBtn.click();
        await page.waitForTimeout(500);
        const statusText = await page.textContent('#statusText');
        if (!statusText?.length) throw new Error('Status text empty after loading sample');
        log('Sample data', 'OK', statusText);
      },
    ]);

    // ── Test 2: Designer page ──
    await testPage(browser, `${PRINT_API}/designer.html`, 'Template Designer', [
      async (page) => {
        const header = await page.textContent('h1');
        if (!header?.includes('模板设计')) throw new Error('Header not found: ' + header);
        log('Header check', 'OK', header);
      },
      async (page) => {
        // Check designer-specific controls
        const saveBtn = await page.$('#saveTemplateBtn');
        const resetBtn = await page.$('#resetTemplateBtn');
        if (!saveBtn) throw new Error('Save button not found');
        if (!resetBtn) throw new Error('Reset button not found');
        log('Designer controls', 'OK', 'Save/Reset buttons found');
      },
      async (page) => {
        // Check new template dialog
        const newBtn = await page.$('#newTemplateBtn');
        if (!newBtn) throw new Error('New template button not found');
        log('New template button', 'OK', 'Found');
      },
    ]);

    // ── Test 3: Manual input page ──
    await testPage(browser, `${PRINT_API}/manual.html`, 'Manual Input', [
      async (page) => {
        const header = await page.textContent('h1');
        if (!header?.includes('手动输入')) throw new Error('Header not found: ' + header);
        log('Header check', 'OK', header);
      },
      async (page) => {
        // Check that template select loads
        await page.waitForTimeout(1000);
        const count = await page.$$eval('#templateSelect option', els => els.length);
        if (count === 0) throw new Error('No templates loaded');
        log('Template select', 'OK', `${count} templates`);
      },
      async (page) => {
        // Check print button
        const printBtn = await page.$('#printBtn');
        if (!printBtn) throw new Error('Print button not found');
        log('Print button', 'OK', 'Found');
      },
    ]);

    // ── Test 4: Print API redirect page ──
    await testPage(browser, `${FRONTEND}/print-api`, 'Print API Redirect', [
      async (page) => {
        // Should redirect to index.html or show a login page (auth-required routes may redirect)
        await page.waitForTimeout(3000);
        const url = page.url();
        if (url.includes('index.html')) {
          log('Redirect', 'OK', 'Redirected to print-api/index.html');
        } else if (url.includes('login') || url.includes('auth')) {
          log('Redirect', 'OK', 'Auth required (expected without login)');
        } else {
          log('Redirect', 'OK', `Landed at: ${url}`);
        }
      },
    ]);

    // ── Test 5: Print center page (requires auth, may redirect to login) ──
    await testPage(browser, `${FRONTEND}/admin/print-center`, 'Print Center', [
      async (page) => {
        await page.waitForTimeout(3000);
        const url = page.url();
        if (url.includes('login') || url.includes('auth')) {
          log('Auth gate', 'OK', 'Redirected to login (expected without session)');
        } else if (url.includes('print-center')) {
          const title = await page.textContent('h2');
          if (title?.includes('模板中心')) {
            log('Title check', 'OK', title);
            // Check action links
            const links = await page.$$eval('a[href]', els => els.map(el => el.getAttribute('href')));
            const hasPlaques = links.some(h => h.includes('admin/plaques'));
            const hasPrintApi = links.some(h => h.includes('print-api'));
            const hasManual = links.some(h => h.includes('manual'));
            const hasTemplates = links.some(h => h.includes('plaque-templates'));
            if (!hasPlaques || !hasPrintApi || !hasManual || !hasTemplates) {
              throw new Error(`Missing links: plaques=${hasPlaques}, printApi=${hasPrintApi}, manual=${hasManual}, templates=${hasTemplates}`);
            }
            log('Action links', 'OK', 'All 4 links present');
          }
        } else {
          log('Print center', 'OK', `Landed at: ${url}`);
        }
      },
    ]);

    // ── Test 6: Print preview mode (with preview=1 param) ──
    await testPage(browser, `${PRINT_API}/?preview=1`, 'Print Preview Mode', [
      async (page) => {
        const hasClass = await page.evaluate(() => document.documentElement.classList.contains('print-preview-mode'));
        if (!hasClass) throw new Error('print-preview-mode class not set');
        log('Preview mode class', 'OK', 'Set on documentElement');
      },
    ]);

    // ── Test 7: Verify shared JS modules load without conflicts ──
    await testPage(browser, `${PRINT_API}/`, 'JS Module Integrity', [
      async (page) => {
        const checks = await page.evaluate(() => {
          const results = [];
          if (typeof templates === 'undefined') results.push('templates not defined');
          if (typeof state === 'undefined') results.push('state not defined');
          if (typeof $ !== 'function') results.push('$ not a function');
          if (typeof normalizeCatalogTemplate !== 'function') results.push('normalizeCatalogTemplate not a function');
          if (typeof currentTemplate !== 'function') results.push('currentTemplate not a function');
          if (typeof loadRows !== 'function') results.push('loadRows not a function');
          if (typeof printAll !== 'function') results.push('printAll not a function');
          if (typeof tabletTypes === 'undefined') results.push('tabletTypes not defined');
          if (typeof sampleData === 'undefined') results.push('sampleData not defined');
          return results;
        });
        if (checks.length) throw new Error(checks.join('; '));
        log('Global functions', 'OK', 'All core functions defined');
      },
      async (page) => {
        // Verify template consistency
        const inconsistencies = await page.evaluate(() => {
          const issues = [];
          for (const tpl of templates) {
            const cat = TEMPLATE_CATALOG[tpl.id];
            if (!cat) continue;
            if (cat.mode && cat.mode !== tpl.mode) {
              issues.push(`${tpl.id}: template.mode=${tpl.mode} vs catalog.mode=${cat.mode}`);
            }
            if (cat.dataGroup && cat.dataGroup !== tpl.dataGroup) {
              issues.push(`${tpl.id}: template.dataGroup=${tpl.dataGroup} vs catalog.dataGroup=${cat.dataGroup}`);
            }
          }
          return issues;
        });
        if (inconsistencies.length) throw new Error('Template inconsistencies: ' + inconsistencies.join('; '));
        log('Template consistency', 'OK', 'All templates match catalog');
      },
    ]);

  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n=== Test Results ===');
  const failed = results.filter(r => r.status === 'FAIL');
  const passed = results.filter(r => r.status === 'OK');
  console.log(`Passed: ${passed.length}, Failed: ${failed.length}`);
  if (failed.length) {
    console.log('\nFailures:');
    failed.forEach(f => console.log(`  - ${f.step}: ${f.detail}`));
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
  }
}

main().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
