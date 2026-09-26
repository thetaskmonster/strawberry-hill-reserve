#!/usr/bin/env bash
# Proof that tests/claims/barred.claims CAN FAIL.
#
# Same discipline as grind-mutants.sh, smaller: snapshot what will be touched,
# plant one violation of the exact shape each section names, require exactly
# that row to refute, restore byte for byte in an EXIT trap. Cases that only
# touch dist/ do not rebuild; the one source case does, because a copy change
# has to be watched reaching the rendered page and the bundle.
#
# Needs a built and prerendered dist/ to start from, and the vault's
# gate-facts.sh (see run.sh). CHROMIUM_EXECUTABLE for the rebuild case.
#
#   npm run test:claims:barred:mutants
set -u
cd "$(dirname "$0")/../.." || exit 9
ROOT="$PWD"
CLAIMS=tests/claims/barred.claims
PAGES="dist/index.html dist/story.html dist/wholesale.html dist/faq.html dist/terms.html dist/contact.html"
SOURCES="src/content/legal.ts"
TOUCHED="$PAGES $SOURCES"

EXPECT_TOTAL=$(awk '/^#/{next} /^[[:space:]]*$/{next} {n++} END{print n+0}' "$CLAIMS")
[ "$EXPECT_TOTAL" -ge 2 ] || { echo "ABORT: only $EXPECT_TOTAL claim row(s)"; exit 9; }
echo "claim rows counted in $CLAIMS: $EXPECT_TOTAL"

SNAP="$(mktemp -d)" || exit 9
OUT="$SNAP/gate.out"
restore() {
  local f
  if [ -d "$SNAP/dist" ]; then rm -rf "$ROOT/dist"; cp -a "$SNAP/dist" "$ROOT/dist"; fi
  for f in $TOUCHED; do [ -f "$SNAP/snap/$f" ] && cp "$SNAP/snap/$f" "$ROOT/$f"; done
}
trap 'restore; rm -rf "$SNAP"' EXIT
for f in $TOUCHED; do
  [ -s "$f" ] || { echo "ABORT: fixture missing or empty before we start: $f (build and prerender first)"; exit 9; }
  mkdir -p "$SNAP/snap/$(dirname "$f")"; cp "$f" "$SNAP/snap/$f"
done
cp -a dist "$SNAP/dist" || exit 9

fails=0; ran=0
run_gate() { bash tests/claims/run.sh "$CLAIMS" > "$OUT" 2>&1; echo $?; }
expect() { # name expected_exit required_pattern
  local name="$1" exp="$2" pat="$3" rc ok=1
  ran=$((ran+1)); rc=$(run_gate)
  [ "$rc" = "$exp" ] || ok=0
  [ -n "$pat" ] && { grep -qE "$pat" "$OUT" || ok=0; }
  if [ "$ok" = 1 ]; then echo "PASS  $name  (exit $rc)"
  else echo "FAIL  $name  (exit $rc, wanted $exp; pattern: $pat)"; grep -E 'REFUTED|CANNOT|VERDICT' "$OUT" | head -8; fails=$((fails+1)); fi
}
check_restored() {
  local f bad=0
  for f in $TOUCHED; do cmp -s "$f" "$SNAP/snap/$f" || { echo "ABORT: $f differs from the pre-harness snapshot"; bad=1; }; done
  [ "$bad" = 0 ] || exit 9
}
rebuild() {
  if npm run build >"$SNAP/build.log" 2>&1 && npm run prerender >>"$SNAP/build.log" 2>&1; then return 0; fi
  tail -20 "$SNAP/build.log"; return 1
}

echo "=== BASELINE: the unmutated tree must be all green ==="
expect "baseline" 0 "VERDICT: all $EXPECT_TOTAL mechanical claims verified"
[ "$fails" = 0 ] || { echo "ABORT: baseline is not green"; exit 9; }

echo; echo "=== B1  'single estate' on a rendered page ==="
printf '<p>From a single estate above the clouds.</p>\n' >> dist/story.html
# The gate echoes the claim row, so the pattern text it prints is the literal
# "[Ss]ingle"; a regex has to match those bracket characters, same as the
# "Tt.ins" trick in grind-mutants.sh. The first version of this harness used
# `[Ss]ingle` here and reported FAIL on a refusal that had happened.
expect "B1 single estate is refuted on story" 1 'REFUTED.*dist/story\.html.*Ss.ingle'
restore; check_restored

echo; echo "=== B2  'traceable to the lot' in a meta description ==="
sed -i 's/<meta name="description" content="/<meta name="description" content="Traceable to the lot. /' dist/index.html
grep -q 'Traceable to the lot' dist/index.html || { echo "ABORT: B2 did not plant"; exit 9; }
expect "B2 traceable-to in meta is refuted on index" 1 'REFUTED.*dist/index\.html.*Tt.raceable'
restore; check_restored

echo; echo "=== B3  a bare 'Certified' heading, the shape found live on 2026-09-25 ==="
printf '<h3>Certified, checkable</h3>\n' >> dist/wholesale.html
expect "B3 bare certified is refuted on wholesale" 1 'REFUTED.*dist/wholesale\.html.*ertified'
restore; check_restored

echo; echo "=== B4  NEGATIVE CONTROL: 'JACRA-certified' must NOT refute ==="
printf '<p>JACRA-certified, attributed, is sayable.</p>\n' >> dist/faq.html
expect "B4 the attributed form does not cry wolf" 0 "VERDICT: all $EXPECT_TOTAL mechanical claims verified"
restore; check_restored

echo; echo "=== B5  the footer build note comes back ==="
printf '<p>Photography is representative; named-estate shots are labeled placeholders.</p>\n' >> dist/index.html
expect "B5 build note is refuted (both rows)" 1 'REFUTED.*dist/index\.html'
restore; check_restored

echo; echo "=== B6  a policy page loses its footer link ==="
sed -i 's|href="/terms"|href="/term"|' dist/index.html
expect "B6 missing terms link is refuted" 1 'REFUTED.*dist/index\.html.*href'
restore; check_restored

echo; echo "=== B7  a policy page is empty (identity row) ==="
: > dist/terms.html
expect "B7 empty terms page is refuted by identity, not passed by absence" 1 'REFUTED.*file-contains \| dist/terms\.html'
restore; check_restored

echo; echo "=== B8  SOURCE: barred copy written into legal.ts reaches the rendered page and the bundle ==="
sed -i 's/We sell coffee\./We sell coffee, traceable to the lot./' src/content/legal.ts
grep -q 'traceable to the lot' src/content/legal.ts || { echo "ABORT: B8 did not plant"; exit 9; }
if rebuild; then
  expect "B8 source change is refuted on the rendered terms page" 1 'REFUTED.*dist/terms\.html'
  if grep -qE 'REFUTED +count [1-9].*Tt.raceable' "$OUT"; then
    echo "PASS  B8b the bundle saw it too"; ran=$((ran+1))
  else
    echo "FAIL  B8b the bundle did not refute"; ran=$((ran+1)); fails=$((fails+1))
  fi
else
  echo "FAIL  B8 rebuild failed (CHROMIUM_EXECUTABLE=${CHROMIUM_EXECUTABLE:-unset})"; ran=$((ran+1)); fails=$((fails+1))
fi
restore; rebuild >/dev/null 2>&1 || true; check_restored

echo
echo "=== RESULT: $ran cases, $fails failed ==="
[ "$fails" = 0 ]
