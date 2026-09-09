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
  s500:     [500, J, JSON.stringify({ ok: false, error: 'boom' })],
  s404:     [404, 'text/plain', 'not found'],
};

// The expected exit code from contract-live.sh for each shape.
// 0 holds, 1 broken, 2 nothing tested.
export const EXPECTED = {
  good: 0, ws: 0, bom: 0, nlerr: 0, bigerr: 0, split: 0,
  array: 1, nested: 1, nocode: 1, codecase: 1, emptyerr: 1, wserr: 1,
  errnum: 1, errobj: 1, nlcode: 1, nlcode2: 1, notjson: 1, scalar: 1,
  nullbody: 1, empty: 1,
  s200: 1, s500: 2, s404: 2,
};
