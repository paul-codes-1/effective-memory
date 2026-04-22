// filter-lexington-urban.js
// Reads export_contributor_*.csv from repo root, filters rows where Location includes
// "LEXINGTON-URBAN", and writes the result to 2026-lfucg-primary-contributions.json.

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

function findCsv() {
  const entries = fs.readdirSync(repoRoot);
  const matches = entries.filter(
    name => name.startsWith('export_contributor_') && name.endsWith('.csv'),
  );
  if (matches.length === 0) {
    console.error(`No export_contributor_*.csv file found in ${repoRoot}`);
    process.exit(1);
  }
  // Pick the most recently modified one.
  matches.sort((a, b) => {
    const ta = fs.statSync(path.join(repoRoot, a)).mtimeMs;
    const tb = fs.statSync(path.join(repoRoot, b)).mtimeMs;
    return tb - ta;
  });
  return path.join(repoRoot, matches[0]);
}

function main() {
  const inputPath = findCsv();
  console.log(`Reading ${inputPath}`);
  const text = fs.readFileSync(inputPath, 'utf8');
  const rows = parseCsv(text);
  if (rows.length === 0) {
    console.error('CSV is empty.');
    process.exit(1);
  }
  const headers = rows[0];
  const locationIdx = headers.indexOf('Location');
  if (locationIdx === -1) {
    console.error('No "Location" column in CSV.');
    process.exit(1);
  }

  const filtered = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && row[0] === '') continue; // trailing blank line
    const location = row[locationIdx] || '';
    if (!location.includes('LEXINGTON-URBAN')) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = coerce(headers[c], row[c] ?? '');
    }
    filtered.push(obj);
  }

  fs.writeFileSync(outputPath, JSON.stringify(filtered, null, 2), 'utf8');
  console.log(`Filtered ${filtered.length} rows -> ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
