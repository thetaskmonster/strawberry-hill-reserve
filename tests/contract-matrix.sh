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

"$NODE_BIN" --input-type=module -e "
  import http from 'node:http';
  const m = await import('file://$HERE/contract-shapes.mjs');
  http.createServer((req, res) => {
    const key = req.url.replace(/^\//, '');
    const hit = m.SHAPES[key];
    let b = ''; req.on('data', d => b += d).on('end', () => {
      if (!hit) { res.writeHead(418, {'Content-Type':'text/plain'}); return res.end('unknown shape'); }
      res.writeHead(hit[0], {'Content-Type': hit[1]});
      res.end(hit[2]);
    });
  }).listen($PORT, '127.0.0.1', () => console.log('up'));
" >/dev/null 2>&1 &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null; wait "$SERVER_PID" 2>/dev/null; }
trap cleanup EXIT

curl -s --retry 30 --retry-all-errors --retry-delay 1 --max-time 30 \
  -o /dev/null -X POST "http://127.0.0.1:$PORT/good" || {
  echo "CANNOT CHECK: the fixture server never came up on port $PORT."
  exit 2
}

EXPECT_JSON=$("$NODE_BIN" --input-type=module -e "
  const m = await import('file://$HERE/contract-shapes.mjs');
  console.log(JSON.stringify(m.EXPECTED));
")

RAN=0
BAD=0
for name in $NAMES; do
  want=$(printf '%s' "$EXPECT_JSON" | "$NODE_BIN" -e '
    const c=[];process.stdin.on("data",d=>c.push(d)).on("end",()=>{
      const o=JSON.parse(Buffer.concat(c).toString("utf8"));
      const v=o[process.argv[1]];
      process.stdout.write(v === undefined ? "?" : String(v));
    });' "$name")
  GIFTING_ENDPOINT="http://127.0.0.1:$PORT/$name" bash "$HERE/contract-live.sh" >/dev/null 2>&1
  got=$?
  RAN=$((RAN + 1))
  if [ "$want" = "$got" ]; then
    printf '  ok    %-10s exit %s\n' "$name" "$got"
  else
    printf '  WRONG %-10s expected %s, got %s\n' "$name" "$want" "$got"
    BAD=$((BAD + 1))
  fi
done

# COUNT WHAT WAS ACTUALLY CONSUMED. A loop whose body carries the only
# assertions has to compare that against what it was handed, or a list that
# silently shrinks to nothing reports success.
echo ""
if [ "$RAN" -ne "$TOTAL" ]; then
  echo "CANNOT CHECK: handed $TOTAL shapes and ran $RAN. Nothing here is a result."
  exit 2
fi
if [ "$BAD" -ne 0 ]; then
  echo "=== $BAD of $RAN SHAPES EXITED WRONG ==="
  exit 1
fi
echo "=== all $RAN answer shapes exit as tests/contract-shapes.mjs says ==="
exit 0
