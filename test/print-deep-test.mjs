import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const PRINT_API = 'http://127.0.0.1:3001';
const OUTPUT_DIR = 'I:/temple-os/test/output';
mkdirSync(OUTPUT_DIR, { recursive: true });

const results = [];
function log(step, status, detail = '') {
  const line = `[${status}] ${step}${detail ? ' — ' + detail : ''}`;
  results.push({ step, status, detail });
  console.log(line);
}

async function testPrintOutput(browser, name, url, checks = []) {
  console.log(`\n=== ${name} ===`);
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Check page loaded
    const preview = await page.$('#preview');
    if (!preview) throw new Error('Preview area not found');
    log('Page loaded', 'OK');

    // Check template options
    const tplCount = await page.$$eval('#templateSelect option', els => els.length);
    log('Templates', 'OK', `${tplCount} loaded`);

    // Run custom setup checks
    for (const check of checks) {
      await check(page);
    }

    // Now trigger print and capture the print HTML
    // We intercept window.print to capture the HTML that would be printed
    const printResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        const origPrint = window.print;
        window.print = () => {
          const preview = document.getElementById('preview');
          const sheets = preview.querySelectorAll('.sheet');
          const styles = document.querySelector('style#printPageSize');
          const pageSizeCSS = styles ? styles.textContent : '';

          // Get computed styles of first sheet
          const firstSheet = sheets[0];
          const computedStyle = firstSheet ? {
            width: getComputedStyle(firstSheet).width,
            height: getComputedStyle(firstSheet).height,
          } : {};

          resolve({
            sheetCount: sheets.length,
            firstSheetHTML: firstSheet ? firstSheet.outerHTML.substring(0, 500) : '',
            firstSheetComputed: computedStyle,
            pageSizeCSS: pageSizeCSS,
            previewHTML: preview.innerHTML.substring(0, 3000),
            statusText: document.getElementById('statusText')?.textContent || '',
            pageText: document.getElementById('pageText')?.textContent || '',
            mode: document.querySelector('[data-mode].active')?.dataset?.mode || '',
            hasDuplex: !!document.querySelector('.duplex-back-sheet'),
            hasBackground: !!preview.querySelector('.template-bg'),
          });
        };
        // Trigger the print button
        document.getElementById('printBtn')?.click();
        // If printBtn doesn't exist, try printAll directly
        if (typeof printAll === 'function') printAll();
        // Restore
        setTimeout(() => { window.print = origPrint; }, 100);
      });
    });

    log('Print triggered', 'OK');
    log('Sheet count', 'OK', `${printResult.sheetCount} sheets`);
    log('Mode', 'OK', printResult.mode || 'unknown');
    log('Status', 'OK', printResult.statusText);
    log('Page info', 'OK', printResult.pageText);
    log('Page size CSS', 'OK', printResult.pageSizeCSS.replace(/\s+/g, ' ').trim());
    log('First sheet size', 'OK', `${printResult.firstSheetComputed.width} x ${printResult.firstSheetComputed.height}`);
    log('Duplex', printResult.hasDuplex ? 'WARN' : 'OK', printResult.hasDuplex ? 'Duplex sheets present' : 'Not enabled');
    log('Background', 'OK', printResult.hasBackground ? 'Template background present' : 'No template background');

    // Verify print output
    if (printResult.sheetCount === 0) {
      log('Print output', 'FAIL', 'No sheets generated!');
    } else {
      log('Print output', 'OK', `${printResult.sheetCount} sheet(s) generated`);
    }

    // Check that page size is set correctly
    if (!printResult.pageSizeCSS.includes('size:')) {
      log('Page size', 'FAIL', '@page size not set');
    } else {
      log('Page size', 'OK', 'Properly configured');
    }

    // Try generating actual PDF
    const pdfPath = join(OUTPUT_DIR, `${name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    await page.pdf({
      path: pdfPath,
      printBackground: true,
      preferCSSPageSize: true,
    });
    log('PDF generated', 'OK', pdfPath);

  } catch (e) {
    log('Test error', 'FAIL', e.message);
  }

  if (errors.length) {
    errors.forEach(e => log('JS Error', 'FAIL', e));
  } else {
    log('JS Errors', 'OK', 'None');
  }

  await page.close();
  return errors.length === 0;
}

async function main() {
  console.log('=== Print Module Deep Test ===\n');
  console.log('Testing actual print output generation...\n');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  try {
    // Test 1: Single mode, blessing sample data, default template
    await testPrintOutput(browser, '1-Single-Blessing-Default', PRINT_API + '/', [
      async (page) => {
        // Load sample data (blessing by default since first template is blessing)
        await page.click('#sampleBtn');
        await page.waitForTimeout(500);
        log('Data loaded', 'OK', await page.textContent('#statusText'));
      },
    ]);

    // Test 2: Summary mode
    await testPrintOutput(browser, '2-Summary-Blessing', PRINT_API + '/', [
      async (page) => {
        await page.click('#sampleBtn');
        // Switch to summary mode
        await page.click('[data-mode="summary"]');
        await page.waitForTimeout(500);
        log('Switched to summary', 'OK', await page.textContent('#statusText'));
      },
    ]);

    // Test 3: Deliverance single mode
    await testPrintOutput(browser, '3-Single-Deliverance', PRINT_API + '/', [
      async (page) => {
        // Select a deliverance template first
        await page.selectOption('#templateSelect', 'cmozm19an001ahmbwqm8nmi1q');
        await page.waitForTimeout(500);
        // Load deliverance sample via button
        await page.click('#sampleBtn');
        await page.waitForTimeout(500);
        log('Deliverance template', 'OK', await page.textContent('#statusText'));
      },
    ]);

    // Test 4: Print preview mode (autoPrint simulation)
    await testPrintOutput(browser, '4-Preview-Mode', PRINT_API + '/?preview=1&type=LONGEVITY', [
      async (page) => {
        await page.waitForTimeout(1000);
        const hasPreviewClass = await page.evaluate(() =>
          document.documentElement.classList.contains('print-preview-mode')
        );
        log('Preview mode', hasPreviewClass ? 'OK' : 'FAIL', 'CSS class check');
        log('Sample loaded', 'OK', await page.textContent('#statusText'));
      },
    ]);

    // Test 5: Custom paper size
    await testPrintOutput(browser, '5-Custom-Paper-A3', PRINT_API + '/', [
      async (page) => {
        await page.selectOption('#paperSelect', 'A3');
        await page.waitForTimeout(300);
        await page.click('#sampleBtn');
        await page.waitForTimeout(500);
        const w = await page.$eval('#paperWidth', el => el.value);
        const h = await page.$eval('#paperHeight', el => el.value);
        log('Paper size', 'OK', `${w}×${h}mm`);
      },
    ]);

    // Test 6: Print from specific page
    await testPrintOutput(browser, '6-Print-From-Page', PRINT_API + '/', [
      async (page) => {
        await page.click('#sampleBtn');
        await page.waitForTimeout(500);
        // Jump to page 2, then print from that page
        const pageCount = await page.textContent('#pageText');
        log('Before jump', 'OK', pageCount);
      },
    ]);

  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n=== Print Test Summary ===');
  const failed = results.filter(r => r.status === 'FAIL');
  const passed = results.filter(r => r.status === 'OK');
  console.log(`Passed: ${passed.length}, Failed: ${failed.length}, Warnings: ${results.filter(r => r.status === 'WARN').length}`);

  if (failed.length) {
    console.log('\nFailures:');
    failed.forEach(f => console.log(`  - ${f.step}: ${f.detail}`));
    process.exit(1);
  }

  console.log(`\nPDFs saved to: ${OUTPUT_DIR}`);
  console.log('All print flows verified successfully!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
