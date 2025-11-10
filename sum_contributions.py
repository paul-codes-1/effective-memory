import json, re
from pathlib import Path

def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r'"'"'[^a-z0-9]+'"'"', '"'"'-'"'"', value)
    value = re.sub(r'"'"'^-+|-+$'"'"', '"''"', value)
    return value or '"'"'unknown'"'"'

source_path = Path('"'"'public/data/contributors.json'"'"')
data = json.loads(source_path.read_text())

totals = {}
for row in data:
    first = (row.get('"'"'Contributor First Name'"'"') or '"''"').strip()
    last = (row.get('"'"'Contributor Last Name'"'"') or '"''"').strip()
    from_org = (row.get('"'"'From Organization Name'"'"') or '"''"').strip()
    full_name = '"'"' '"'"'.join(part for part in [first, last] if part).strip() or from_org or '"'"'Unknown contributor'"'"'
    key = slugify(f'"'"'{first} {last}'"'"'.strip())
    if key == '"'"'unknown'"'"' and from_org:
        key = slugify(from_org)
    entry = totals.setdefault(
        key,
        {
            '"'"'fullName'"'"': full_name,
            '"'"'totalAmount'"'"': 0.0,
            '"'"'contributionCount'"'"': 0,
        },
    )
    try:
        amount = float(row.get('"'"'Amount'"'"') or 0)
    except ValueError:
        amount = 0.0
    entry['"'"'totalAmount'"'"'] += amount
    entry['"'"'contributionCount'"'"'] += 1

output_path = Path('"'"'public/data/contributor_totals.json'"'"')
output_path.write_text(json.dumps(totals, indent=2))
print(f'"'"'Wrote {len(totals)} contributor totals to {output_path}'"'"')