#!/usr/bin/env bash
# Proof that tests/claims/grind.claims CAN FAIL.
#
# A claims file full of "count is zero" rows is green on an empty repo, on a
# 404, and on a stale build. Green means nothing until each row has been watched
# refusing a defect of the exact shape it names. This harness does that in two
# passes: named cases for the shapes worth explaining, then a sweep that plants
# a minimal violation for EVERY count row and requires that row, and only that
# row, to refute.
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
#   npm run test:claims:mutants
#
# Needs the vault's gate-facts.sh (see tests/claims/run.sh) and a working
# Chromium for the prerender, via CHROMIUM_EXECUTABLE.
set -u
cd "$(dirname "$0")/../.." || exit 9
ROOT="$PWD"

CLAIMS=tests/claims/grind.claims
PAGES="dist/index.html dist/story.html dist/reserve.html dist/gifting.html dist/wholesale.html dist/faq.html"
DIALOG=src/components/OriginWaitlistDialog.tsx
SOURCES="src/pages/Product.tsx src/content/site.ts src/content/store.ts src/lib/checkout.ts src/store/cart.tsx worker/src/index.ts worker/worker.dashboard.js"
TOUCHED="$PAGES $SOURCES $DIALOG"
EXPECT_TOTAL=30          # claim rows in the file; drift here is a real finding

SNAP="$(mktemp -d)" || { echo "ABORT: no temp dir"; exit 9; }
OUT="$SNAP/gate.out"
restore() {
  local f
  # dist/ is restored WHOLESALE, not file by file. A per-file restore only puts
  # back what this harness knows it touched, and `vite build` empties the whole
  # directory - so an aborted rebuild silently took dist/sitemap.xml with it and
  # nothing said a word, because dist/ is gitignored and git status stayed clean.
  if [ -d "$SNAP/dist" ]; then
    rm -rf "$ROOT/dist"
    cp -a "$SNAP/dist" "$ROOT/dist"
  fi
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

# The rebuild keeps its output. A build that fails silently gets blamed on
# whichever mutant happened to be planted at the time, which is an excuse with
# no evidence behind it - and this harness lost a run to exactly that, reporting
# "M4 rebuild failed" when what was actually missing was a Chromium for the
# prerender. On failure, say what the build said.
rebuild() {
  if npm run build >"$SNAP/build.log" 2>&1 && npm run prerender >>"$SNAP/build.log" 2>&1; then
    return 0
  fi
  echo "--- last 20 lines of the failed build ---"
  tail -20 "$SNAP/build.log"
  echo "-----------------------------------------"
  return 1
}

# PREFLIGHT: rebuild the UNMUTATED tree before any case runs. If the build or
# the prerender cannot run here at all, that is an environment finding and it
# belongs at the top, named, rather than surfacing four cases in wearing a
# mutant's name. The prerender needs a Chromium; point CHROMIUM_EXECUTABLE at
# one if it is not on the default path.
echo "=== PREFLIGHT: the unmutated tree must build and prerender ==="
if ! rebuild; then
  echo "ABORT: the build or prerender failed on the UNMUTATED tree, so no mutant"
  echo "       result from this run would mean anything. This is an environment"
  echo "       failure, not a claims failure."
  echo "       CHROMIUM_EXECUTABLE=${CHROMIUM_EXECUTABLE:-<unset>}"
  echo
  echo "       AND dist/ IS NOW INCOMPLETE. The build emptied it before failing,"
  echo "       and this abort is too early for the dist snapshot below to exist,"
  echo "       so there is nothing to restore it from. dist/ is gitignored, so"
  echo "       git status will look clean and say nothing about this."
  echo "       Rebuild before you deploy anything out of dist/."
  exit 9
fi
echo "PREFLIGHT ok"

# The preflight just rewrote dist/, so re-snapshot the rendered pages against
# what the harness will actually restore to. Without this the restore check
# compares a freshly built page to one built before the harness started, and a
# build that is not byte-reproducible fails the restore for no reason.
for f in $PAGES; do
  [ -f "$f" ] || { echo "ABORT: preflight produced no $f"; exit 9; }
  [ -s "$f" ] || { echo "ABORT: preflight produced an empty $f"; exit 9; }
  cp "$f" "$SNAP/snap/$f"
done
cp -a dist "$SNAP/dist" || { echo "ABORT: could not snapshot dist/"; exit 9; }
[ -f "$SNAP/dist/sitemap.xml" ] || echo "NOTE: preflight produced no dist/sitemap.xml"
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
note_pass() { echo "PASS  $1"; ran=$((ran+1)); }
note_fail() { echo "FAIL  $1"; ran=$((ran+1)); fails=$((fails+1)); }

check_restored() {
  local f bad=0
  for f in $TOUCHED; do cmp -s "$f" "$SNAP/snap/$f" || { echo "ABORT: $f differs from the pre-harness snapshot"; bad=1; }; done
  [ "$bad" = 0 ] || exit 9
}

echo "=== BASELINE: the unmutated tree must be all green ==="
expect "baseline" 0 "VERDICT: all $EXPECT_TOTAL mechanical claims verified"
[ "$fails" = 0 ] || { echo "ABORT: baseline is not green, so no mutant below would mean anything."; exit 9; }

echo; echo "=== M1  recasing in source: GRIND_OPTIONS in src/content/store.ts ==="
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

echo; echo "=== M3b regex literal in real code: /grind/.test(x) starts with a slash ==="
echo "    (an earlier version of the comment skip treated any leading / as a comment)"
printf '/grind/.test(navigator.userAgent);\n' >> src/pages/Product.tsx
expect "M3b leading-slash code is refuted" 1 'REFUTED.*src/pages/Product\.tsx'
restore; check_restored

echo; echo "=== M4  control re-added INSIDE the PRESALE_MODE live branch ==="
echo "    (renders on no page, so only the source rows and the bundle see it)"
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
for f in $PAGES; do
  n=$(grep -cE '(^|[^a-zA-Z])([Gg][Rr][Ii][Nn][Dd]|[Gg][Rr][Oo][Uu][Nn][Dd]|[Ww]hole [Bb]ean)' "$f" || true)
  rendered=$((rendered + n))
done
echo "    rendered pages mentioning grind after the rebuild: $rendered"
expect "M4 live-branch control is refuted by a SOURCE row" 1 'REFUTED.*src/pages/Product\.tsx'
if [ "$rendered" = "0" ] && ! grep -qE 'REFUTED.*dist/' "$OUT"; then
  note_pass "M4b the rendered rows could NOT see it - this is why the source rows exist"
else
  note_fail "M4b expected the rendered rows to be blind here (rendered=$rendered)"
fi
# NOT asserted here: that this plant reaches the JavaScript bundle. It does not.
# Vite folds PRESALE_MODE === "live" to false and tree-shakes the whole branch,
# measured by content hash - the bundle filename was byte-identical with and
# without this plant, and "Add to cart" counted 0 in it either way. The bundle
# is a real uncovered surface, but this is not the mutant that shows it. M9 is.
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

echo; echo "=== M7  fixture integrity: empty, then missing ==="
: > dist/reserve.html
expect "M7a empty reserve page is refuted by the identity rows" 1 'REFUTED.*file-contains \| dist/reserve\.html'
restore
: > dist/faq.html
expect "M7b empty faq page is refuted by its identity row" 1 'REFUTED.*file-contains \| dist/faq\.html'
restore
mv dist/reserve.html "$SNAP/gone.html"
expect "M7c missing page is CANNOT CHECK, not a pass" 2 'COULD NOT BE CHECKED'
mv "$SNAP/gone.html" dist/reserve.html; check_restored

echo; echo "=== M8  bundle-check refuses rather than passing when it cannot run ==="
mkdir -p "$SNAP/emptyclaims" && : > "$SNAP/emptyclaims/none.claims"
if bash tests/claims/bundle-check.sh "$SNAP/emptyclaims/none.claims" >/dev/null 2>&1; then
  note_fail "M8a bundle-check passed with no patterns to check"
else
  note_pass "M8a bundle-check is CANNOT CHECK with no extractable patterns"
fi
if bash tests/claims/bundle-check.sh "$SNAP/does-not-exist.claims" >/dev/null 2>&1; then
  note_fail "M8b bundle-check passed with no claims file"
else
  note_pass "M8b bundle-check is CANNOT CHECK with no claims file"
fi

echo; echo "=== M9  copy that ships in the BUNDLE but renders on no page ==="
echo "    A grind claim behind an interaction: it is in the JavaScript every"
echo "    visitor downloads, and in none of the six prerendered pages."
sed -i 's|<p className="eyebrow">Waitlist</p>|<p className="eyebrow">Waitlist. Whole bean only, never ground.</p>|' "$DIALOG"
grep -q 'Whole bean only, never ground' "$DIALOG" || { echo "ABORT: M9 fixture did not plant"; exit 9; }
rebuild || { echo "ABORT: M9 rebuild failed"; exit 9; }
inbundle=$(grep -coF 'Whole bean only, never ground' dist/assets/index-*.js 2>/dev/null || echo 0)
onpages=$(grep -lF 'Whole bean' $PAGES 2>/dev/null | wc -l | tr -d ' ')
echo "    phrase in the bundle: $inbundle    pages carrying it: $onpages"
# M9a asserts TWO things at once, and it has to, because run.sh now runs both
# checks and returns the worse of the two exits. So the combined exit is 1 here
# (the bundle refuted) while the CLAIMS half saw nothing at all. Asserting only
# the exit would hide which half fired, and asserting only the verdict line
# would not pin that the bundle caught what the claims file missed. Both, or
# this case stops meaning what its name says.
ran=$((ran+1)); rc=$(run_gate)
if [ "$rc" = "1" ] \
   && grep -qE "VERDICT: all $EXPECT_TOTAL mechanical claims verified" "$OUT" \
   && grep -qE '^OVERALL: REFUTED \(claims 0, bundle 1\)' "$OUT"; then
  echo "PASS  M9a the claims file is BLIND to it; only the bundle check fires  (exit $rc)"
else
  echo "FAIL  M9a expected claims-clean + bundle-refuted  (exit $rc)"
  sed -n 's/^\(claims:\|VERDICT:\|OVERALL:\)/  &/p' "$OUT"
  fails=$((fails+1))
fi
if [ "$inbundle" = "1" ] && [ "$onpages" = "0" ] && ! bash tests/claims/bundle-check.sh >/dev/null 2>&1; then
  note_pass "M9b bundle-check REFUTED it - the surface no other check reaches"
else
  note_fail "M9b expected bundle-only exposure (inbundle=$inbundle onpages=$onpages)"
fi
restore; rebuild; check_restored

echo; echo "=== SWEEP  every count row, planted individually ==="
echo "    A named case above exercises three files. This exercises all of them:"
echo "    each row gets a minimal violation and must be the ONLY row that refutes."
echo "    Each SOURCE row is planted TWICE, and both plants are required."
echo "    A plant starting with a letter only ever exercises the regex's SECOND"
echo "    alternative. The round-3 fix lives in the FIRST one, the leading-slash"
echo "    guard, and it was pinned on one file out of seven: reverting it on any"
echo "    of the other six left this whole suite green. A regex-literal plant is"
echo "    what closes that, and it is checked per row rather than once."
sweep_ran=0; sweep_fail=0; sweep_expected=0

sweep_plant() { # row target kind plant label
  local row="$1" target="$2" plant="$4" label="$5" rc nref
  sweep_expected=$((sweep_expected+1))
  printf '%s\n' "$plant" >> "$target"
  rc=$(run_gate)
  # Count from the SUMMARY line, not by grepping REFUTED: gate-facts.sh prints
  # every refuted row twice, once inline and once under FINDINGS, so a grep
  # count reads 2 for a single refutation. The sweep reported 0 of 26 pinned on
  # that reading, which was a defect in this assertion and not in the rows.
  nref=$(sed -n 's/^claims:.*REFUTED \([0-9][0-9]*\).*/\1/p' "$OUT")
  if [ "$rc" = "1" ] && [ "${nref:-x}" = "1" ] && grep -qF "$row" <(grep '^REFUTED' "$OUT"); then
    sweep_ran=$((sweep_ran+1))
  else
    echo "  FAIL  row not pinned by the $label plant: $target  exit=$rc refuted=$nref"
    sweep_fail=$((sweep_fail+1))
  fi
  cp "$SNAP/snap/$target" "$target"
}

while IFS= read -r row; do
  target=$(printf '%s' "$row" | awk -F' \\| ' '{print $2}')
  pattern=$(printf '%s' "$row" | awk -F' \\| ' '{print $3}')
  case "$pattern" in *'[Tt]ins'*) kind=tins ;; *) kind=grind ;; esac
  case "$target" in
    dist/*)
      [ "$kind" = tins ] && plant='<p>tins</p>' || plant='<p>Ground, whole bean, grind.</p>'
      sweep_plant "$row" "$target" "$kind" "$plant" "rendered"
      ;;
    *)
      # 1. starts with a letter: the regex's second alternative
      [ "$kind" = tins ] && plant='const boxFormat = "tins";' || plant='const grindMode = "ground";'
      sweep_plant "$row" "$target" "$kind" "$plant" "identifier"
      # 2. starts with a slash: the FIRST alternative, which is the round-3 fix.
      #    Revert the leading-slash guard on any source row and this plant stops
      #    refuting while the identifier plant above carries on passing.
      [ "$kind" = tins ] && plant='/tin/.test(x);' || plant='/grind/.test(x);'
      sweep_plant "$row" "$target" "$kind" "$plant" "regex-literal"
      ;;
  esac
done < <(grep '^grep-count' "$CLAIMS")
check_restored

# Reconcile what the loop consumed against what it was given. A row list that
# silently shrinks to nothing would otherwise report success.
dist_rows=$(grep '^grep-count' "$CLAIMS" | awk -F' \\| ' '{print $2}' | grep -c '^dist/')
src_rows=$(grep '^grep-count' "$CLAIMS" | awk -F' \\| ' '{print $2}' | grep -vc '^dist/')
want=$((dist_rows + 2 * src_rows))
if [ "$sweep_fail" = 0 ] && [ "$sweep_ran" = "$want" ] && [ "$sweep_expected" = "$want" ]; then
  note_pass "SWEEP $dist_rows rendered rows + $src_rows source rows x2 plants = $want, all observed refusing"
else
  note_fail "SWEEP $sweep_ran pinned of $sweep_expected run, expected $want, $sweep_fail not pinned"
fi

echo; echo "=== FINAL: green again on the restored tree ==="
expect "restored baseline" 0 "VERDICT: all $EXPECT_TOTAL mechanical claims verified"
bash tests/claims/bundle-check.sh >/dev/null 2>&1 && note_pass "bundle-check green on the restored tree" || note_fail "bundle-check not green on the restored tree"

echo
echo "cases run: $ran   failures: $fails"
[ "$fails" = 0 ] || exit 1
