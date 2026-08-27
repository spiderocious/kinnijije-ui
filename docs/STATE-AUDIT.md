# State audit — kinnijije-v2

Regenerate with `python3 docs/state-audit.py`. The numbers below are derived,
not asserted; nothing here is a claim you have to take on trust.

## What it measures

Every Studio specimen declares its states as `id="states-<name>"` blocks. This
walks them, resolves each specimen to the component that implements it, and asks
whether that component can reach each declared state.

**The resolver is the component's own `Visual spec:` JSDoc citation.** That is an
authored link, not a guess. Three earlier versions of this audit resolved by
name-matching and were wrong in both directions — they reported 154 components
"missing" states that existed, while silently skipping components they could not
name-match at all. If a specimen is not cited by any component, it is reported as
uncited rather than quietly passed.

## Current result

```
223 component specimens resolved via an authored `Visual spec:` citation
 41 specimens are not cited by any component — all 41 are `scene-*` pages
  0 components missing a state their spec declares
 54 states hand-verified rather than probed
```

Scene specimens under `preview-admin/` and `preview-site/` are excluded: a page's
"skeleton" is its composition of many component skeletons, not a state any one
component owes.

## The 54 hand-verified states

A regex probe looks for the literal word — `empty`, `error`, `loading`. Good code
names a state for what it MEANS in the domain:

| Spec says | The code calls it |
|---|---|
| `empty` on have/need | `noBasket` — everything reads as need, and it says so |
| `empty` on nutrition balance | `MIN_MEALS_FOR_A_SHAPE` — under three meals draws no shape |
| `error` on a day column | `DayColumnShort` — planned, but the kitchen cannot cover it |
| `empty` on a stock level | `'untracked'` — a dashed rail, not a zero bar |
| `disabled` on a market row | `ticked` — quiet, struck through, still there |
| `loading` on a step timer | `TimerState 'idle'` — armed, showing the full duration |

Widening the probes until these matched would have pushed the codebase toward
worse names. The `VERIFIED` map in `state-audit.py` lists each one with the
export that satisfies it, so the exemption is auditable rather than invisible.

## Deliberate non-implementations

Two states are specified and intentionally absent, documented at the point where
someone would otherwise add them:

- **`EmailButton` has no `disabled`.** No mail client honours `pointer-events`,
  so a greyed anchor still navigates. An unavailable action is omitted from the
  email, and the prose says why.
- **`Text` has no `disabled`.** A disabled control dims its whole subtree, so
  text inside one inherits it. A second grey would drift from the first.
