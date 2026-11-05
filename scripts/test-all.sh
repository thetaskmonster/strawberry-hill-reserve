#!/usr/bin/env bash
# Run both site suites in the one order that works: build, gifting, prerender,
# claims. `npm run test:all`.
#
# WHY THE ORDER MATTERS. test:gifting runs `npm run build` itself (it refuses
# to test a bundle it did not just build). `vite build` empties dist/, which
# deletes the per-route HTML that `npm run prerender` wrote: dist/reserve.html,
# dist/faq.html and the rest. test:claims reads exactly those files. So
# running claims after gifting, without a prerender in between, reports
# CANNOT CHECK on every per-route row and REFUTED on the homepage identity row
# (measured 2026-10-20: 19 CANNOT CHECK, 1 REFUTED, out of 38). That is a
# sequencing fault, not a site fault, and this script removes it:
#
#   1. test:gifting  builds dist/ and tests that exact build (its digest gate)
#   2. prerender     renders every route into that same dist/
#   3. a presence check that the route HTML the claims read is really there
#   4. test:claims   reads the prerendered dist/
#
# Exit code: 0 only when every step is clean. "Nothing was checked" outranks
# "something is wrong", the same rule tests/claims/run.sh uses, so any step
# that could not check makes the whole run exit 2; otherwise any failure is 1.
#
# Chromium: prerender and the gifting suite both honour CHROMIUM_EXECUTABLE.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
cd "$REPO" || exit 2

cannot=0
failed=0
summary=""
note() { summary="${summary}${1}"$'\n'; }

echo "=== 1/4 test:gifting (builds dist/, then tests that build)"
bash tests/run-gifting.sh
rc_gift=$?
case "$rc_gift" in
  0) note "gifting   PASS" ;;
  3) note "gifting   CANNOT CHECK (rc 3)"; cannot=1 ;;
  *) note "gifting   FAIL (rc $rc_gift)"; failed=1 ;;
esac

if [ ! -f dist/index.html ]; then
  echo "dist/index.html is missing after the gifting build. Nothing below can run."
  note "prerender NOT RUN (no build)"
  note "claims    NOT RUN (no build)"
  printf '\n=== test:all summary\n%s' "$summary"
  echo "OVERALL: CANNOT CHECK. This is not a pass."
  exit 2
fi

echo
echo "=== 2/4 prerender (writes the per-route HTML into the build just tested)"
node scripts/prerender.mjs
rc_pre=$?
if [ "$rc_pre" -eq 0 ]; then note "prerender PASS"; else note "prerender FAIL (rc $rc_pre)"; cannot=1; fi

echo
echo "=== 3/4 route HTML present"
# The pages tests/claims/grind.claims reads. If one is missing, say so here
# rather than leave it to 19 CANNOT CHECK lines further down.
missing=0
for f in index story reserve gifting wholesale faq; do
  if [ -s "dist/$f.html" ]; then echo "  present  dist/$f.html"; else echo "  MISSING  dist/$f.html"; missing=1; fi
done
if [ "$missing" -eq 0 ]; then note "routes    PRESENT"; else note "routes    MISSING"; cannot=1; fi

echo
echo "=== 4/4 test:claims (reads the prerendered dist/)"
bash tests/claims/run.sh
rc_claims=$?
case "$rc_claims" in
  0) note "claims    PASS" ;;
  2) note "claims    CANNOT CHECK (rc 2)"; cannot=1 ;;
  *) note "claims    REFUTED (rc $rc_claims)"; failed=1 ;;
esac

printf '\n=== test:all summary\n%s' "$summary"
if [ "$cannot" -eq 1 ]; then echo "OVERALL: CANNOT CHECK. This is not a pass."; exit 2; fi
if [ "$failed" -eq 1 ]; then echo "OVERALL: FAIL."; exit 1; fi
echo "OVERALL: gifting and claims both clean, on one build, in deploy order."
exit 0
