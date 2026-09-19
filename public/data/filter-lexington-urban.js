// filter-lexington-urban.js
// Reads EVERY export_contributor_*.csv in the repo root (one per 2026 election:
// the 5/19 primary and the 11/3 general), filters rows where Location includes
// "LEXINGTON-URBAN", drops Contribution Mode == TRANSFER rows (a candidate's
// unspent primary balance moved into their general committee — the same dollars
// already counted as primary contributions), and writes the union to
// 2026-lfucg-primary-contributions.json (filename kept for the app + Amplify).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..', '..');
const outputPath = path.join(__dirname, '2026-lfucg-primary-contributions.json');

// Parse a CSV per RFC 4180 (quoted fields, embedded commas, "" escapes, CRLF).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (c === '\r') {
        // skip; \n will terminate the row
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const numericFields = new Set(['Amount', 'Number Of Contributors']);
// Zip can be numeric or empty; existing JSON stores it as a number when present.
const zipField = 'Zip';

function coerce(header, value) {
  if (header === zipField) {
    if (value === '' || value == null) return '';
    const n = Number(value);
    return Number.isFinite(n) && String(n) === String(value).replace(/^0+/, '') ? n : value;
  }
  if (numericFields.has(header)) {
    if (value === '' || value == null) return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return value ?? '';
}

function findCsvs() {
  const entries = fs.readdirSync(repoRoot);
  const matches = entries
    .filter(name => name.startsWith('export_contributor_') && name.endsWith('.csv'))
    .sort();
  if (matches.length === 0) {
    console.error(`No export_contributor_*.csv file found in ${repoRoot}`);
    process.exit(1);
  }
  return matches.map(name => path.join(repoRoot, name));
}

function main() {
  const filtered = [];
  let dropped = 0;
  for (const inputPath of findCsvs()) {
    console.log(`Reading ${inputPath}`);
    const text = fs.readFileSync(inputPath, 'utf8');
    const rows = parseCsv(text);
    if (rows.length === 0) {
      console.error(`CSV is empty: ${inputPath}`);
      process.exit(1);
    }
    const headers = rows[0];
    const locationIdx = headers.indexOf('Location');
    const modeIdx = headers.indexOf('Contribution Mode');
    if (locationIdx === -1) {
      console.error(`No "Location" column in ${inputPath}`);
      process.exit(1);
    }
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 1 && row[0] === '') continue; // trailing blank line
      const location = row[locationIdx] || '';
      if (!location.includes('LEXINGTON-URBAN')) continue;
      if (modeIdx !== -1 && (row[modeIdx] || '') === 'TRANSFER') {
        dropped++;
        continue;
      }
      const obj = {};
      for (let c = 0; c < headers.length; c++) {
        obj[headers[c]] = coerce(headers[c], row[c] ?? '');
      }
      filtered.push(obj);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(filtered, null, 2), 'utf8');
  console.log(`Filtered ${filtered.length} rows (dropped ${dropped} carryover transfers) -> ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
