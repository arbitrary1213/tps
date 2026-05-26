import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const PRINT_API = 'http://127.0.0.1:3001';
const OUTPUT_DIR = 'I:/temple-os/test/output';
mkdirSync(OUTPUT_DIR, { recursive: true });

function log(step, status, detail = '') {
  console.log(`[${status}] ${step}${detail ? ' — ' + detail : ''}`);
}

async function testBatchFlow(name, url, description) {
  console.log(`\n=== ${name} ===`);
  console.log(`  ${description}`);
  const page = await globalBrowser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    // Check page state
    const statusText = await page.textContent('#statusText');
    const pageText = await page.textContent('#pageText');
    const mode = await page.evaluate(() => document.querySelector('[data-mode].active')?.dataset?.mode || '');
    log('Page loaded', 'OK');
    log('Mode', 'OK', mode);
    log('Status', 'OK', statusText?.substring(0, 80) || '');
    log('Page info', 'OK', pageText?.substring(0, 50) || '');

    // Trigger print
    const printResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        const origPrint = window.print;
        window.print = () => {
          const preview = document.getElementById('preview');
          const sheets = preview.querySelectorAll('.sheet');
          resolve({
            sheetCount: sheets.length,
            hasSheets: sheets.length > 0,
            previewEmpty: !preview.innerHTML.trim() || preview.querySelector('.empty'),
            errorShown: !!preview.querySelector('.empty'),
            errorText: preview.querySelector('.empty')?.textContent?.substring(0, 100) || '',
          });
        };
        try {
          document.getElementById('printBtn')?.click();
          if (typeof printAll === 'function' && !document.getElementById('printBtn')) printAll();
        } catch(e) {
          resolve({ error: e.message });
        }
        setTimeout(() => { window.print = origPrint; }, 200);
      });
    });

    log('Sheets', printResult.sheetCount > 0 ? 'OK' : 'WARN', `${printResult.sheetCount} sheets`);
    if (printResult.errorShown) {
      log('Error UI', 'OK', `Shows: "${printResult.errorText}"`);
    }
    if (printResult.hasSheets) {
      // Generate PDF
      const pdfPath = join(OUTPUT_DIR, `batch_${name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true });
      log('PDF', 'OK', pdfPath);
    }

  } catch (e) {
    log('Error', 'FAIL', e.message);
  }

  if (errors.length) {
    errors.forEach(e => log('JS Error', 'FAIL', e));
  } else {
    log('JS Errors', 'OK', 'None');
  }

  await page.close();
}

async function main() {
  console.log('=== Batch Print Flow Test ===\n');
  console.log('Testing multi-plaque batch print scenarios\n');

  globalThis.globalBrowser = await chromium.launch({ channel: 'msedge', headless: true });

  // Test 1: Single plaque via plaqueId param (牌位管理入口)
  await testBatchFlow(
    'Single-Plaque-Entry',
    `${PRINT_API}/?type=LONGEVITY&autoPrint=1&plaqueId=test001&templateId=cmp6vaj3l000gbjnjoak9q9wx`,
    'Simulates: plaque management → select one plaque → print with template'
  );

  // Test 2: Batch plaque via plaqueIds param
  await testBatchFlow(
    'Batch-Plaque-Entry',
    `${PRINT_API}/?type=LONGEVITY&autoPrint=1&plaqueIds=test001,test002,test003&templateId=cmp6vaj3l000gbjnjoak9q9wx`,
    'Simulates: plaque management → select 3 plaques → batch print'
  );

  // Test 3: Batch without templateId (use default)
  await testBatchFlow(
    'Batch-No-Template',
    `${PRINT_API}/?type=DELIVERANCE&autoPrint=1&plaqueIds=a,b,c`,
    'Simulates: batch print without specifying template (uses default)'
  );

  // Test 4: Summary mode batch
  await testBatchFlow(
    'Batch-Summary',
    `${PRINT_API}/?type=LONGEVITY&autoPrint=1&plaqueIds=x1,x2,x3,x4,x5&templateId=cmp6uyyk10003bjnjsqkn2uwn&mode=summary`,
    'Simulates: summary mode batch print with 5 plaques'
  );

  // Test 5: Load sample data and batch print (backend-independent fallback)
  await testBatchFlow(
    'Sample-Data-Batch',
    `${PRINT_API}/`,
    'Loads sample data (2 blessing + 3 deliverance records) and prints them all'
  );

  await globalBrowser.close();
  console.log('\n=== Done ===');
}

main().catch(err => { console.error(err); process.exit(1); });
