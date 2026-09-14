#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TARGETS=(
  "$ROOT_DIR/sidebar/sidebar.js"
  "$ROOT_DIR/sidebar/sidebar.html"
  "$ROOT_DIR/sidebar/welcome.html"
)

# Only block hardcoded shipped defaults/promotions.
# User-created bookmarks/quick-sites are stored in browser storage and are intentionally allowed.
if rg -n -i "github\\.com|https?://github|GitHub" "${TARGETS[@]}" >/dev/null; then
  echo "❌ Found hardcoded GitHub promotional/default entry in shipped UI files."
  echo "   Remove GitHub references from default quick sites, default bookmarks, or promo links."
  rg -n -i "github\\.com|https?://github|GitHub" "${TARGETS[@]}"
  exit 1
fi

echo "✅ Passed: no hardcoded GitHub promo/default entries in shipped UI files."
