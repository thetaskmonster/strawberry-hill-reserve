#!/usr/bin/env bash
# The JavaScript bundle is a surface the claims file cannot reach.
#
# Vite writes dist/assets/index-<contenthash>.js, and the hash changes on every
# build, so no claims row can name the path. But the copy ships in the bundle as
# well as in the prerendered HTML, and the two are NOT the same surface: a
# control inside the PRESALE_MODE === "live" branch compiles into the bundle
# while rendering on none of the six HTML pages. That case is M4 in
# grind-mutants.sh, and it is exactly the gap this script covers.
#
# THE REGEXES ARE NOT RETYPED HERE. They are read out of grind.claims, from the
# rows that already apply them to dist/reserve.html. Two copies of one pattern is
# two copies of one bug, and the second copy is the one nobody remembers to fix.
#
# Refuses rather than passing quietly when it cannot do its job: no claims file,
# no extractable patterns, no bundle, or more than one bundle.
set -u
cd "$(dirname "$0")/../.." || exit 2
CLAIMS="${1:-tests/claims/grind.claims}"

[ -f "$CLAIMS" ] || { echo "bundle-check: CANNOT CHECK - no claims file at $CLAIMS"; exit 2; }

# Field 3 of every grep-count row whose target is dist/reserve.html.
mapfile -t PATTERNS < <(awk -F' \\| ' '$1=="grep-count" && $2=="dist/reserve.html" {print $3}' "$CLAIMS")
if [ "${#PATTERNS[@]}" -lt 2 ]; then
  echo "bundle-check: CANNOT CHECK - expected at least 2 patterns from $CLAIMS, got ${#PATTERNS[@]}."
  echo "Nothing was checked. Fix the claims file rather than reading this as a pass."
  exit 2
fi

shopt -s nullglob
BUNDLES=(dist/assets/index-*.js)
if [ "${#BUNDLES[@]}" -eq 0 ]; then
  echo "bundle-check: CANNOT CHECK - no dist/assets/index-*.js. Run 'npm run build' first."
  exit 2
fi
if [ "${#BUNDLES[@]}" -gt 1 ]; then
  echo "bundle-check: CANNOT CHECK - ${#BUNDLES[@]} bundles matched, so 'the bundle' is ambiguous:"
  printf '  %s\n' "${BUNDLES[@]}"
  echo "A stale build left behind is the usual cause. Remove dist/ and rebuild."
  exit 2
fi
B="${BUNDLES[0]}"
[ -s "$B" ] || { echo "bundle-check: CANNOT CHECK - $B is empty"; exit 2; }

# Identity before absence, same rule as section A of the claims file: an absence
# proves nothing about a file that is not the bundle under test.
if ! grep -qF 'Three sealed 2 oz packages' "$B"; then
  echo "bundle-check: REFUTED - $B does not carry the gift box copy, so it is not"
  echo "the bundle this check is for (stale, or the copy changed without this check)."
  exit 1
fi

echo "bundle-check: $B  ($(wc -c < "$B") bytes)"
bad=0
for p in "${PATTERNS[@]}"; do
  n=$(grep -cE -- "$p" "$B" || true)
  if [ "$n" = "0" ]; then echo "  VERIFIED  count 0  $p"
  else echo "  REFUTED   count $n  $p"; bad=1; fi
done
[ "$bad" = 0 ] || { echo "bundle-check: VERDICT - the bundle carries something the pages do not."; exit 1; }
echo "bundle-check: VERDICT - ${#PATTERNS[@]} patterns, all absent from the bundle."
