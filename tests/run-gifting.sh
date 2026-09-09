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

OWN_SERVER=0
if ! curl -sf -o /dev/null "$BASE/" 2>/dev/null; then
  (cd "$REPO" && npx vite preview --port "$PORT" --strictPort >/dev/null 2>&1) &
  SERVER_PID=$!
  OWN_SERVER=1
  for _ in $(seq 1 40); do
    curl -sf -o /dev/null "$BASE/" 2>/dev/null && break
    curl -s -o /dev/null --retry 1 --retry-delay 1 "$BASE/" 2>/dev/null || true
  done
  if ! curl -sf -o /dev/null "$BASE/"; then
    echo "Could not start a preview server on $PORT. CANNOT CHECK, refusing."
    kill $SERVER_PID 2>/dev/null
    exit 3
  fi
fi
cleanup() { [ "$OWN_SERVER" = "1" ] && kill $SERVER_PID 2>/dev/null; }
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
