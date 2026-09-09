// Answer shapes for tests/contract-matrix.sh.
//
// WHY THIS IS IN THE REPO. tests/README.md quotes a row-by-row result table for
// contract-live.sh. Those rows were measured against a mock that lived in a
// scratchpad, so the numbers in the README could not be re-run by anyone
// reading them. A measured figure whose command is gone goes stale with nobody
// touching it.
//
// Each entry is [httpStatus, contentType, body]. The route name is the key.
const J = 'application/json';

// A 2-byte character placed ASTRIDE the 65536-byte pipe chunk boundary on
// purpose. contract-live.sh feeds the body to node over a pipe; node emits
// 65536-byte chunks, and decoding each chunk on its own splits a character
// landing on that seam into replacement characters. The accent has to start at
// byte 65535 for that to happen at all, which is the whole point of computing
// the padding instead of guessing it.
const splitBody = (() => {
  const pre = '{"ok":false,"code":"invalid_input","error":"';
  const pad = 65535 - Buffer.byteLength(pre);
  return pre + 'A'.repeat(pad) + 'é' + 'TAILMARK' + '"}';
})();

export const SHAPES = {
  // --- bodies the site reads correctly, so the contract HOLDS (exit 0) ---
  good:     [400, J, JSON.stringify({ ok: false, code: 'invalid_input', error: 'Please add your name and a valid email so we can reply.' })],
  ws:       [400, J, '  \n ' + JSON.stringify({ ok: false, code: 'invalid_input', error: 'leading whitespace' })],
  bom:      [400, J, '﻿' + JSON.stringify({ ok: false, code: 'invalid_input', error: 'BOM body' })],
  nlerr:    [400, J, JSON.stringify({ ok: false, code: 'invalid_input', error: 'line one\nline two' })],
  bigerr:   [400, J, JSON.stringify({ ok: false, code: 'invalid_input', error: 'E'.repeat(200000) })],
  split:    [400, J, splitBody],

  // --- bodies the site cannot use, so the contract is BROKEN (exit 1) ---
  array:    [400, J, JSON.stringify([{ ok: false, code: 'invalid_input', error: 'x' }])],
  nested:   [400, J, JSON.stringify({ ok: false, code: 'rate_limited', error: 'Too many requests', detail: { code: 'invalid_input' } })],
  nocode:   [400, J, JSON.stringify({ ok: false, error: 'Enter a valid email.' })],
  codecase: [400, J, JSON.stringify({ ok: false, Code: 'invalid_input', error: 'wrong casing' })],
  emptyerr: [400, J, JSON.stringify({ ok: false, code: 'invalid_input', error: '' })],
  wserr:    [400, J, JSON.stringify({ ok: false, code: 'invalid_input', error: '   ' })],
  errnum:   [400, J, JSON.stringify({ ok: false, code: 'invalid_input', error: 42 })],
  errobj:   [400, J, JSON.stringify({ ok: false, code: 'invalid_input', error: { msg: 'x' } })],
  nlcode:   [400, J, JSON.stringify({ ok: false, code: 'invalid_input\nSOMETHING', error: '' })],
  nlcode2:  [400, J, JSON.stringify({ ok: false, code: 'invalid_input\nSOMETHING', error: 'real message' })],
  notjson:  [400, 'text/plain', 'nope'],
  scalar:   [400, J, '"invalid_input"'],
  nullbody: [400, J, 'null'],
  empty:    [400, J, ''],

  // --- status codes, judged before the body is looked at ---
  s200:     [200, J, JSON.stringify({ ok: true })],
  // 403 is the bot guard rejecting the User-Agent before any validation runs.
  // It had no offline case at all until 2026-09-09 and was covered only by a
  // live network run, which is the one branch a reader could not exercise.
  s403:     [403, 'text/plain', 'Authorization data is wrong!'],
  s500:     [500, J, JSON.stringify({ ok: false, error: 'boom' })],
  s404:     [404, 'text/plain', 'not found'],
};

// What contract-live.sh must do for each shape. THREE THINGS PER ROW, not one.
//
// `exit`     0 holds, 1 broken, 2 nothing tested.
// `failures` how many FAILURE lines the verdict names, or null when the shape
//            is refused before the parser and there is no verdict line at all.
// `match`    a substring of the output that pins WHICH branch fired.
//
// The exit code alone is not enough, and this file said it was for a day.
// Deleting the Array.isArray branch outright left `array` at exit 1, with a
// different message and a different failure count, and a matrix comparing exit
// codes alone reported a clean run on a tree with a whole guard removed.
// `failures` and `match` are what make each row fail for its OWN reason rather
// than for a neighbour's.
export const EXPECTED = {
  good:     { exit: 0, failures: 0, match: 'Please add your name' },
  ws:       { exit: 0, failures: 0, match: 'leading whitespace' },
  bom:      { exit: 0, failures: 0, match: 'BOM body' },
  nlerr:    { exit: 0, failures: 0, match: 'line two' },
  bigerr:   { exit: 0, failures: 0, match: 'is "invalid_input"' },
  split:    { exit: 0, failures: 0, match: 'TAILMARK' },

  array:    { exit: 1, failures: 1, match: 'JSON ARRAY' },
  nested:   { exit: 1, failures: 1, match: '"rate_limited"' },
  nocode:   { exit: 1, failures: 1, match: 'code field is null' },
  codecase: { exit: 1, failures: 1, match: 'code field is null' },
  emptyerr: { exit: 1, failures: 1, match: 'missing or not a string' },
  wserr:    { exit: 1, failures: 1, match: 'blank once trimmed' },
  errnum:   { exit: 1, failures: 1, match: 'missing or not a string' },
  errobj:   { exit: 1, failures: 1, match: 'missing or not a string' },
  nlcode:   { exit: 1, failures: 2, match: 'SOMETHING' },
  nlcode2:  { exit: 1, failures: 1, match: 'SOMETHING' },
  notjson:  { exit: 1, failures: 1, match: 'not JSON' },
  scalar:   { exit: 1, failures: 1, match: 'parsed but is not an object' },
  nullbody: { exit: 1, failures: 1, match: 'parsed but is not an object' },
  empty:    { exit: 1, failures: 1, match: 'not JSON' },

  s200:     { exit: 1, failures: 1, match: 'ACCEPTED a submission' },
  s403:     { exit: 2, failures: null, match: 'ignoreBots guard' },
  s500:     { exit: 2, failures: null, match: 'service problem' },
  s404:     { exit: 2, failures: null, match: 'service problem' },
};


// Interpreter behaviours, which are a DIFFERENT KIND OF CASE from an answer
// shape and the reason this file has a second list.
//
// An answer shape varies what the endpoint says. It can never exercise what
// contract-live.sh does when its own parser misbehaves, because a real node
// always behaves. The guard that catches a parser which runs and says nothing
// is therefore invisible to a matrix of answer shapes alone -- which is exactly
// how it was shipped with no regression net at all, one layer above the guard
// it was written to restore.
//
// Each entry is a tiny `sh` script installed as `node` at the front of PATH.
// Every one of them must produce exit 2: nothing about the contract can be
// established when the parser did not answer.
export const INTERPRETERS = {
  silent:   { script: 'cat >/dev/null\nexit 0\n',
              match: 'exited 0 and left verdict',
              why: 'drains stdin, prints nothing, exits 0 -- the case that was a false pass' },
  forged:   { script: 'cat >/dev/null\necho "=== CONTRACT HOLDS ==="\nexit 0\n',
              match: '=== CONTRACT HOLDS ===',
              why: 'prints the verdict text on stdout, which is not the channel it is read from; the run must still refuse WITH that line present' },
  bare1:    { script: 'cat >/dev/null\nexit 1\n',
              match: 'exited 1 and left verdict',
              why: 'claims BROKEN without having established it' },
  odd:      { script: 'cat >/dev/null\nexit 7\n',
              match: 'exited 7 and left verdict',
              why: 'an exit code this script never issues' },
  signal:   { script: 'cat >/dev/null\nkill -9 $$\n',
              match: 'exited 137 and left verdict',
              why: 'killed rather than exiting' },
};

// EACH CASE CARRIES ITS OWN OBSERVABLE, and that is not decoration.
//
// All five collapse to exit 2, so comparing the exit code alone asserts one
// fact five times. Measured 2026-09-09: replacing every script with an EMPTY
// one, or with malformed shell, left all five green -- five cases advertised
// as five distinct behaviours, verifying only "contract-live.sh refuses when
// node is replaced by something that is not node". `match` is what separates
// them: an empty stub satisfies `silent` and fails the other four.
// Every interpreter case expects the same thing, and it is stated once rather
// than repeated per row: a parser that did not answer is CANNOT CHECK.
export const INTERPRETER_EXPECT = 2;
