import { readFileSync, writeFileSync } from 'fs';

const file = 'I:/temple-os/frontend/public/print-api/shared-data.js';
let content = readFileSync(file, 'utf8');
const lines = content.split('\n');

// Find the applyLaunchParams web path pagination block
// Replace lines 325-334 (var queryParams ... fetchJson single page)
let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('var queryParams = {};') &&
      lines[i+7] && lines[i+7].includes("plaques = await fetchJson(")) {
    console.log('Found applyLaunchParams web block at line', i + 1);

    // Keep lines 325-332 (queryParams building) but replace 333-334 (fetch)
    // i=325 (var queryParams), ..., i+8=334 (fetchJson)
    const newBlock = [
      '          var queryParams = {};',
      '          if (selectedIds.size) {',
      '            queryParams = { ids: Array.from(selectedIds).join(",") };',
      '          } else {',
      '            if (type) queryParams.plaqueType = type;',
      '            if (statusValue) queryParams.status = statusValue;',
      '            queryParams.pageSize = "200";',
      '          }',
    ];

    // Replace lines i through i+8 (9 lines: var queryParams through fetchJson result)
    const fetchAllPlaquesBlock = [
      '          // Fetch all pages when no specific IDs are provided',
      '          let allPlaques = [];',
      '          if (selectedIds.size) {',
      '            // Specific IDs — single request is fine',
      '            var query = new URLSearchParams(queryParams);',
      '            allPlaques = await fetchJson(`/api/plaques?${query.toString()}`, { headers: authHeaders(), timeout: 10000 });',
      '          } else {',
      '            // Filtered query — paginate through all results',
      '            let page = 1;',
      '            while (true) {',
      '              var pageQuery = new URLSearchParams({ ...queryParams, page: String(page) });',
      '              const chunk = await fetchJson(`/api/plaques?${pageQuery.toString()}`, { headers: authHeaders(), timeout: 10000 });',
      '              if (!Array.isArray(chunk) || chunk.length === 0) break;',
      '              allPlaques.push(...chunk);',
      '              if (chunk.length < 200) break;',
      '              page += 1;',
      '            }',
      '          }',
      '          plaques = allPlaques;',
    ];

    lines.splice(i, 9, ...newBlock, ...fetchAllPlaquesBlock);
    found = true;
    break;
  }
}

if (found) {
  writeFileSync(file, lines.join('\n'));
  console.log('applyLaunchParams pagination fix applied successfully');
} else {
  console.log('Could not find applyLaunchParams block');
  process.exit(1);
}
