#!/usr/bin/env bash
# Checks the ONE thing the browser suite cannot: that the live webhook still
# answers a bad input with the code the site keys on.
#
# WHY THIS EXISTS. Every one of the 43 assertions in giftsave.mjs stubs the
# endpoint, so they pin what the SITE does with a given answer and say nothing
# about what the endpoint actually sends. The site stops before the mail step
# only on `code: "invalid_input"`. Drop that field in n8n and the browser suite
# stays green while a real typo starts falling through to the copy-it-yourself
# panel with a malformed address in the draft. That is a contract held on one
# side, and this is the other side.
#
# It writes NO row: a missing name is refused before the Airtable node.
#
# Run it:  bash tests/contract-live.sh
# Not part of `npm run test:gifting`, because that suite is offline on purpose
# and this one needs the network.
set -o pipefail
URL="${GIFTING_ENDPOINT:-https://capturethisvibe.app.n8n.cloud/webhook/berrova-gifting-9f3d}"

# A browser User-Agent is REQUIRED, not cosmetic. The webhook runs with
# ignoreBots: true, and curl's default UA is rejected with a plain-text
# `403 Authorization data is wrong!` before any validation runs. Send the
# default UA and this check reads a bot refusal as a broken contract.
# Overridable only so the 403 branch below can be exercised on purpose.
UA="${GIFTING_UA:-Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36}"

RESP=$(curl -s -w '\n%{http_code}' --max-time 20 \
  -H "User-Agent: $UA" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'name=' \
  --data-urlencode 'email=not-an-email' \
  --data-urlencode 'source=contract-live-check' \
  "$URL" 2>&1)
CURL_RC=$?

BODY=$(printf '%s' "$RESP" | sed '$d')
CODE=$(printf '%s' "$RESP" | tail -1)

# Unreachable is CANNOT CHECK, never a pass. A network check that reports
# green when it could not connect is the silent guard this vault refuses.
if [ $CURL_RC -ne 0 ]; then
  echo "CANNOT CHECK: curl exit $CURL_RC against"
  echo "  $URL"
  echo "$BODY"
  exit 2
fi
if [ -z "$CODE" ] || ! printf '%s' "$CODE" | grep -Eq '^[0-9]{3}$'; then
  echo "CANNOT CHECK: no HTTP status came back."
  echo "$RESP"
  exit 2
fi

echo "  status: $CODE"
echo "  body:   $BODY"

FAILED=0
fail() { echo "FAIL  $1"; FAILED=$((FAILED+1)); }
pass() { echo "PASS  $1"; }

if [ "$CODE" = "403" ]; then
  echo "CANNOT CHECK: 403. That is the ignoreBots guard rejecting the"
  echo "User-Agent, not the validation branch. Nothing about the contract was"
  echo "tested. Fix the UA above and re-run."
  exit 2
fi

[ "$CODE" = "400" ] && pass "the endpoint refuses a missing name with 400" \
  || fail "expected 400 for a missing name, got $CODE"

printf '%s' "$BODY" | grep -q '"code"[[:space:]]*:[[:space:]]*"invalid_input"' \
  && pass 'the refusal carries code "invalid_input", which is what the site keys on' \
  || fail 'the refusal does NOT carry code "invalid_input" -- src/pages/Gifting.tsx will stop treating a bad address as the visitor input it is'

ERR=$(printf '%s' "$BODY" | sed -n 's/.*"error"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
[ -n "$ERR" ] \
  && pass "it carries a non-empty error string to show the visitor :: $ERR" \
  || fail "the error string is missing or empty; the site would show a blank note"

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "=== CONTRACT HOLDS ==="
  exit 0
fi
echo "=== $FAILED CONTRACT FAILURE(S) ==="
exit 1
