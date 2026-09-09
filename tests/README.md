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
**It has reported a clean run while proving nothing three times now**, in three
different layers, and each round is worth knowing before you edit it. The
pattern across all three is the same: the check answered instead of refusing.

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
mail draft carrying the malformed address.

**So the boundary is gone rather than patched.** Encoding each value fixes the
instance; the class is a structured value squeezed through an unstructured
channel, and it had already produced two false-clean runs one layer apart. The
whole body check now runs inside node, which prints its own verdict.

**Removing the boundary then removed a guard, and that is round three.** With
the three-line channel gone, the shell read node's EXIT CODE and nothing else.
An exit code is safe to carry -- an integer cannot be split or nested, which
was the whole point -- but it is not sufficient, because it carries no evidence
that anybody spoke. A stub interpreter that drains stdin, prints nothing and
exits 0 was reported as CONTRACT HOLDS. The previous version had a `*)` arm
that refused exactly that; the refactor deleted it along with the channel and
nothing counted the loss.

**A boundary carries two duties and they are not the same duty.** Fidelity is
whether the value survives the crossing. Sufficiency is whether the receiver
can tell the sender spoke at all. Removing a boundary settles the first and
silently drops the second.

So node now also writes a fixed token to a **private file** named in an
environment variable, and the shell honours an exit code only when the token
agrees with it. The token never shares a stream with body-derived text: a body
carrying the token would otherwise forge it, which is round one again wearing a
third costume. Only `(0, HOLDS)` and `(1, BROKEN)` are answers; every other
pairing is CANNOT CHECK.

Refusals observed on 2026-09-09, each run against the real script:

```
stub drains stdin, prints nothing, exits 0   -> 2
stub prints "=== CONTRACT HOLDS ===", exits 0 -> 2   (forged on the wrong channel)
stub exits 1 with no token                    -> 2
stub exits 7                                  -> 2
stub killed by a signal                       -> 2
node absent from PATH                         -> 2
```

**And node sets `process.exitCode` rather than calling `process.exit`.**
`process.exit` discards pending async writes, and node's stdout is async when
it is a pipe, so a single `console.log` past the 64 KiB pipe buffer was lost
while the run still exited 0. Measured at exactly 65536 bytes. The `bigerr`
shape below pins it, and it dies on the `process.exit` mutant while the
small-body case still passes.

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

And for `contract-live.sh`, each planted and run through `contract-matrix.sh`
on 2026-09-09, each naming the exact fix it covers.

| Mutant | Dies at | Which comparison catches it |
|---|---|---|
| the verdict-file check dropped, exit code trusted alone | `silent`, `forged`, `bare1` | interpreter cases |
| `process.exitCode` back to `process.exit` | `bigerr`, `split` | verdict-line count, failure count, and on `split` the `match` too |
| the blank-error branch back to plain truthiness | `wserr` | exit code, failure count, `match` |
| stdin decoded per chunk instead of once | `split` | replacement-character count |

All four were re-planted against the **tightened** runner on 2026-09-09, after
the failure-count and `match` comparisons went in, and all four still die.
**One of the four re-plants was wrong, and it read as a retired test.** Writing
the per-chunk mutant as `setEncoding("utf8")` produced a green run, because
node's `setEncoding` goes through a `StringDecoder` that holds a partial
character back across a chunk boundary -- it is seam-safe, so that mutant does
not contain the defect it names. The faithful form accumulates with `acc += d`
over raw Buffers, which calls `Buffer.prototype.toString()` on each chunk in
isolation. It kills `split` immediately. **A mutant that passes is a claim about
the mutant before it is a claim about the guard.**

**The third column is not decoration, and this table said something false
without it.** The first version of the matrix compared **exit codes only**, and
three of those four mutants do not move an exit code. It printed a clean run on
a tree with them reverted, while this file claimed it killed all four -- a guard
advertised wider than it is, shipped one layer above the guard the same commit
was written to restore. Found by a proof gate, not by the matrix.

It now compares five things per shape (exit code, verdict-line count, failure
count, a substring the shape's own branch prints, replacement-character count)
and runs a second kind of case entirely.
**Interpreter cases** install a stub in place of `node`. No answer shape can
reach the guard that refuses a parser which ran and said nothing, because a
real parser always answers -- which is precisely why that guard shipped with no
net.

**And the verdict-line count could not fail either, at first.** The runner sent
the output straight to a file, and `process.exit` only discards pending writes
when stdout is a **pipe**. The same defect, one layer inside the fix for it.
The runner now pipes through `cat` and reads `PIPESTATUS`, and the mutant dies.

And for `contract-matrix.sh` itself, every row below planted and observed, then
**all of them re-run again after the tightening**, because a new net can retire
an old test without either one changing. The count is the table's own length,
so read it there rather than from a sentence -- this paragraph said "all eight"
for one commit while the table under it had grown to nine.

| Mutant | Dies at |
|---|---|
| a shape removed from `EXPECTED` but not `SHAPES` | exit 2, naming the shape |
| the shape list shrunk to one entry | exit 2, refusing rather than running a one-case suite |
| the shape loop broken out of early | exit 2, "handed 24 shapes and ran 3" |
| the interpreter list shrunk below three | exit 2 |
| the interpreter loop broken out of early | exit 2, "handed 5 interpreter cases and ran 1" |
| a stale server left on the fixture port | exit 2, "is not this run's fixture server" |
| an interpreter case with no `match` string | exit 2, "declares no match string" |
| an answer shape with no `match` string | exit 2, "declares no match string" |
| a fixture body carrying a line shaped like `PASS  ` | exit 2, "a fixture body carries a line shaped like" |
| the echoed-body cut reverted, with a branch deleted | the `match` clause vanishes; the cut is load-bearing |
| the stub failing to install, so the real `node` answers | exit 2, "not what PATH resolves node to" |
| node absent from `PATH` | exit 2 |
| any mutant of `contract-live.sh` above | the named rows print WRONG, exit 1 |

## The contract check's own matrix

`contract-live.sh` talks to the live webhook, so on its own it only ever sees
the one answer the endpoint is giving today. The shapes that have actually gone
wrong are served by a local fixture instead:

```
bash tests/contract-matrix.sh
```

It reads `tests/contract-shapes.mjs`, drives `contract-live.sh` against every
shape there, and refuses if any one of them behaves differently from the
expected table in that same file. **The lists come out of the fixture module,
never out of the runner**, so there is one copy rather than two.

Per shape it compares five things: the **exit code**, the **number of verdict
lines** in stdout, the **failure count** the parser reports, a **substring the
shape's own branch prints** (looked for in the script's own output, with the
echoed response body cut out), and **whether any line carries a replacement
character**. That last one counts LINES, not characters -- it is a `grep -c` --
and the runtime message says so.
Three of this commit's four fixes move no exit code at all, so an exit-code
comparison alone is a net with holes in it -- which is how the first version of
this runner shipped.

The `match` substring is what stops a row passing for a neighbour's reason.
Before it went in, `array`, `scalar` and `nlcode` could not fail against the
branch each one names: delete the branch and some other branch produces the
same exit code, so the row stayed green. With `match` and the failure count in
place, deleting `Array.isArray` prints `WRONG array`, deleting the non-object
branch prints `WRONG scalar` and `WRONG nullbody`, and deleting the BOM strip
prints `WRONG bom`.

**And the `match` shipped decorative on a third of the table, which this file
claimed as coverage for a commit.** `contract-live.sh` echoes the whole response
body into the same stream the matrix greps, so any match string that also
occurs in the fixture body was satisfied by the echo whatever branch fired --
**8 of the 24 shapes**. Measured off the fixture rather than counted by hand:

```
node --input-type=module -e "const m = await import('./tests/contract-shapes.mjs');
  const weak = Object.keys(m.SHAPES).filter(k => String(m.SHAPES[k][2]).includes(m.EXPECTED[k].match));
  console.log(weak.length, weak.join(', '));"
```

Proven rather than reasoned: deleting the **only** branch that prints `nested`'s
match string left the match passing, on the echoed body line, while the row was
caught by the failure count alone. The runner now cuts the echoed body region
out before looking for the match, and the same mutant prints
`output never says ["rate_limited"]`. Reverting only the cut, with the mutant
still planted, makes that clause disappear again -- which is what makes the cut
load-bearing rather than assumed.

The cut is load-bearing for **all eight**, not only for `nested`. Two mutants
cover them: stop quoting the error string in the `PASS` line and `good`, `ws`,
`bom`, `nlerr` and `split` all report `output never says [...]` -- the match is
the **only** clause that fires on those five, so there the cut is the entire
guard. Stop quoting the code value in the mismatch `FAIL` and `nested`,
`nlcode` and `nlcode2` join the two rows that were already strong. Revert the
cut with either mutant still planted and exactly the weak rows go silent.

### The cut ends at the script's own line shapes, and a body can forge one

The comment first written above this cut said a match "can only be satisfied by
something the script itself printed". **That is an absolute and it is false**,
found by the next gate, one round after the same class of overclaim and in the
comment explaining the fix for it. The cut stops at the first terminator line.
A multi-line body whose continuation reproduces a terminator ends the cut early
and puts the rest of the body back in the judged stream:

```
  status: 400
  body:   garbage-line-one
PASS  forged by the body
MAGICSTRINGXYZ            <- body text, back in the judged stream
```

No shipped fixture does this -- almost every body is single-line, because
`JSON.stringify` escapes newlines -- so the property was **true by luck**.
It is enforced now instead. The terminators are the exact shapes the script
emits (two spaces after `PASS` and `FAIL`, the space after `===`, the colon
after `CANNOT CHECK`), and a startup guard refuses any fixture body carrying a
line that could pass for one. Planted the forging fixture above: the guard
refuses it, exit 2. Removed the guard, same fixture: `ok forgebody`, clean run.

**This is the same defect as round four, one layer in.** A comparison was added,
a claim about what it pins was written next to it, and nobody measured the claim
against the thing being compared. The general form: **a guard is only as wide as
the stream it reads, and an echo of the input is not evidence about the code.**

It then runs a second kind of case. **Interpreter cases** put a stub in place of
`node` and require exit 2 from every one: a parser that ran and said nothing, a
parser that printed the verdict text on the wrong channel, one that claimed a
verdict it never established, one exiting a code this script never issues, and
one killed by a signal.

**Exit 2 alone collapsed all five into one fact.** An empty stub exits 2. A stub
whose shell is malformed exits 2. So all five rows passed while proving only
that something went wrong somewhere. Each case now names a string its refusal
has to print, and the matrix **refuses a case that declares none** -- observed:
five empty stubs give four WRONG rows, five malformed stubs give five, and
removing one case's `match` gives exit 2 rather than a pass.

**And it proves the server answering it is its own.** A fixture server left
behind on the port by an earlier run answers every probe correctly while this
run's server dies unheard on `EADDRINUSE`, and the entire matrix then passes
against a different process. Each run mints a nonce, serves it at `__whoami`,
and refuses unless it gets that exact token back.

That command is here because the row table below used to be measured against a
mock in a scratchpad. The numbers were real and nobody reading them could
re-run them, which is how a measured figure goes stale with nobody touching it.

Measured 2026-09-09: **24 answer shapes and 5 interpreter cases, all behaving
as the fixture says.** Of the shapes, twenty are body shapes and four are
status codes. That split is a structural count, so read it off the fixture
rather than off this sentence:

```
node --input-type=module -e "const m = await import('./tests/contract-shapes.mjs');
  const k = Object.keys(m.SHAPES), st = k.filter(x => /^s[0-9]{3}\$/.test(x));
  console.log('shapes', k.length, 'body', k.length - st.length, 'status', st.length,
              'interpreters', Object.keys(m.INTERPRETERS).length);"
```

The rows that earned their place are the
ones that once returned the wrong answer -- `array`, `nested`, both
newline-in-code rows, `bom`, `bigerr`, and `split`.

`split` is worth singling out. It places a two-byte character astride byte
65536, a pipe chunk boundary, which is where decoding each stdin chunk
separately corrupts it. **Seams recur at every 65536-byte multiple**, not only
the first: measured on 2026-09-09, an accent astride 65536, 131072 or 196608
all produce two replacement characters. One fixture is enough to catch the
defect, so `split` sits at the first seam; the point of saying this is that the
next fixture does not have to.

The first fixture written for that fix put its accents near the end of a long
string, nowhere near any seam, and so **passed on the mutant it was written to
kill**. It was replaced with one that computes its own padding, and that one
does die on the mutant.

The live reject cases were run the same day against the live webhook, and they
are not covered by the matrix because they need the network:

```
curl's default User-Agent            -> 2  (the ignoreBots 403, nothing tested)
a path the workflow does not answer  -> 2  (404, a service problem)
an unreachable host                  -> 2  (a non-zero curl status)
the real endpoint, missing name      -> 0  (400, code invalid_input, real message)
```

The live runs write no row: a missing name is refused before the Airtable node,
and the Gifting Inquiries table was confirmed at zero records afterwards.

**One row is deliberately stricter than the site.** `wserr` sends an error of
three spaces. The site tests `data.error` for truthiness, so `"   "` satisfies
its branch and the visitor is held on the form with an empty message, no panel
and no mail draft. The endpoint promised a sentence to show somebody; a string
of spaces does not keep that promise, so this check fails it even though the
site branch it feeds is technically satisfied.

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
`contract-matrix.sh` uses 0 for every case matching, 1 for any case behaving
wrong, and 2 for a fixture list that is unreadable, self-contradictory,
implausibly short, only partly consumed, or whose stub did not install.

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

