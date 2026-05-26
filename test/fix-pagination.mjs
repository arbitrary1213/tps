import { readFileSync, writeFileSync } from 'fs';

const file = 'I:/temple-os/frontend/public/print-api/shared-data.js';
let content = readFileSync(file, 'utf8');
const lines = content.split('\n');

// Find the pagination block and replace it
let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const all = firstJson.data || []') &&
      lines[i+1] && lines[i+1].includes('const total = firstJson.total')) {
    console.log('Found pagination block at line', i + 1);

    // Replace lines i through i+11 (the old block is 12 lines)
    const newBlock = [
      '        const all = firstJson.data || [];',
      '        // Keep fetching while page is full (may have more data)',
      '        if (all.length >= PAGE_SIZE) {',
      '          const total = firstJson.total || 0;',
      '          const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : Infinity;',
      '          let page = 2;',
      '          while (page <= totalPages) {',
      '            const chunk = await fetchJson(',
      '              `/api/plaques?${new URLSearchParams({ ...baseParams, page: String(page) }).toString()}`,',
      '              { headers: authHeaders(), timeout: 10000 }',
      '            );',
      '            if (!Array.isArray(chunk) || chunk.length === 0) break;',
      '            all.push(...chunk);',
      '            if (chunk.length < PAGE_SIZE) break;',
      '            page += 1;',
      '          }',
      '        }',
      '        return all;',
    ];

    lines.splice(i, 12, ...newBlock);
    found = true;
    break;
  }
}

if (found) {
  writeFileSync(file, lines.join('\n'));
  console.log('Pagination fix applied successfully');
} else {
  console.log('Could not find pagination block');
  process.exit(1);
}
