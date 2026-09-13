#!/usr/bin/env bash
# Run a claims file through gate-facts.sh.
#
# gate-facts.sh lives in the second-brain vault, NOT in this repo, and it is not
# vendored here on purpose: two copies of one reader is two copies of one bug,
# and the second copy is the one nobody remembers to fix.
#
# The consequence, stated rather than hidden: this script CANNOT run without the
# vault on disk. When it cannot find the checker it exits 2 and says so. Read
# that as "nothing was checked", never as "nothing is wrong". It must never
# return 0 by default, because a checker that reports a clean run when it did
# not run is the exact failure the claims file exists to prevent.
set -u

CLAIMS="${1:-tests/claims/grind.claims}"

find_gate() {
  if [ -n "${GATE_FACTS:-}" ]; then printf '%s' "$GATE_FACTS"; return; fi
  local c
  for c in \
    "$HOME/second-brain/.claude/tools/gate-facts.sh" \
    "/home/user/second-brain/.claude/tools/gate-facts.sh" \
    "../second-brain/.claude/tools/gate-facts.sh" \
    "/g/My Drive/Second Brain 7 12/.claude/tools/gate-facts.sh"
  do
    [ -f "$c" ] && { printf '%s' "$c"; return; }
  done
}

GATE="$(find_gate)"
if [ -z "$GATE" ] || [ ! -f "$GATE" ]; then
  echo "claims: CANNOT CHECK - gate-facts.sh not found."
  echo "Set GATE_FACTS to its path in the second-brain vault, e.g."
  echo "  GATE_FACTS=/path/to/second-brain/.claude/tools/gate-facts.sh npm run test:claims"
  echo "This is not a pass. No claim in $CLAIMS was evaluated."
  exit 2
fi

[ -f "$CLAIMS" ] || { echo "claims: CANNOT CHECK - no such claims file: $CLAIMS"; exit 2; }

# The rendered-page rows read dist/. A stale or missing dist/ is reported by
# gate-facts.sh itself (REFUTED on the identity rows, CANNOT CHECK on a missing
# file), so this script does not second-guess it - it just says where to look.
[ -d dist ] || echo "note: dist/ is absent. Run 'npm run build && npm run prerender' first."

bash "$GATE" "$CLAIMS"
rc_claims=$?

# The bundle runs here too, and deliberately not as a separate command. The
# claims file cannot name dist/assets/index-<contenthash>.js, so a green run
# over the six HTML pages leaves the JavaScript every visitor downloads
# unchecked - and a copy change behind an interaction lands there and on no
# page at all (M9 in grind-mutants.sh). Splitting this into a second npm script
# nobody remembers to run would make a green here mean less than it says.
echo
bash "$(dirname "$0")/bundle-check.sh" "$CLAIMS"
rc_bundle=$?

# Worst exit wins, and CANNOT CHECK (2) outranks REFUTED (1): "nothing was
# checked" is a worse answer than "something is wrong", because only one of
# them gets looked at.
echo
if [ "$rc_claims" = 2 ] || [ "$rc_bundle" = 2 ]; then
  echo "OVERALL: CANNOT CHECK (claims $rc_claims, bundle $rc_bundle). This is not a pass."
  exit 2
fi
if [ "$rc_claims" != 0 ] || [ "$rc_bundle" != 0 ]; then
  echo "OVERALL: REFUTED (claims $rc_claims, bundle $rc_bundle)."
  exit 1
fi
echo "OVERALL: claims and bundle both clean."
exit 0
