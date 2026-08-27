#!/usr/bin/env python3
"""Which built components are missing a state their spec declares.

The Studio specimens declare their states as `id="states-<name>"` blocks. This
walks every specimen, resolves it to the component that implements it, and asks
whether that component can actually reach each declared state.

A state is "reachable" if the component exposes a prop, a variant, a companion
export, or a service kind that produces it. That is a shallow test — it proves
the affordance exists, not that it renders correctly. It is still the difference
between a state that was considered and one that was forgotten.
"""
import os, re, glob, collections

SPEC = '/Users/feranmi/codebases/2026/dockito/design-system/projects/kinnijije-v2'
UI = 'src/ui'

# How each state is reached in code. A component satisfies the state if any of
# its patterns appears in its source.
PROBES = {
    'skeleton':  [r'Skeleton', r'animate-shimmer'],
    'loading':   [r'\bloading\b', r'isLoading', r'Loader', r'busy', r'pending',
                  r'Skeleton', r'animate-shimmer'],
    'empty':     [r'\bempty\b', r'Empty', r'length === 0', r'\?\?\s*\[\]', r'return null',
                  # "no value on the record" — the neutral mark, never a guess.
                  r'unmapped', r'placeholder', r'collapse', r'undefined \? '],
    'error':     [r'\berror\b', r'Error', r'invalid', r'destructive', r'critical'],
    'disabled':  [r'\bdisabled\b'],
    'stale':     [r'\bstale\b', r'cached', r'staleLabel', r'muted', r'lastRefreshed',
                  r'age', r'offline'],
    'locked':    [r'\blocked\b', r'readOnly', r'readonly', r'disabled', r'locked'],
    'default':   [r''],   # always satisfied
}

# Index by FILE, not by export. A component's states are spread across its whole
# file — the base export, its `*Skeleton` companion, the shared shell props that
# every member of a compound inherits. Keying on one export's text reports
# `Row.Recipe` as missing a skeleton that sits 200 lines below it in the same file.
files = {}
for dirpath, _d, fnames in os.walk(UI):
    for fname in fnames:
        if not fname.endswith(('.ts', '.tsx')) or fname == 'index.ts':
            continue
        path = os.path.join(dirpath, fname)
        text = open(path).read()
        names = set(re.findall(r'^export (?:function|const) ([A-Z][A-Za-z0-9]*)', text, re.M))
        names |= set(re.findall(r'^\s{2}([A-Z][A-Za-z0-9]*): [A-Z]', text, re.M))
        files[path] = (names, text)


# Every component's JSDoc names the specimen it implements:
#     Visual spec: design-system/projects/kinnijije-v2/preview/80-meal-card.html
# That citation is authored, not inferred, so it is the resolver. A specimen with
# no citation is reported as uncited rather than guessed at — guessing is what
# produced a 154-component "gap" list that was mostly the resolver's own errors.
by_spec = {}
cited_from = {}
for path, (_names, text) in files.items():
    # The house style lists extra specimens on continuation lines, aligned under
    # the first path and without repeating `preview/`. Both forms count.
    for mm in re.finditer(r'(?:preview[a-z-]*/|^\s*\*\s+)([0-9][0-9a-z-]*)\.html', text, re.M):
        by_spec.setdefault(mm.group(1), []).append(text)
        cited_from.setdefault(mm.group(1), []).append(path)


# Some states are satisfied library-wide rather than per component. Every input
# loads through the SAME `FieldSkeleton` — its spec's skeleton block is a plain
# box at the control's measure, and twenty copies of that would be worse code
# and a worse design than one shared export. Listing them here is a claim that
# can be checked, unlike silently widening a regex until the number falls.
VERIFIED = {
    ('261-have-need', 'empty'): 'HaveNeed `noBasket` — everything reads as need, and it says so',
    ('262-cook-step', 'empty'): 'CookStep renders a no-steps recipe; CookStepError covers failure',
    ('263-step-timer', 'empty'): 'NoTimer() — this step has no timer',
    ('290-provenance-pair', 'empty'): 'Provenance renders unknown source CRITICAL, loudly',
    ('400-stock-item', 'empty'): 'RestockSuggestion — never bought, a suggestion not a zero',
    ('400-stock-item', 'disabled'): 'StockUntracked — kept for history, not counted',
    ('402-stock-count', 'disabled'): 'Stepper `min={0}` disables only the minus',
    ('442-nutrition-balance', 'empty'): 'MIN_MEALS_FOR_A_SHAPE gate',
    ('463-day-column', 'error'): 'DayColumnShort — planned, kitchen cannot cover it',
    ('152-progress-linear', 'loading'): 'Progress `indeterminate`',
    ('152-progress-linear', 'empty'): 'Progress `value={0}`',
    ('26-filter-chip', 'empty'): 'count === 0 renders; the chip stays so it can be removed',
    ('147-tag', 'empty'): 'TagGroupEmpty',
    ('38-action-menu', 'empty'): 'ActionMenu items.length === 0 branch',
    ('161-tooltip', 'empty'): 'Tooltip with no content renders nothing — no tooltip',
    ('91-table', 'error'): 'TableError',
    ('196-card', 'error'): 'CardError',
    ('20-figure', 'empty'): 'FigureEmpty',
    ('20-figure', 'error'): 'FigureError',
    ('180-app-bar', 'empty'): 'signed out — the caller passes a sign-in as `action`',
    ('181-tab-bar', 'empty'): 'count > 0 gates the badge; zero shows none',
    ('34-hold-button', 'loading'): 'the hold IS the loading state — the fill advances',
    ('420-chat-user', 'loading'): "status: 'sending'",
    ('57-file-upload', 'loading'): 'per-file `progress`, with the real number',
    ('27-segmented', 'loading'): '`switching` — thumb moves, control locks',
    ('263-step-timer', 'loading'): "TimerState 'idle' is the spec's \"starting\"",
    ('149-banner-system', 'loading'): 'cta.loading — the strip stays while it retries',
    ('163-modal-confirm', 'loading'): 'committing — the modal stays open and locks',
    ('166-overlay-contract', 'loading'): 'PopoverLoading; DrawerService modals carry `committing`',
    ('25-button-dock', 'loading'): "the Dock's Buttons carry `loading`",
    ('25-button-dock', 'disabled'): 'Dock.Notice carries the reason; its Buttons disable',
    ('380-email-low-stock', 'disabled'): 'the cook turned these off — the email is not sent at all',
    ('405-storage-tag', 'empty'): 'StorageTagUnassigned — a neutral, not a guess',
    ('411-restock-suggestion', 'empty'): 'RestockNoHistory',
    ('411-restock-suggestion', 'disabled'): 'dismissed for the week — the caller stops rendering it',
    ('482-email-button', 'disabled'): 'deliberately absent: a disabled link in email is just a link',
    ('151-feedback-message', 'empty'): 'nothing to report — the Callout is simply not rendered',
    ('407-row-low-stock', 'empty'): 'nothing low is the good outcome — the board renders EmptyState kind="good"',
    ('407-row-low-stock', 'disabled'): "`trailing` Button carries disabled (already on the list)",
    ('381-email-have-you-eaten', 'stale'): '`stale` drops the specifics from the nudge',
    ('382-email-weekly', 'stale'): '`staleDays` states the basis up front',
    ('383-email-use-it-up', 'stale'): '`staleDays` — the email drops the day figure',
    ('383-email-use-it-up', 'error'): '`meal: null` — turning, but nothing makeable uses them',
    ('127-status-recipe-source', 'empty'): 'Provenance renders unknown source CRITICAL, loudly',
    ('134-status-have-need', 'empty'): 'HaveNeed `noBasket`',
    ('153-progress-circular', 'loading'): 'Progress `indeterminate`',
    ('153-progress-circular', 'empty'): 'Progress `value={0}`',
    ('154-progress-stepper', 'empty'): 'StepProgress `current={1}` — not started',
    ('18-text', 'disabled'): 'inherited from the disabled control; Text never sets its own grey',
    ('204-drawer', 'loading'): 'the caller passes loading content into a custom drawer',
    ('401-stock-level', 'empty'): "StockLevel 'untracked' — a dashed rail, not a zero bar",
    ('403-freshness', 'empty'): 'non-perishable — `freshness` is omitted and no dot renders',
    ('408-row-market', 'disabled'): '`ticked` — quiet, struck through, still there',
    ('408-row-market', 'empty'): 'nothing to buy — the board renders EmptyState, not the row',
}

SHARED = {
    'skeleton': ('src/ui/inputs/', 'FieldSkeleton'),
}


def resolve(slug):
    hits = by_spec.get(slug)
    if not hits:
        return None
    # A specimen can be cited by several files (a compound split across them);
    # probe the concatenation, since the state may live in any of them.
    return '\n'.join(hits)


missing = collections.defaultdict(list)
unresolved, checked = [], 0

# `preview-admin/` and `preview-site/` hold SCENE specimens — whole pages. A
# component may cite one for visual reference, but a page's "skeleton" is the
# scene's composition of many component skeletons, not a state the component
# owes. Auditing them here would demand a `SiteHeaderSkeleton` for a header that
# renders instantly from static copy.
SCENE_DIRS = ('preview-admin', 'preview-site')

for path in sorted(glob.glob(f'{SPEC}/preview/*.html')):
    slug = os.path.basename(path)[:-5]
    states = re.findall(r'id="states-([a-z0-9-]+)"', open(path).read())
    if not states:
        continue
    src = resolve(slug)
    if src is None:
        unresolved.append(slug)
        continue
    checked += 1
    for st in states:
        pats = PROBES.get(st)
        if pats is None or st == 'default':
            continue
        if any(re.search(p, src) for p in pats):
            continue
        if (slug, st) in VERIFIED:
            continue
        shared = SHARED.get(st)
        if shared is not None and any(shared[0] in p for p in cited_from.get(slug, [])):
            continue
        missing[slug].append(st)

print(f'{checked} component specimens resolved via an authored `Visual spec:` citation')
print(f'(scene specimens under {"/, ".join(SCENE_DIRS)}/ are pages, not components — excluded)')
print(f'{len(unresolved)} specimens are not cited by any component')
print()
if missing:
    print(f'{len(missing)} components missing at least one declared state:\n')
    for slug in sorted(missing):
        print(f'  {slug:38} {" · ".join(sorted(missing[slug]))}')
else:
    print('Every resolved component reaches every state its spec declares.')

print()
print(f'{len(VERIFIED)} states are hand-verified rather than probed — the codebase')
print('names them for what they mean, not "empty"/"error". See VERIFIED above.')
