#!/usr/bin/env bash
# Proof that tests/claims/grind.claims CAN FAIL.
#
# A claims file full of "count is zero" rows is green on an empty repo, on a
# 404, and on a stale build. Green means nothing until each row has been watched
# refusing a defect of the exact shape it names. This harness plants ten of them,
# one at a time, and requires a specific verdict for each.
#
# IT MUTATES THE WORKING TREE, deliberately and on purpose, which is the one
# thing a diagnostic must never do by accident. So: it snapshots every file it
# will touch before touching anything, restores from that snapshot in an EXIT
# trap (so an abort, a failed build, or a Ctrl-C restores too), and verifies the
# restore byte for byte before it reports. It compares against ITS OWN snapshot,
# not against git HEAD, because a branch under review legitimately carries edits.
#
# Run it on a tree you have committed or can afford to lose anyway.
#
#   bash tests/claims/grind-mutants.sh
#
# Needs the vault's gate-facts.sh (see tests/claims/run.sh) and a working
# Chromium for the prerender, via CHROMIUM_EXECUTABLE.
set -u
cd "$(dirname "$0")/../.." || exit 9
ROOT="$PWD"

CLAIMS=tests/claims/grind.claims
TOUCHED="src/content/store.ts src/pages/Product.tsx dist/reserve.html"
EXPECT_TOTAL=21         # claims in the file; a drift here is a real finding

SNAP="$(mktemp -d)" || { echo "ABORT: no temp dir"; exit 9; }
OUT="$SNAP/gate.out"
restore() {
  local f
  for f in $TOUCHED; do
    [ -f "$SNAP/snap/$f" ] && { mkdir -p "$(dirname "$ROOT/$f")"; cp "$SNAP/snap/$f" "$ROOT/$f"; }
  done
}
trap 'restore; rm -rf "$SNAP"' EXIT

for f in $TOUCHED; do
  [ -f "$f" ] || { echo "ABORT: fixture missing before we start: $f (build and prerender first)"; exit 9; }
  [ -s "$f" ] || { echo "ABORT: fixture is empty before we start: $f"; exit 9; }
  mkdir -p "$SNAP/snap/$(dirname "$f")"; cp "$f" "$SNAP/snap/$f"
done

fails=0; ran=0
rebuild() { npm run build >/dev/null 2>&1 && npm run prerender >/dev/null 2>&1; }
run_gate() { bash tests/claims/run.sh "$CLAIMS" > "$OUT" 2>&1; echo $?; }

expect() { # name expected_exit required_pattern
  local name="$1" exp="$2" pat="$3" rc ok=1
  ran=$((ran+1)); rc=$(run_gate)
  [ "$rc" = "$exp" ] || ok=0
  [ -n "$pat" ] && { grep -qE "$pat" "$OUT" || ok=0; }
  if [ "$ok" = 1 ]; then echo "PASS  $name  (exit $rc)"
  else
    echo "FAIL  $name  (exit $rc, wanted $exp; pattern: $pat)"
    grep -E 'REFUTED|CANNOT|VERDICT' "$OUT" | head -8
    fails=$((fails+1))
  fi
}

check_restored() {
  local f bad=0
  for f in $TOUCHED; do cmp -s "$f" "$SNAP/snap/$f" || { echo "ABORT: $f differs from the pre-harness snapshot"; bad=1; }; done
  [ "$bad" = 0 ] || exit 9
}

echo "=== BASELINE: the unmutated tree must be all green ==="
expect "baseline" 0 "VERDICT: all $EXPECT_TOTAL mechanical claims verified"
[ "$fails" = 0 ] || { echo "ABORT: baseline is not green, so no mutant below would mean anything."; exit 9; }

echo; echo "=== M1  recasing in source: GRIND_OPTIONS in src/content/store.ts ==="
echo '// mutant' >> src/content/store.ts
printf 'export const GRIND_OPTIONS = ["whole", "ground"];\n' >> src/content/store.ts
grep -q 'GRIND_OPTIONS' src/content/store.ts || { echo "ABORT: M1 fixture did not plant"; exit 9; }
expect "M1 recased constant is refuted" 1 'REFUTED.*src/content/store\.ts'
restore; check_restored

echo; echo "=== M2  rewording on the RENDERED page: 'never pre-ground' ==="
printf '<p>Sold as whole beans, never pre-ground.</p>\n' >> dist/reserve.html
expect "M2 reworded grind claim is refuted" 1 'REFUTED.*dist/reserve\.html'
restore; check_restored

echo; echo "=== M3  mid-identifier casing: setGrind (a word boundary would miss this) ==="
printf 'const [g, setGrind] = useState("whole");\n' >> src/pages/Product.tsx
expect "M3 setGrind is refuted" 1 'REFUTED.*src/pages/Product\.tsx'
restore; check_restored

echo; echo "=== M4  control re-added INSIDE the PRESALE_MODE live branch ==="
echo "    (renders on no page, so only the SOURCE rows can see it)"
python3 - <<'PY'
p='src/pages/Product.tsx'
s=open(p,encoding='utf-8').read()
i=s.index('PRESALE_MODE === "live" && (')
j=s.index('>',s.index('<>',i))+1
open(p,'w',encoding='utf-8').write(s[:j]+'\n              <button aria-label="Grind">Ground</button>\n'+s[j:])
PY
grep -q 'aria-label="Grind"' src/pages/Product.tsx || { echo "ABORT: M4 fixture did not plant"; exit 9; }
rebuild || { echo "ABORT: M4 rebuild failed, so the dist half of this case proves nothing"; exit 9; }
rendered=0
for f in dist/*.html; do
  n=$(grep -cE '(^|[^a-zA-Z])([Gg][Rr][Ii][Nn][Dd]|[Gg][Rr][Oo][Uu][Nn][Dd]|[Ww]hole [Bb]ean)' "$f" || true)
  rendered=$((rendered + n))
done
echo "    rendered pages mentioning grind after the rebuild: $rendered"
expect "M4 live-branch control is refuted by a SOURCE row" 1 'REFUTED.*src/pages/Product\.tsx'
if [ "$rendered" = "0" ] && ! grep -qE 'REFUTED.*dist/' "$OUT"; then
  echo "PASS  M4b the rendered rows could NOT see it - this is why the source rows exist"
else
  echo "FAIL  M4b expected the rendered rows to be blind here (rendered=$rendered)"; fails=$((fails+1))
fi
ran=$((ran+1))
restore; rebuild; check_restored

echo; echo "=== M5  restore 'tins' to the gift box blurb ==="
sed -i 's/Three sealed 2 oz packages in a boxed set/Three sealed 2 oz tins in a boxed set/' src/content/store.ts
grep -q 'Three sealed 2 oz tins in a boxed set' src/content/store.ts || { echo "ABORT: M5 fixture did not plant"; exit 9; }
rebuild || { echo "ABORT: M5 rebuild failed"; exit 9; }
expect "M5 tins is refuted on the rendered page" 1 'REFUTED.*dist/reserve\.html.*Tt.ins'
expect "M5 tins is refuted in source too" 1 'REFUTED.*src/content/store\.ts.*Tt.ins'
restore; rebuild; check_restored

echo; echo "=== M6  NEGATIVE CONTROL: a new COMMENT about grind must NOT refute ==="
printf '// A later note about grind, whole bean and ground coffee.\n' >> src/pages/Product.tsx
expect "M6 a comment does not cry wolf" 0 "VERDICT: all $EXPECT_TOTAL mechanical claims verified"
restore; check_restored

echo; echo "=== M7a EMPTY fixture: a truncated page must not pass on absence ==="
: > dist/reserve.html
expect "M7a empty page is refuted by the identity rows" 1 'REFUTED.*file-contains \| dist/reserve\.html'
restore; check_restored

echo; echo "=== M7b MISSING fixture: a removed page is CANNOT CHECK, not a pass ==="
mv dist/reserve.html "$SNAP/gone.html"
expect "M7b missing page is CANNOT CHECK" 2 'COULD NOT BE CHECKED'
mv "$SNAP/gone.html" dist/reserve.html; check_restored

echo; echo "=== FINAL: green again on the restored tree ==="
expect "restored baseline" 0 "VERDICT: all $EXPECT_TOTAL mechanical claims verified"

echo
echo "cases run: $ran   failures: $fails"
[ "$fails" = 0 ] || exit 1
