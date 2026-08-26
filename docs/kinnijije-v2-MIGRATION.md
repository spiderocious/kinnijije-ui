# KinniJije v2 — "Sky kitchen" migration report

**Shipped:** 2026-08-26
**From:** `dockito/design-system/projects/kinnijije-v2/` (the canonical visual spec — 281 HTML specimens)
**To:** `cookiepot/web/src/ui/`
**Viewer:** `/preview` — 51 specimens, every component in every state

---

## The stance

**Sky kitchen** — a bespoke 61st stance, invented for this brief after all 60 in the
Studio catalogue were re-read and none fit.

- **Ground** — near-white `#F7FAFC`. Not cream, not pastel; the food and the creatures carry the warmth.
- **Colour** — sky `#38B6F0` is the **one** action colour and always wears white text. Grape `#8B7CF6` is reserved for AI provenance. Green is verified/have, amber is notice, coral is irreversible. No yellow anywhere.
- **Geometry** — **the blade**: one sharp corner, three round, on every surface.
- **Type** — Baloo 2 shouts, Nunito is chrome, JetBrains Mono is the record.
- **Depth** — a solid drop-edge that controls press *into*, never a blur. Blur is the overlay layer only.

### The law

> Every surface has exactly **one sharp corner and three round**, clockwise from top-left.

Falsifiable by counting. Two exceptions only: pills and circles.

Three subordinate rules: **sky acts, it never reports** · **provenance travels with the dish** ·
**nothing loads into a shape it will not become**.

---

## What was generated

**114 components** (95 top-level exports + 19 compound slots) across 64 module files,
each visible in the `/preview` viewer.

| Group | Components | Notes |
|---|---|---|
| Foundation | tokens, Tailwind theme, 3 icon sources | 184 koboyo glyphs + blobatar + lucide |
| Actions | Button, IconButton, PillButton, ButtonGroup, Dock, Fab, HoldButton, ContinueBar, FilterChip, Segmented | |
| Inputs | Input, Textarea, Field, Checkbox, Radio, Switch, Stepper, Select, Combobox, ChipInput, Slider | plus the shared `field-contract` |
| Status | Status (17 families / 39 states), Badge, Tag | one registry, no call-site mappings |
| Data display | Figure, Stat, Table, CursorPager, JsonInspector, DiffView | |
| Feedback | DrawerService layer (7 files), Callout, Progress, StepProgress, CircularProgress, Tooltip, EmptyState, EmptyFiltered | |
| Navigation | AppBar, TabBar, Tabs | |
| Structure | Card, Panel, 6 named Row shapes | |
| Domain — trust | Provenance, MealCard, HonestyBar, AiDisclosure, WhyThisMeal | |
| Domain — cook | HaveNeed, CookStep, StepTimer, SuggestCTA | |
| Marketing | SiteHeader, SiteHero (5 variants), SiteHowItWorks, SiteTrust, SitePricing, SiteFaq, SiteFinalCta, SiteFooter | |
| Email | EmailShell + 6 primitives, 5 templates | tables only, no CSS vars |

---

## Contracts enforced by the type system

The Studio spec states several rules as design law. Four of them are enforced at compile
time rather than left to code review — a type error is the only version of a rule that
survives a refactor by someone who has not read this document.

### 1 · The status contract

The shipped app had **no status component at all** — 13 pill call-sites, 11 of them inline
ternaries, mapping 39 named database states onto a 7-value vocabulary. Measured collisions:

| Old tone | Meanings it carried |
|---|---|
| `easy` | published · active user · AI call ok · feedback reviewed — **4 unrelated lifecycles** |
| `warn` | draft · suspended · AI error · feedback target kind — **4** |
| `verified` | seed recipe · admin role · current prompt version — **3** |
| `medium` | non-admin role · open feedback — **2, opposite valence** |

`STATUS_REGISTRY` holds all 17 families and 39 states. `Status`'s `value` prop is typed
against the chosen family, so:

```tsx
<Status kind="recipe" value="suspended" />   // ✗ does not compile
```

A genuinely unmapped value must opt in with `unmapped`, which makes "not mapped yet" a
greppable statement rather than a typo that silently renders grey.

### 2 · The provenance contract

`MealCard` takes `source` as a **required** prop, and derives `approximate` from it rather
than accepting it separately — so a card cannot claim "✓ Verified" beside a padded time.
The label strings live in `provenance.tsx` and nowhere else, which is what makes the
shipped app's three-different-Verified-labels bug structurally impossible.

An `undefined` source renders **critical** and says "Unknown provenance — report this",
because a recipe with no source is a data bug, not a neutral absence.

### 3 · The empty-state contract

An empty state with no way out is a design failure. `EmptyState` is a discriminated union:
an action is **required** unless the empty is explicitly declared `kind="good"` (the empty
review queue) or `kind="terminal"`.

```tsx
<EmptyState title="Nothing here" />          // ✗ does not compile
```

### 4 · The input triad

`disabled` / `readOnly` / `invalid` are **three independent booleans that combine**, never
one collapsed enum. `readOnly + invalid` is normal in a review flow and a state enum cannot
express it. **The shipped library had no `readOnly` at all**, which forced locked-but-readable
data to be faked with `disabled` — muting information the curator needs to read.

---

## Conventions detected and matched

Read off the four components that existed before this ship:

- **Named exports only.** No `forwardRef`, no default exports (except route-screen files, which add one for lazy loading).
- **No `index.ts` barrels.** Imports hit the full file path: `@ui/primitives/button/button`.
- **Folder-per-component**, kebab-case, descriptive filenames — the Studio's `NN-*.html` numbering does **not** carry into shipped code.
- `cn` from `@shared/utils/cn` (twMerge + clsx).
- **Icons only through the `@icons` proxy**, never `lucide-react` directly — the proxy comment says the point is a one-place swap, and that now covers three sources.
- Const `variantMap` / `sizeMap` objects with `keyof typeof` prop types.
- `readonly` props; JSDoc on the *why*, not the what.
- `meemaw` for control flow — `Repeat` / `Show` instead of `.map()` and `&&`.
- Feature-sliced routing: `features/<name>/<name>.routes.ts` + `screen/` + `screen/parts/`.

**Changed deliberately:** `AppButton` → `Button`. The `AppX` prefix was dropped for new
components (flagged and agreed before Act IV). `AppHeader` and `AppEntrypoint` keep their
names because they are app shell, not library.

---

## Files touched outside `src/ui/`

| File | Change |
|---|---|
| `src/index.css` | **Re-themed.** 12 template tokens (indigo `#4f46e5`, Quicksand) replaced with the full Sky kitchen set + named animations. |
| `tailwind.config.ts` | **Extended.** Every value reads a CSS variable, so `.counter` re-resolves density without touching a component. |
| `vite.config.ts` | Added a `manualChunks` entry splitting the koboyo icon data out of the entry bundle. |
| `src/main.tsx` | Three `@fontsource-variable` imports. |
| `src/app.tsx` | Mounts `<ToastHost/>`, `<BannerHost/>`, `<ModalHost/>` once. |
| `src/app.entrypoint.tsx` | The viewer route renders without the product header. |
| `src/app.routes.ts`, `src/shared/constants/routes.ts` | The `/preview` route. |
| `src/ui/components/*`, `src/features/entry/*` | Re-pointed off the deleted template tokens. |
| `package.json` | `blobatar@^2.5.0` + three `@fontsource-variable` packages (installed with confirmation). |

---

## Skipped, and why

### Scenes — build these in application code

The Studio's `310-*` through `384-*` files and `preview-admin/a01–a09` are **scenes**:
full-screen compositions that prove the system, not library building blocks. They are the
visual spec for application code. Roughly 50 files, including:

| Scene | Spec file |
|---|---|
| Kitchen, suggestions, recipe, cook mode | `preview/310-scene-kitchen.html` … `313-scene-cook.html` |
| Favourites, settings, onboarding, offline, auth | `preview/314` … `318` |
| The standing kitchen (dashboard, stock, market) | `preview/330` … `344` |
| Chat surfaces | `preview/350` … `355` |
| Insights, planning | `preview/360` … `374` |
| The curator's console screens | `preview-admin/a01-shell.html` … `a09-flags.html` |
| The full landing page | `preview-site/s90-scene-landing.html` |

Each composes components that now exist. Build them in `src/features/<name>/screen/`.

### Not yet built

These are named in the Studio manifest and have no component here yet. None are blocking —
each has a close neighbour that ships:

- **Chat surfaces** (`420-429`) — `Chat.AI.Source` is the third required-slot contract. The pattern is identical to `Provenance` on `MealCard`; build it when the chat feature starts.
- **Insight/planning families** (`440-465`) — `Insight.Evidence` is the same shape again.
- **Stock families** (`400-413`) — the standing kitchen. `Row.Market` and `Row.IngredientNeed` cover the row shapes; the stock-level and freshness marks are not built.
- **Capture surfaces** (`54-57`, `237-240`) — voice capture, photo capture, multi-shot tray. `ChipInput` already models their output, including the dashed AI-guess treatment.
- **Date/time inputs** (`59-62`) — no surface in the app currently needs them.
- **Charts** (`94-96`) — deferred with the insights work.

---

## Manual work remaining

1. **ESLint is scripted but not installed.** `npm run lint` fails with `eslint: command not found` — a pre-existing gap in the scaffold. No lint config was chosen, so none was added. `npx tsc -b --noEmit` passes clean.
2. **No tests.** Matches the repo (an empty `__tests__/` folder, no framework installed) and the standing preference.
3. **Dish photography** is the one real asset gap. Every hero falls through to a type-led degrade with the dish family's mark, which is specimen'd and honest — but real photographs would carry the product.
4. **`index.html`** had an uncommitted `Cookiepot` → `Kinnijije` title change before this ship. Left as found.

---

## Where the visual spec lives

```
/Users/feranmi/codebases/2026/dockito/design-system/projects/kinnijije-v2/
├── index.html            ← the specimen gallery
├── CONTRACTS.md          ← the law and the five shared contracts
├── components.md         ← the 500-entry manifest
├── preview/              ← 281 specimens (the app + shared foundation)
├── preview-admin/        ← 9 console scenes
└── preview-site/         ← 12 marketing sections
```

Every component in `src/ui/` carries a `Visual spec:` line in its JSDoc pointing back to
the HTML file it was built from. **The HTML survives as the canonical reference** — this
library is its production sibling, not its replacement.
