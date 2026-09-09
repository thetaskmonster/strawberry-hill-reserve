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

# Only the status checks below report from the shell. Everything about the
# BODY is judged inside node and reported there, so there is no shell-side
# failure counter any more -- node's exit code is the verdict.
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

# THE WHOLE BODY CHECK RUNS INSIDE NODE, and that is the point of this shape.
#
# It used to parse in node and hand the values back to the shell as three
# stdout LINES. That boundary broke it twice in one day, both times in the
# direction that reports a clean run:
#
#   1. a grep over the serialised body matched a string nested under another
#      key, and matched inside an array the site cannot read at all;
#   2. the parser that replaced the grep encoded only two of its three values,
#      so a newline inside the third split across lines and every later line
#      was read as the wrong field. Two PASS lines, CONTRACT HOLDS, and a real
#      mail draft carrying the malformed address.
#
# Same defect twice, one layer apart: a structured value squeezed through an
# unstructured channel. Encoding each value fixes the instance. Not sending
# values across at all removes the class, so node now makes the judgements and
# prints them, and the shell only reads its EXIT CODE -- one small integer,
# which is the one thing that boundary carries safely.
printf '%s' "$BODY" | node -e '
let s = "";
process.stdin.on("data", d => s += d).on("end", () => {
  let failed = 0;
  const pass = m => console.log("PASS  " + m);
  const fail = m => { console.log("FAIL  " + m); failed++; };

  // Strip a leading UTF-8 BOM. The browser does this while decoding the
  // response, so a BOM-prefixed body the site reads perfectly well would
  // otherwise be reported here as "not JSON at all". Measured 2026-09-09 in
  // Chromium: res.json() does NOT throw on it, node JSON.parse does. A
  // checker that disagrees with its consumer is a finding whichever way it
  // points, and the false-clean direction is the one that gets noticed,
  // which is exactly why the other one survives.
  if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);

  let o = null, parsed = false;
  try { o = JSON.parse(s); parsed = true; } catch (e) { /* handled below */ }

  if (!parsed) {
    fail("the body is not JSON, so `await res.json()` throws in the site and the whole submission reads as a network failure. A leading byte-order mark is stripped before this check, so that is not the cause.");
  } else if (Array.isArray(o)) {
    fail("the body is a JSON ARRAY, so the site sees no code at all. `data.code` is undefined, and a real typo falls through to the copy-it-yourself panel with the malformed address in the mail draft.");
  } else if (o === null || typeof o !== "object") {
    fail("the body parsed but is not an object, so `data.code` is undefined to the site.");
  } else {
    // Mirror src/pages/Gifting.tsx exactly: it reads data.code and data.error
    // off the TOP LEVEL and requires both to be non-empty strings.
    const code = typeof o.code  === "string" ? o.code  : undefined;
    const err  = typeof o.error === "string" ? o.error : undefined;

    if (code === "invalid_input") {
      pass("the top-level code field is \"invalid_input\", which is what the site keys on");
    } else {
      fail("the top-level code field is " + JSON.stringify(code === undefined ? null : code) + ", not \"invalid_input\" -- src/pages/Gifting.tsx will stop treating a bad address as the visitor input it is");
    }

    if (err) {
      pass("it carries a non-empty error string to show the visitor :: " + JSON.stringify(err));
    } else {
      fail("the top-level error string is missing, empty, or not a string; the site would not treat this as the visitor input it is");
    }
  }

  console.log("");
  if (failed === 0) { console.log("=== CONTRACT HOLDS ==="); process.exit(0); }
  console.log("=== " + failed + " CONTRACT FAILURE(S) ===");
  process.exit(1);
});'
NODE_RC=$?

# Any exit this script did not design for is CANNOT CHECK, never a pass. The
# rule is to bound the failure rather than list it: a set of codes enumerated
# once is a set that grows without telling you.
case "$NODE_RC" in
  0) exit 0 ;;
  1) exit 1 ;;
  *)
    echo ""
    echo "CANNOT CHECK: the body check exited $NODE_RC, which it is not written"
    echo "to return. Nothing was tested. Do not read this as a pass."
    exit 2 ;;
esac
