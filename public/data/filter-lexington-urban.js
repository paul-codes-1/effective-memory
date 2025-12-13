// filter-lexington-urban.js
// Filters 2026-primary.json for items where Location includes "LEXINGTON-URBAN"
// and writes the result to 2026-lfucg-primary-contributions.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '2026-primary.json');
const outputPath = path.join(__dirname, '2026-lfucg-primary-contributions.json');

function main() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (!Array.isArray(data)) {
    console.error('Input JSON is not an array.');
    process.exit(1);
  }
  const filtered = data.filter(item =>
    typeof item.Location === 'string' && item.Location.includes('LEXINGTON-URBAN')
  );
  fs.writeFileSync(outputPath, JSON.stringify(filtered, null, 2), 'utf8');
  console.log(`Filtered ${filtered.length} items to ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
