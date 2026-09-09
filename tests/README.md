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
| `saved = data !== null` | B2, B3, B4, B5 |
| `saved = true` always | build refuses, exit 3 |
| the form's `aria-label` renamed | fixture guard refuses, exit 2 |

## Exit codes

| Code | Meaning |
|---|---|
| 0 | every assertion passed |
| 1 | an assertion failed |
| 2 | CANNOT CHECK: the build gate or a fixture guard refused. Not a pass |
| 3 | the build or the server failed, so the suite never ran |
