#!/bin/bash
# Weekly refresh for the LFUCG Contributors Dashboard (app.lexingtonky.news).
# Re-pulls the current 2026 primary KREF export, regenerates the LFUCG-filtered
# JSON, and (if it changed) commits + pushes to GitHub. Amplify app
# local-contributors (d3th3t3y3thflm) auto-builds main -> deploys.
# Cron-safe: absolute paths, no interactive prompts, all output to stdout.
set -uo pipefail
# nvm-managed node isn't on cron's minimal PATH — resolve the newest installed version
export PATH="$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/id_ed25519_personal -o IdentitiesOnly=yes -o BatchMode=yes"

ROOT="$HOME/lt/contributors"
KREF_CSV="$HOME/lt/kref-tracker/data/raw/2026-05-19.csv"   # krefwatch's Monday pull (11:30) lands here first
KREF_GEN_CSV="$HOME/lt/kref-tracker/data/raw/2026-11-03.csv" # 11/3 general — same pull
cd "$ROOT"
echo "=== contributors refresh $(date -u +%FT%TZ) ==="

valid_csv() { [ -s "$1" ] && head -c 18 "$1" | grep -q '"To Organization"' && [ "$(wc -c < "$1")" -ge 1000000 ]; }

STAMP=$(date +%s)
DEST="$ROOT/export_contributor_${STAMP}_primary.csv"
DEST_GEN="$ROOT/export_contributor_${STAMP}_general.csv"
# Prefer krefwatch's freshly-pulled CSV (avoids a second big KREF hit); else pull our own.
if valid_csv "$KREF_CSV" && [ "$(( $(date +%s) - $(stat -f %m "$KREF_CSV") ))" -lt 86400 ]; then
  echo "using krefwatch CSV ($KREF_CSV)"; cp "$KREF_CSV" "$DEST"
else
  echo "pulling KREF directly"
  enc=$(python3 -c "import urllib.parse; print(urllib.parse.quote('5/19/2026 00:00:00'))")
  ok=0
  for a in 1 2 3 4 5; do
    curl -s --max-time 600 "https://secure.kentucky.gov/kref/publicsearch/ExportContributors?ElectionDate=${enc}&ContributionSearchType=All" -o "$DEST.tmp"
    if valid_csv "$DEST.tmp"; then mv "$DEST.tmp" "$DEST"; ok=1; break; fi
    echo "attempt $a: KREF bad response, retry in 60s"; rm -f "$DEST.tmp"; sleep 60
  done
  [ "$ok" = 1 ] || { echo "ABORT: KREF never returned valid CSV"; exit 1; }
fi

# General-election export (11/3/2026): prefer krefwatch's copy, else pull directly.
if valid_csv "$KREF_GEN_CSV" && [ "$(( $(date +%s) - $(stat -f %m "$KREF_GEN_CSV") ))" -lt 86400 ]; then
  echo "using krefwatch general CSV ($KREF_GEN_CSV)"; cp "$KREF_GEN_CSV" "$DEST_GEN"
else
  echo "pulling KREF general directly"
  encg=$(python3 -c "import urllib.parse; print(urllib.parse.quote('11/3/2026 00:00:00'))")
  okg=0
  for a in 1 2 3 4 5; do
    curl -s --max-time 600 "https://secure.kentucky.gov/kref/publicsearch/ExportContributors?ElectionDate=${encg}&ContributionSearchType=All" -o "$DEST_GEN.tmp"
    if [ -s "$DEST_GEN.tmp" ] && head -c 18 "$DEST_GEN.tmp" | grep -q '"To Organization"'; then mv "$DEST_GEN.tmp" "$DEST_GEN"; okg=1; break; fi
    echo "attempt $a: KREF bad response (general), retry in 60s"; rm -f "$DEST_GEN.tmp"; sleep 60
  done
  [ "$okg" = 1 ] || { echo "ABORT: KREF never returned valid general CSV"; exit 1; }
fi

# Keep only the CSVs we just wrote; the generator merges every export_contributor_*.csv.
find "$ROOT" -maxdepth 1 -name 'export_contributor_*.csv' ! -name "$(basename "$DEST")" ! -name "$(basename "$DEST_GEN")" -delete 2>/dev/null || true

node public/data/filter-lexington-urban.js || { echo "ABORT: generator failed"; exit 1; }

if git diff --quiet -- public/data/2026-lfucg-primary-contributions.json; then
  echo "no data change; nothing to deploy"; exit 0
fi
git add public/data/2026-lfucg-primary-contributions.json
git -c user.name="Paul Oliva" -c user.email="paulmoliva@gmail.com" \
    commit -m "refresh 2026 lfucg data (auto $(date -u +%F))" || { echo "commit failed"; exit 1; }
git push origin main && echo "pushed -> Amplify will build & deploy"
echo "=== done $(date -u +%FT%TZ) ==="
