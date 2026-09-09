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

# Separate a CHANGED CONTRACT from a SERVICE PROBLEM, because they send the
# reader after completely different things. A 5xx or a 404 says nothing about
# whether the code field is still there, so reporting it as a contract failure
# is a wrong answer, not a cautious one.
if [ "$CODE" = "403" ]; then
  echo "CANNOT CHECK: 403. That is the ignoreBots guard rejecting the"
  echo "User-Agent, not the validation branch. Nothing about the contract was"
  echo "tested. Fix the UA above and re-run."
  exit 2
fi
if [ "$CODE" = "200" ]; then
  echo "FAIL  the endpoint ACCEPTED a submission with no name and a malformed"
  echo "      email. That is a validation change, not a contract detail, and it"
  echo "      may have written a junk row. Check the Gifting Inquiries table."
  echo ""
  echo "=== 1 CONTRACT FAILURE(S) ==="
  exit 1
fi
if [ "$CODE" != "400" ]; then
  echo "CANNOT CHECK: expected 400 for a missing name and got $CODE. That is a"
  echo "service problem -- the workflow unpublished, the path wrong, or n8n"
  echo "down -- not evidence about the code field either way. Nothing was"
  echo "tested. Fix the endpoint and re-run."
  exit 2
fi
pass "the endpoint refuses a missing name with 400"

# READ THE FIELD THE SITE READS. A substring grep over the body is not that,
# and the difference is not academic: it passed on two shapes measured
# 2026-09-09 that the site handles as no code at all.
#
#   [{"ok":false,"code":"invalid_input","error":"..."}]
#       an ARRAY. `data.code` is undefined. An array body is what this node
#       produces whenever it is not returning a hand-written JSON object --
#       switching it to return incoming items is one way, though that echoes
#       the webhook items rather than this string, because `responseBody` is
#       only read at all under `respondWith: "json"`. Either way the site
#       sees an array and no top-level code.
#       (This comment named the wrong mechanism until 2026-09-09. The
#       conclusion was right and the reason was not, which is worse than
#       useless in a comment somebody will act on.)
#   {"code":"rate_limited","detail":{"code":"invalid_input"}}
#       the string is present and nested. `data.code` is "rate_limited".
#
# Both read as CONTRACT HOLDS under a grep and as "no code" to the site, which
# is the exact false pass this script exists to prevent.
command -v node >/dev/null 2>&1 || {
  echo "CANNOT CHECK: no node on PATH, so the body cannot be parsed the way the"
  echo "site parses it. Refusing rather than falling back to a substring match."
  exit 2
}

PARSED=$(printf '%s' "$BODY" | node -e '
let s = "";
process.stdin.on("data", d => s += d).on("end", () => {
  // Strip a leading UTF-8 BOM. The browser does this before parsing, as part
  // of decoding the response text, so a BOM-prefixed body that the site reads
  // perfectly well would otherwise be reported here as "not JSON at all".
  // Measured 2026-09-09 in Chromium: res.json() does NOT throw on it, while
  // node JSON.parse does. Two parsers disagreeing is a false finding waiting
  // to happen in whichever direction you forget.
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
  let o;
  try { o = JSON.parse(s); } catch (e) { console.log("PARSE_ERROR"); return; }
  if (Array.isArray(o)) { console.log("ARRAY"); return; }
  if (o === null || typeof o !== "object") { console.log("NOT_OBJECT"); return; }
  // Mirror src/pages/Gifting.tsx exactly: it reads data.code and data.error
  // off the top level and requires both to be non-empty strings.
  //
  // BOTH values go through JSON.stringify, and that is load-bearing, not
  // tidiness. These come back to bash as three stdout LINES, so any value
  // carrying a newline splits across them and every later line is read as
  // the wrong field. The first version stringified only `error`, and a body
  // with a newline inside `code` reported CONTRACT HOLDS while the site saw
  // a code it does not recognise and opened a mail draft with the malformed
  // address in it. Same class of defect as the grep this parser replaced,
  // one layer down. stringify always emits a single line.
  console.log("OBJECT");
  console.log(JSON.stringify(typeof o.code  === "string" ? o.code  : ""));
  console.log(JSON.stringify(typeof o.error === "string" ? o.error : ""));
});' 2>/dev/null)

SHAPE=$(printf '%s' "$PARSED" | sed -n '1p')
GOT_CODE=$(printf '%s' "$PARSED" | sed -n '2p')
GOT_ERR=$(printf '%s' "$PARSED" | sed -n '3p')

case "$SHAPE" in
  OBJECT) : ;;
  ARRAY)
    fail 'the body is a JSON ARRAY, so the site sees no code at all. `await res.json()` gives an array, `data.code` is undefined, and a real typo falls through to the copy-it-yourself panel with the malformed address in the mail draft' ;;
  NOT_OBJECT)
    fail 'the body parsed but is not an object, so `data.code` is undefined to the site' ;;
  PARSE_ERROR)
    fail 'the body is not JSON, so `await res.json()` throws in the site and the whole submission reads as a network failure. (A leading byte-order mark is stripped before this check, because the browser strips it too and the site reads such a body correctly.)' ;;
  *)
    echo "CANNOT CHECK: could not run the body parser. Nothing was tested."
    exit 2 ;;
esac

if [ "$SHAPE" = "OBJECT" ]; then
  # Compare against the JSON-ENCODED form, since that is what the parser emits.
  [ "$GOT_CODE" = '"invalid_input"' ] \
    && pass 'the top-level code field is "invalid_input", which is what the site keys on' \
    || fail "the top-level code field is ${GOT_CODE:-absent}, not \"invalid_input\" -- src/pages/Gifting.tsx will stop treating a bad address as the visitor input it is"

  [ -n "$GOT_ERR" ] && [ "$GOT_ERR" != '""' ] \
    && pass "it carries a non-empty error string to show the visitor :: $GOT_ERR" \
    || fail "the top-level error string is missing or empty; the site would show a blank note"
fi

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "=== CONTRACT HOLDS ==="
  exit 0
fi
echo "=== $FAILED CONTRACT FAILURE(S) ==="
exit 1
