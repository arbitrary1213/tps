import { readFileSync } from 'fs';
import { join } from 'path';

const OUTPUT_DIR = 'I:/temple-os/test/output';
const pdfFiles = [
  '1_Single_Blessing_Default.pdf',
  '2_Summary_Blessing.pdf',
  '3_Single_Deliverance.pdf',
];

async function extractPDFText(pdfPath) {
  // Use pdfjs-dist from print-service node_modules
  const pdfjsLib = await import('I:/temple-os/print-service/node_modules/pdfjs-dist/build/pdf.mjs');

  const data = new Uint8Array(readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data, useWorkerFetch: false }).promise;

  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ').substring(0, 300);
    pages.push({ page: i, text });
  }

  return { numPages: doc.numPages, pages };
}

for (const pdfFile of pdfFiles) {
  const pdfPath = join(OUTPUT_DIR, pdfFile);
  console.log(`\n=== ${pdfFile} ===`);
  try {
    const result = await extractPDFText(pdfPath);
    console.log(`Pages: ${result.numPages}`);
    result.pages.forEach(p => {
      console.log(`  Page ${p.page}: "${p.text}"`);
    });
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}
