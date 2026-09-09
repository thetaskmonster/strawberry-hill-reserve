#!/usr/bin/env bash
# Runs contract-live.sh against every answer shape in tests/contract-shapes.mjs
# and refuses if any one of them exits differently from the table there.
#
# WHAT THIS IS FOR. contract-live.sh talks to the live webhook, so it can only
# ever see the one answer the endpoint is giving today. This drives it against
# a local server serving the shapes that have actually gone wrong, so the
# result table quoted in tests/README.md is reproducible rather than a figure
# somebody wrote down once.
#
# IT COMPARES FIVE THINGS, NOT ONE, AND THAT IS THE POINT.
#
# The first version compared exit codes alone. Three of the four fixes it was
# advertised as covering do not change any exit code, so it printed a clean run
# on a tree with those three reverted -- while tests/README.md said it killed
# all four. That is a guard advertised wider than it is, shipped one layer above
# the guard the same commit was written to restore. Found by a proof gate, not
# by this script.
#
#   1. the EXIT CODE, against the expected table in the fixture module;
#   2. the VERDICT LINE COUNT, because a lost verdict line does not move the
#      exit code;
#   3. the FAILURE COUNT the verdict names, because deleting a whole branch can
#      leave the exit code alone and only change how many things failed;
#   4. a MATCH string pinning WHICH branch fired, because two branches can
#      report the same count;
#   5. the absence of U+FFFD, which is what per-chunk decoding produces on a
#      multibyte character landing on a chunk seam, also without moving it.
#
# 3 and 4 were added on 2026-09-09 after a gate found three rows that stayed
# green while the exact guard each named was deleted outright. This comment
# said THREE while listing four and running five, for one commit.
#
# THE MATCH IS TESTED AGAINST WHAT THE SCRIPT PRINTED, NOT AGAINST THE ECHOED
# BODY. contract-live.sh echoes the whole response body into the same stream,
# so a match string that also occurs in the fixture body was satisfied by the
# echo whatever branch fired -- true of 8 of the 24 shapes as first shipped,
# and proven by deleting the ONLY branch that prints `nested`'s match string
# and watching the match still pass. The body region is cut out below before
# the match is looked for. Without that cut, comparison 4 is decoration on a
# third of the table while every document claims it pins the branch.
#
# And it runs a second kind of case entirely: INTERPRETER behaviours, where a
# stub stands in for node. No answer shape can reach the guard that refuses a
# parser which ran and said nothing, because a real node always answers.
#
# THE FIXTURE SERVER PROVES IT IS THE FIXTURE SERVER. It answers a per-run
# nonce on a reserved route, and this script refuses unless it gets that exact
# token back. Without it, a leaked server left on the port from an earlier run
# -- which the EXIT trap does not clean up if the parent is killed -- answers
# every probe, the real server dies unheard on EADDRINUSE, and the whole matrix
# passes against a different process serving a different file while printing
# "behave as tests/contract-shapes.mjs says". Observed doing exactly that.
#
# Run it:  bash tests/contract-matrix.sh
# No network beyond localhost. It never touches the live endpoint or Airtable.
set -o pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PORT="${CONTRACT_MATRIX_PORT:-4310}"

NODE_BIN="${NODE_BIN:-node}"
command -v "$NODE_BIN" >/dev/null 2>&1 || {
  echo "CANNOT CHECK: no node on PATH, so neither the fixture server nor the"
  echo "check under test can run. Nothing was tested."
  exit 2
}

# The list of shapes comes out of the fixture module, never out of this script.
# Two copies of a list is two lists, and the second one is the one nobody
# remembers to update.
NAMES=$("$NODE_BIN" --input-type=module -e "
  const m = await import('file://$HERE/contract-shapes.mjs');
  const s = Object.keys(m.SHAPES), e = Object.keys(m.EXPECTED);
  const gap = s.filter(k => !e.includes(k)).concat(e.filter(k => !s.includes(k)));
  if (gap.length) { console.error('SHAPES and EXPECTED disagree on: ' + gap.join(', ')); process.exit(3); }
  console.log(s.join(' '));
" 2>&1) || {
  echo "CANNOT CHECK: could not read the shape list."
  echo "$NAMES"
  exit 2
}

# A FIXTURE THAT CAN VANISH WHILE THE TEST STILL PASSES IS NOT A TEST. If the
# list comes back empty this script would otherwise run zero cases and print a
# clean run, which is the exact silent guard it exists to be.
set -- $NAMES
TOTAL=$#
if [ "$TOTAL" -lt 10 ]; then
  echo "CANNOT CHECK: the shape list came back with $TOTAL entries, which is"
  echo "fewer than this matrix has ever had. Read that as the fixture being"
  echo "broken, not as a small suite."
  exit 2
fi

NONCE=$(od -An -N16 -tx1 /dev/urandom 2>/dev/null | tr -d ' \n')
if [ -z "$NONCE" ]; then
  echo "CANNOT CHECK: could not generate a nonce, so this run cannot prove the"
  echo "server answering it is its own."
  exit 2
fi

MATRIX_NONCE="$NONCE" "$NODE_BIN" --input-type=module -e "
  import http from 'node:http';
  const m = await import('file://$HERE/contract-shapes.mjs');
  const nonce = process.env.MATRIX_NONCE;
  http.createServer((req, res) => {
    const key = req.url.replace(/^\//, '');
    let b = ''; req.on('data', d => b += d).on('end', () => {
      if (key === '__whoami') {
        res.writeHead(200, {'Content-Type':'text/plain'});
        return res.end(nonce);
      }
      const hit = m.SHAPES[key];
      if (!hit) { res.writeHead(418, {'Content-Type':'text/plain'}); return res.end('unknown shape'); }
      res.writeHead(hit[0], {'Content-Type': hit[1]});
      res.end(hit[2]);
    });
  }).listen($PORT, '127.0.0.1');
" >/dev/null 2>&1 &
SERVER_PID=$!
OUT=$(mktemp 2>/dev/null) || { echo "CANNOT CHECK: could not create a temp file."; exit 2; }
JUDGED=$(mktemp 2>/dev/null) || { echo "CANNOT CHECK: could not create a temp file."; exit 2; }
STUBDIR=""
cleanup() {
  kill "$SERVER_PID" 2>/dev/null; wait "$SERVER_PID" 2>/dev/null
  rm -f "$OUT" "$JUDGED"
  [ -n "$STUBDIR" ] && rm -rf "$STUBDIR"
  return 0
}
trap cleanup EXIT

# A REACHABLE PORT IS NOT THIS SERVER. Require the nonce back, not a 200.
SAW=$(curl -s --retry 30 --retry-all-errors --retry-delay 1 --max-time 30 \
  -X POST "http://127.0.0.1:$PORT/__whoami" 2>/dev/null)
if [ "$SAW" != "$NONCE" ]; then
  echo "CANNOT CHECK: whatever is answering port $PORT is not this run's fixture"
  echo "server. Expected this run's nonce and got [${SAW:-nothing}]."
  echo "A stale server from an earlier run answers every probe while this run's"
  echo "own server dies unheard on EADDRINUSE, and every case would then be"
  echo "measured against a different process. Free the port and re-run."
  exit 2
fi

EXPECT_JSON=$("$NODE_BIN" --input-type=module -e "
  const m = await import('file://$HERE/contract-shapes.mjs');
  console.log(JSON.stringify(m.EXPECTED));
")

# One reader for the expectation row, so the three fields cannot drift apart.
# Prints: <exit> <failures-or-null> then the match string on its own line.
readwant() {
  printf '%s' "$EXPECT_JSON" | "$NODE_BIN" -e '
    const c=[];process.stdin.on("data",d=>c.push(d)).on("end",()=>{
      const o=JSON.parse(Buffer.concat(c).toString("utf8"))[process.argv[1]];
      if (!o) { process.stdout.write("? ?\n\n"); process.exit(0); }
      process.stdout.write(o.exit + " " + (o.failures === null ? "null" : o.failures) + "\n" + (o.match || "") + "\n");
    });' "$1"
}

RAN=0
BAD=0
for name in $NAMES; do
  W=$(readwant "$name")
  want=$(printf '%s' "$W" | sed -n '1p' | cut -d' ' -f1)
  wantf=$(printf '%s' "$W" | sed -n '1p' | cut -d' ' -f2)
  wantm=$(printf '%s' "$W" | sed -n '2p')
  # SYMMETRY WITH THE INTERPRETER SIDE, which has refused a case declaring no
  # match since it was written. This side merely skipped the comparison, so
  # emptying a shape's match string silently dropped it from five checks to
  # four -- on the row the README names as the motivating example.
  if [ -z "$wantm" ]; then
    echo "CANNOT CHECK: answer shape '$name' declares no match string, so"
    echo "nothing pins which branch fired for it. Give it one or remove the row."
    exit 2
  fi
  # THROUGH A PIPE, DELIBERATELY, AND NOT INTO THE FILE DIRECTLY.
  # node's stdout is synchronous when it is a file and asynchronous when it is
  # a pipe, and process.exit only discards pending writes in the second case.
  # Redirecting straight to $OUT made the verdict-line count below unable to
  # fail on the exact mutant it was added for -- the same "a check that cannot
  # fail" defect, one layer inside the fix for it. Measured: file -> mutant
  # passes, pipe -> mutant loses the line. `cat` is what makes it a pipe.
  GIFTING_ENDPOINT="http://127.0.0.1:$PORT/$name" bash "$HERE/contract-live.sh" 2>&1 \
    | cat >"$OUT"
  got=${PIPESTATUS[0]}
  RAN=$((RAN + 1))

  # A shape that reaches the parser must leave exactly one verdict line. A
  # shape refused before the parser (exit 2) must leave none. Counting this
  # is what makes a lost verdict line visible: the exit code does not move.
  VERDICTS=$(grep -c 'CONTRACT HOLDS\|CONTRACT FAILURE(S)' "$OUT")
  if [ "$wantf" = "null" ]; then WANT_V=0; else WANT_V=1; fi

  # How many failures the verdict names. "null" means no verdict line at all,
  # which is what a shape refused before the parser must produce.
  if grep -q '=== CONTRACT HOLDS ===' "$OUT"; then
    SAWF=0
  elif grep -q 'CONTRACT FAILURE(S)' "$OUT"; then
    SAWF=$(grep -oE '=== [0-9]+ CONTRACT FAILURE\(S\) ===' "$OUT" | grep -oE '[0-9]+' | head -1)
  else
    SAWF=null
  fi

  # U+FFFD is the replacement character. It appears only when something
  # decoded a multibyte character across a buffer boundary. Counted over the
  # WHOLE output, echoed body included, and it counts LINES carrying one rather
  # than characters -- which is what the message below says.
  MANGLED=$(grep -c $'\xef\xbf\xbd' "$OUT")

  # THE JUDGED STREAM: the output with the echoed response body cut out, so a
  # match string can only be satisfied by something the script itself printed.
  # The cut runs from the `  body:` line to the first line the parser or the
  # shell verdict block emits. It is deliberately a region and not a single
  # line, because a body carrying a newline prints across several lines and
  # only the first one is prefixed. A shape refused before the body is echoed
  # never enters the cut at all.
  awk '
    /^  body:/ { skip = 1 }
    /^(PASS|FAIL|=== |CANNOT CHECK)/ { skip = 0 }
    !skip
  ' "$OUT" >"$JUDGED"

  WHY=""
  [ "$want" = "$got" ]        || WHY="expected exit $want, got $got"
  [ "$VERDICTS" = "$WANT_V" ] || WHY="${WHY:+$WHY; }expected $WANT_V verdict line(s), saw $VERDICTS"
  [ "$wantf" = "$SAWF" ]      || WHY="${WHY:+$WHY; }expected $wantf failure(s), saw $SAWF"
  if ! grep -qF -- "$wantm" "$JUDGED"; then
    WHY="${WHY:+$WHY; }output never says [$wantm], so a different branch fired"
  fi
  [ "$MANGLED" = "0" ]        || WHY="${WHY:+$WHY; }$MANGLED line(s) carry a replacement character"

  if [ -z "$WHY" ]; then
    printf '  ok    %-10s exit %s\n' "$name" "$got"
  else
    printf '  WRONG %-10s %s\n' "$name" "$WHY"
    BAD=$((BAD + 1))
  fi
done

# INTERPRETER CASES. Same script, a stub standing in for node. These are the
# only cases that can reach the verdict-channel guard, because a real parser
# always answers and so never exercises the refusal for one that does not.
INAMES=$("$NODE_BIN" --input-type=module -e "
  const m = await import('file://$HERE/contract-shapes.mjs');
  console.log(Object.keys(m.INTERPRETERS).join(' '));
" 2>&1) || {
  echo "CANNOT CHECK: could not read the interpreter case list."
  echo "$INAMES"
  exit 2
}
IEXPECT=$("$NODE_BIN" --input-type=module -e "
  const m = await import('file://$HERE/contract-shapes.mjs');
  console.log(String(m.INTERPRETER_EXPECT));
")
set -- $INAMES
ITOTAL=$#
if [ "$ITOTAL" -lt 3 ]; then
  echo "CANNOT CHECK: the interpreter case list came back with $ITOTAL entries."
  echo "Read that as the fixture being broken, not as a small suite."
  exit 2
fi

STUBDIR=$(mktemp -d 2>/dev/null) || {
  echo "CANNOT CHECK: could not create a directory for the interpreter stubs."
  exit 2
}
IRAN=0
echo ""
for iname in $INAMES; do
  "$NODE_BIN" --input-type=module -e "
    import fs from 'node:fs';
    const m = await import('file://$HERE/contract-shapes.mjs');
    fs.writeFileSync('$STUBDIR/node', '#!/bin/sh\n' + m.INTERPRETERS['$iname'].script, { mode: 0o755 });
  " || { echo "CANNOT CHECK: could not install the '$iname' stub."; exit 2; }

  # PROVE THE STUB IS THE ONE BEING RUN. Without this the whole block passes
  # for the wrong reason the moment the stub fails to install: the real node
  # answers, the shape holds, and a refusal that never happened reads as one.
  if ! PATH="$STUBDIR:$PATH" command -v node | grep -q "^$STUBDIR/node$"; then
    echo "CANNOT CHECK: the '$iname' stub is not what PATH resolves node to."
    exit 2
  fi

  IMATCH=$("$NODE_BIN" --input-type=module -e "
    const m = await import('file://$HERE/contract-shapes.mjs');
    process.stdout.write(m.INTERPRETERS['$iname'].match || '');
  ")
  # EVERY CASE MUST CARRY AN OBSERVABLE. Without one the five cases collapse
  # to a single fact asserted five times: an EMPTY stub, or malformed shell,
  # exits 2 as well and every row stayed green. Measured 2026-09-09.
  if [ -z "$IMATCH" ]; then
    echo "CANNOT CHECK: interpreter case '$iname' declares no match string, so"
    echo "it cannot be told apart from any other stub that merely exits $IEXPECT."
    exit 2
  fi

  PATH="$STUBDIR:$PATH" GIFTING_ENDPOINT="http://127.0.0.1:$PORT/good" \
    bash "$HERE/contract-live.sh" 2>&1 | cat >"$OUT"
  igot=${PIPESTATUS[0]}
  IRAN=$((IRAN + 1))
  IWHY=""
  [ "$igot" = "$IEXPECT" ] || IWHY="expected exit $IEXPECT, got $igot"
  grep -qF -- "$IMATCH" "$OUT" || IWHY="${IWHY:+$IWHY; }output never says [$IMATCH], so this stub did not do the thing this case names"
  if [ -z "$IWHY" ]; then
    printf '  ok    %-10s exit %s (stub)\n' "$iname" "$igot"
  else
    printf '  WRONG %-10s %s (stub)\n' "$iname" "$IWHY"
    BAD=$((BAD + 1))
  fi
done
rm -rf "$STUBDIR"; STUBDIR=""

if [ "$IRAN" -ne "$ITOTAL" ]; then
  echo ""
  echo "CANNOT CHECK: handed $ITOTAL interpreter cases and ran $IRAN."
  exit 2
fi

# COUNT WHAT WAS ACTUALLY CONSUMED. A loop whose body carries the only
# assertions has to compare that against what it was handed, or a list that
# silently shrinks to nothing reports success.
echo ""
if [ "$RAN" -ne "$TOTAL" ]; then
  echo "CANNOT CHECK: handed $TOTAL shapes and ran $RAN. Nothing here is a result."
  exit 2
fi
if [ "$BAD" -ne 0 ]; then
  echo "=== $BAD CASE(S) WRONG, out of $RAN answer shapes and $IRAN interpreters ==="
  exit 1
fi
echo "=== all $RAN answer shapes and $IRAN interpreter cases behave as tests/contract-shapes.mjs says ==="
exit 0
