# Gifting capture suite

Proves the gifting form saves the inquiry BEFORE it hands the visitor to their
mail app, and that every way the save can go wrong still keeps the lead.

Run it:

```
bash tests/run-gifting.sh
```

It builds, serves `dist/`, and refuses if the bytes it fetches do not match the
bytes the build wrote. Playwright is already a devDependency; no browser
download is needed if `PLAYWRIGHT_BROWSERS_PATH` is set in the environment.

**Every one of those 43 assertions stubs the webhook**, so they pin what the
SITE does with a given answer and nothing about what the endpoint sends. The
other half of that contract is a second script, which talks to the live
webhook and is deliberately NOT part of the run above:

```
bash tests/contract-live.sh
```

It posts a missing name and asserts the refusal carries `code: "invalid_input"`,
because that string is the only thing that makes the site treat a bad address
as the visitor's typo rather than our outage. Drop the field in n8n and the
43 stay green while real typos start opening a mail draft with the malformed
address in it. It writes no row: a missing name is refused before the Airtable
node.

**It PARSES the body and reads the top-level `code`, the way the site does.**
It has now failed this way twice, in two different layers, and both are worth
knowing before you edit it.

The first version grepped the response as a string. Two shapes reported
CONTRACT HOLDS while the site saw no code at all:

```
[{"ok":false,"code":"invalid_input","error":"..."}]       an array
{"code":"rate_limited","detail":{"code":"invalid_input"}} nested
```

The array is the one to care about. Any time this node is not returning a
hand-written JSON object, the body comes back as an array and the site sees
no top-level code.

The parser that replaced the grep then failed the same way one layer down.
It handed three values back to the shell as three stdout LINES and stringified
only two of them, so a newline inside `code` split across lines and every
later line was read as the wrong field:

```
{"ok":false,"code":"invalid_input\nSOMETHING","error":""}
```

That printed two PASS lines and CONTRACT HOLDS, while the real site opened a
mail draft carrying the malformed address. Every value crosses that boundary
JSON-encoded now.

**And it briefly failed in the other direction.** A body with a leading
byte-order mark was reported as "not JSON at all", when the browser strips a
BOM while decoding and the site reads such a body perfectly well. A checker
disagreeing with the consumer is a finding whichever way it points.

Its three answers are kept apart on purpose. **Contract broken** is exit 1.
**Nothing was tested** is exit 2, and that covers unreachable, a 403 from the
bot guard, and any status that is not 400 or 200: a 500 or a 404 is a service
problem and says nothing about the code field either way. A **200** is exit 1,
because accepting a submission with no name is a validation change and may
have written a junk row.

## What each case is for

| Case | Pins |
|---|---|
| A | The POST carries every field, form-encoded, and the panel appears when no mail app opens |
| B | A failed save shows the copy-it-yourself panel IMMEDIATELY and never claims we hold the inquiry |
| C | A successful save plus a real mail handoff shows no panel |
| D | An empty form sends nothing anywhere |
| E | `?src=` attribution reaches the request |
| F | A dead network reads as NOT saved |
| G | The save GATES the mail draft |
| H | A 400 the webhook named as bad input is the visitor's to fix, not our outage |
| I | A 400 we do NOT recognise keeps the lead |

## Two things worth knowing before you edit this

**Case G is the ordering proof, and it is a gating test on purpose.** The
obvious version reads the event sequence and asserts the POST came before the
`mailto:`. That assertion PASSES on a mutant with the mailto hoisted above the
fetch, because Chromium raises the external-handler request event
asynchronously, so event order is not source order. Four variants of it were
tried and all four passed on the inversion. G holds the webhook route open and
never answers it: if mail is genuinely downstream of an awaited save, it cannot
open. G4 then releases the route and asserts the mailto DOES fire, so G2's
absence is not vacuous.

**Cases H and I are a pair and neither works alone.** H pins the behaviour given
a 400. I pins what a 400 MEANS. The site stops before the mail step only on the
webhook's own `code: "invalid_input"`; every other 400 falls through to the
panel. Delete I and keying off the bare status passes everything H asserts, and
the day a rate limit or a dedupe answers 400 for a different reason, real
inquiries vanish with no row, no mail and no panel.

## Mutants these cases are known to kill

Each was run against this suite, not against an older one, and each names the
fix it covers rather than breaking the whole file.

| Mutant | Dies at |
|---|---|
| `mailto:` hoisted above the save | G2, H5 |
| the 400 branch removed | H2, H3, H5, H6 |
| swallow keyed on status alone, not on the code | I2, I3, I4 |
| `saved` forced true, either as `= true` or as `= data !== null` | B2, B3, B4, B5, H2, H4, H5, H6, I3, I4, I5 |
| the form's `aria-label` renamed | fixture guard refuses, exit 2 |

For `contract-live.sh`, the reject cases were run on 2026-09-09 against the two
live webhooks and against a mock serving eleven answer shapes. Live: the
waitlist webhook answers a real 400 with a real message and no `code`, and only
the code assertion dies (exit 1); curl's default User-Agent gets a 403 and it
exits 2 rather than reporting a contract failure it never tested; an
unresolvable host exits 2. Mock, one line each:

```
good 0 | whitespace-led 0 | BOM 0 | newline in error 0
array 1 | nested 1 | no code 1 | empty error 1 | error not a string 1
wrong-cased key 1 | not JSON 1 | bare scalar 1 | null body 1 | empty body 1
newline in code 1 | newline in code with a real error 1
200 -> 1 | 500 -> 2 | 404 -> 2
```

Seventeen of those are body shapes; three are status codes. The rows that
earned their place are the ones that once returned the wrong answer: array,
nested, both newline-in-code rows, and BOM.

The last-but-one row was two rows until 2026-09-09, and both were wrong. They
claimed different outcomes for what is one mutant: on any answer this suite
stubs, `data` is never null, so `data !== null` and `true` are the same
expression. Re-running them gives the identical eleven failures at exit 1. One
row had also been written as `build refuses, exit 3`; the build compiles and
serves, and the suite runs in full. Neither row had been run against this
version of the suite. They were carried over from an earlier one and reasoned
about, under a header saying every row was run.

**A mutant result belongs to the exact suite version it ran against.** Cases H
and I did not exist when those two rows were written, which is most of what
they got wrong.

Being fair about how that was caught: the two rows contradicted each other on
the face of the table, which is visible without running anything. Reading
raised the suspicion; re-running them is what turned it into a finding.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | every assertion passed |
| 1 | an assertion failed |
| 2 | CANNOT CHECK: the build gate or a fixture guard refused. Not a pass |
| 3 | the build or the server failed, so the suite never ran |

**2 and 3 are both non-passes**, and they differ only in where it stopped:
2 means the suite got far enough to refuse, 3 means it never started.

`contract-live.sh` uses 0 for holds, 1 for broken, 2 for nothing tested.

## Known unexercised branch

`run-gifting.sh` shuts its own preview down and, if something is still serving
the port afterwards, prints a warning naming the port. **That warning has never
been observed firing**, by me or by the gate that checked this file. The
kill-and-wait path was proven on 2026-09-09 (cold run, 43 pass, no surviving
process, port free); the branch that fires when the kill does not work has
not been. Read it as written, not as tested.

**The missing-entry refusal is reachable but awkward to prove, and this
paragraph claimed it too easily.** Deleting `node_modules/vite/bin/vite.js`
is the obvious way to trigger it, and it does not work: `node_modules/.bin/vite`
symlinks to that same file, so the BUILD fails first and the script returns at
the build branch. **Both exit 3**, so a run that "proved" the refusal that way
proved its neighbour instead. It was finally observed by supplying a working
vite on PATH while leaving the entry file absent.

