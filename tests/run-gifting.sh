#!/usr/bin/env bash
# Build, serve the artifact the build actually produced, and test THAT.
#
# The gate that matters is the digest: the wrapper hashes every file the build
# wrote into dist/, the harness fetches exactly those paths and hashes what came
# back, and a mismatch REFUSES. That exists because a mutant that fails to
# compile leaves the previous bundle in dist/, and a suite with no gate then
# reports a green run about an artifact that does not correspond to the source.
#
# Reuses an already-running preview on PORT if there is one, otherwise starts
# and stops its own.
set -o pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
PORT="${PORT:-4178}"
BASE="http://localhost:$PORT"

BUILD_OUT=$(cd "$REPO" && npm run build 2>&1)
if [ $? -ne 0 ]; then
  echo "BUILD FAILED. Not running the suite -- a green run on a stale bundle is worse than no run."
  echo "$BUILD_OUT" | tail -20
  exit 3
fi

# Start the server with `exec` on vite's own entry file, NOT through npx.
#
# `npx vite preview &` leaves THREE processes -- npx, an `sh -c`, and node --
# and `$!` is only the subshell wrapping them. Killing that PID kills nothing
# that holds the port: the grandchildren reparent to init and the port stays
# bound for the life of the machine. The consequence was that the cold path
# below ran once and every later run silently reused a stale server, which is
# the exact state the digest gate exists to catch and cannot, because the
# digest is computed against whatever that old server is serving. Observed
# leaking on 2026-09-09 (`ps -eo pid,ppid,args | grep "vite preview"` showed
# the npx parent on PPID 1). `exec` replaces the subshell with node itself, so
# $! IS the server and `wait` below is exact.
VITE_ENTRY="$REPO/node_modules/vite/bin/vite.js"
OWN_SERVER=0
if ! curl -sf -o /dev/null "$BASE/" 2>/dev/null; then
  if [ ! -f "$VITE_ENTRY" ]; then
    echo "No vite entry at node_modules/vite/bin/vite.js. Run npm install."
    echo "Refusing rather than falling back to npx, which leaks a server this"
    echo "script cannot kill. CANNOT CHECK."
    exit 3
  fi
  (cd "$REPO" && exec node "$VITE_ENTRY" preview --port "$PORT" --strictPort >/dev/null 2>&1) &
  SERVER_PID=$!
  OWN_SERVER=1
  for _ in $(seq 1 40); do
    curl -sf -o /dev/null "$BASE/" 2>/dev/null && break
    curl -s -o /dev/null --retry 1 --retry-delay 1 "$BASE/" 2>/dev/null || true
  done
  if ! curl -sf -o /dev/null "$BASE/"; then
    echo "Could not start a preview server on $PORT. CANNOT CHECK, refusing."
    kill "$SERVER_PID" 2>/dev/null
    exit 3
  fi
fi

# Never exit quietly on a server that outlived us. A leak here does not fail
# anything today; it poisons the NEXT run, which is why it has to be said out
# loud rather than swallowed.
cleanup() {
  [ "$OWN_SERVER" = "1" ] || return 0
  kill "$SERVER_PID" 2>/dev/null
  wait "$SERVER_PID" 2>/dev/null
  if curl -sf -o /dev/null --max-time 2 "$BASE/" 2>/dev/null; then
    kill -9 "$SERVER_PID" 2>/dev/null
    wait "$SERVER_PID" 2>/dev/null
    if curl -sf -o /dev/null --max-time 2 "$BASE/" 2>/dev/null; then
      echo ""
      echo "WARNING: something is STILL serving $BASE after this run killed its"
      echo "own server (pid $SERVER_PID). The next run will reuse it instead of"
      echo "building. Kill whatever holds port $PORT before trusting another run."
    fi
  fi
}
trap cleanup EXIT

MANIFEST="$HERE/.dist-manifest-gifting.json"
DIGEST_OUT=$(node "$HERE/digest.mjs" --dir "$REPO/dist" "$MANIFEST" 2>&1)
if [ $? -ne 0 ]; then
  echo "Could not digest $REPO/dist. CANNOT CHECK, refusing."
  echo "$DIGEST_OUT"
  exit 3
fi
DIGEST=$(echo "$DIGEST_OUT" | awk '{print $1}')
echo "   built digest: ${DIGEST:0:16}  over $(echo "$DIGEST_OUT" | awk '{print $2}') files"
EXPECT_DIGEST="$DIGEST" EXPECT_MANIFEST="$MANIFEST" node "$HERE/giftsave.mjs" "$BASE"
