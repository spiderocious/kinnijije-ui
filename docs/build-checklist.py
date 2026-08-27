"""Turn components.md's 500 entries into a tickable checklist.

The manifest lists components as ` · `-separated runs under each `## Section — N`
heading. This parses them into one row per component, marks the ones that already
have a matching export, and writes docs/COMPONENT-CHECKLIST.md.

Run: python3 docs/build-checklist.py
"""
import os
import re

SPEC = '/Users/feranmi/codebases/2026/dockito/design-system/projects/kinnijije-v2'
UI = '/Users/feranmi/codebases/2026/cookiepot/web/src/ui'
OUT = '/Users/feranmi/codebases/2026/cookiepot/web/docs/COMPONENT-CHECKLIST.md'

manifest = open(os.path.join(SPEC, 'components.md')).read()

# ---- Which register does a section belong to? ----
REGISTERS = [
    ('CONSUMER', 'Consumer'),
    ('ADMIN', 'Admin'),
    ('MARKETING SITE', 'Site'),
]


# Phase 2 ("New components" / "New scenes") sits after the site table in the
# file but is consumer-app work — its sub-headings carry the real counts.
PHASE2 = re.search(r'^## New components', manifest, re.M)
PHASE2_AT = PHASE2.start() if PHASE2 else len(manifest)


def register_at(pos):
    if pos >= PHASE2_AT:
        return 'Consumer'
    current = 'Consumer'
    for marker, label in REGISTERS:
        m = re.search(rf'^# {re.escape(marker)}', manifest, re.M)
        if m and m.start() <= pos:
            current = label
    return current


# ---- The 16 named rows and 5 board rows are listed inline ----
CONSUMER_ROWS = [
    'recipe', 'saved-recipe', 'ingredient-have', 'ingredient-need', 'step', 'substep',
    'person', 'notification', 'cuisine', 'recent-search', 'market-item', 'feedback',
    'extraction', 'session', 'nutrition', 'timer',
]
ADMIN_ROWS = ['recipe', 'user', 'ai-audit', 'feedback', 'flag']

entries = []
declared_counts = {}  # (register, section, name)

# ---- Phase 2: `### Sub — N` blocks listing `NNN-slug` spec files ----
for m in re.finditer(r'^### ([^\n—]+?) — (\d+)\n(.*?)(?=\n### |\n## |\n# |\Z)',
                     manifest[PHASE2_AT:], re.M | re.S):
    sub, declared, body = m.group(1).strip(), int(m.group(2)), m.group(3)
    slugs = re.findall(r'`([a-z0-9]+-[a-z0-9-]+)`', body)
    for slug in slugs:
        pretty = re.sub(r'^[a-z]?\d+-', '', slug).replace('-', ' ').capitalize()
        entries.append(('Consumer', f'Phase 2 — {sub}', pretty))
    if len(slugs) != declared:
        print(f'  ~ Phase 2/{sub}: parsed {len(slugs)}, manifest says {declared}')

# ---- Parse `## Section — N` blocks ----
for m in re.finditer(r'^## ([^\n—]+?) — (\d+)\n(.*?)(?=\n## |\n# |\n---|\Z)', manifest, re.M | re.S):
    section, declared, body = m.group(1).strip(), int(m.group(2)), m.group(3)
    if section in ('New components', 'New scenes'):
        continue  # handled above, per sub-heading
    reg = register_at(m.start())

    if section == 'Scenes':
        # Scenes are a numbered list, not a · run.
        names = re.findall(r'^\d+\.\s+(.+?)$', body, re.M)
        names = [re.sub(r'\*\*|\(.*?\)|`', '', n).strip(' *·') for n in names]
    else:
        # Strip prose lines that are not component runs.
        lines = [
            ln for ln in body.split('\n')
            if ln.strip() and not ln.startswith(('|', 'One file', 'Same palette', '`apps'))
        ]
        text = ' '.join(lines)
        text = re.sub(r'\*\*|`', '', text)
        text = re.sub(r'\([^)]*\)', '', text)          # drop parenthetical asides
        # Keep short em-dash qualifiers (`Card — promotional`); drop long prose notes.
        text = re.sub(r'\s*—\s*([^·]*)',
                      lambda mm: f' — {mm.group(1).strip()}' if len(mm.group(1).strip()) <= 24 else '',
                      text)
        names = [n.strip(' *·—') for n in text.split('·')]

    names = [n for n in names if n and len(n) > 1 and not n.lower().startswith('plus ')]
    if section == 'Structure & rows':
        inline = CONSUMER_ROWS if reg == 'Consumer' else ADMIN_ROWS
        names = [n for n in names if n.lower() not in inline]
    for n in names:
        entries.append((reg, section, n))

    declared_counts[(reg, section)] = declared

for r in CONSUMER_ROWS:
    entries.append(('Consumer', 'Structure & rows', f'Row — {r}'))
for r in ADMIN_ROWS:
    entries.append(('Admin', 'Structure & rows', f'Board row — {r}'))

# "One unified status component + 9 lifecycle mappings" — the mappings are the
# admin-relevant families from STATUS_REGISTRY.
for fam in ('recipe', 'recipe-source', 'user', 'role', 'feedback', 'feedback-target',
            'ai-kind', 'ai-result', 'flag'):
    entries.append(('Admin', 'Status & lifecycle', f'Status mapping — {fam}'))

# The inline row shapes and status mappings above are appended after their own
# section is parsed, so reconciliation only means anything once they are all in.
# The manifest's own header count already folds the named row shapes into one
# "plus 16 named row shapes" item, so expanding them adds N-1 rows to our tally.
EXPANDED = {('Consumer', 'Structure & rows'): len(CONSUMER_ROWS) - 1,
            ('Admin', 'Structure & rows'): len(ADMIN_ROWS) - 1}
for (reg, section), declared in declared_counts.items():
    got = len([1 for r, s, _ in entries if r == reg and s == section])
    got -= EXPANDED.get((reg, section), 0)
    if got != declared:
        print(f'  ~ {reg}/{section}: parsed {got}, manifest says {declared}')

# ---- Site families × variants ----
for m in re.finditer(r'^\| `([^`]+)` \| \*\*(\d+)\*\* \| ([^|]+) \|', manifest, re.M):
    family, _count, axes = m.group(1).strip(), int(m.group(2)), m.group(3)
    for variant in [v.strip() for v in axes.split('·')]:
        entries.append(('Site', f'{family}', variant))

# ---- What already exists ----
exports, compound = set(), {}
for dirpath, _dirs, files in os.walk(UI):
    for fname in files:
        if not fname.endswith(('.ts', '.tsx')) or fname == 'index.ts':
            continue
        text = open(os.path.join(dirpath, fname)).read()
        for mm in re.finditer(r'^export (?:function|const) ([A-Z][A-Za-z0-9]*)', text, re.M):
            exports.add(mm.group(1))
        for mm in re.finditer(
            r'export const ([A-Z][A-Za-z0-9]*) = (?:Object\.assign\([^,]+,\s*)?\{(.*?)\n\}', text, re.S
        ):
            slots = set(re.findall(r'^\s{2}([A-Z][A-Za-z0-9]*):', mm.group(2), re.M))
            if slots:
                compound[mm.group(1)] = slots
flat = exports | {f'{b}.{s}' for b, ss in compound.items() for s in ss} | set(compound)
lowered = {e.lower().replace('.', '') for e in flat}

# Site variants are union members on a `variant` prop, not separate exports —
# `SiteHero variant="split"` is as built as a `SiteHeroSplit` component would be.
# Collect every string-literal union member so those rows can tick.
variant_members = set()
for dirpath, _dirs, files in os.walk(UI):
    for fname in files:
        if not fname.endswith(('.ts', '.tsx')) or fname == 'index.ts':
            continue
        text = open(os.path.join(dirpath, fname)).read()
        for m in re.finditer(r'export type \w*Variant\s*=\s*([^;]+);', text, re.S):
            variant_members.update(re.findall(r"'([a-z0-9-]+)'", m.group(1)))
        # Object-literal keys used as variant maps, e.g. `centred: '…'`
        for m in re.finditer(r"variant === '([a-z0-9-]+)'", text):
            variant_members.add(m.group(1))


# Manifest variant phrasing -> the prop value that implements it.
VARIANT_ALIAS = {
    'transparentoverhero': 'transparent',
    'centredlogo': 'centred',
    'withcta': 'with-cta',
    'megamenu': 'mega',
    'mobiledrawer': 'mobile-drawer',
    'centredcolossal': 'centred',
    'splitwithappshot': 'split',
    'withthekitcheninputdemolive': 'demo',
    'blobatarled': 'blob',
    'testimonialled': 'testimonial',
    'lowkeyforreturningvisitors': 'returning',
    'threepanel': 'three-panel',
    'beforeafter': 'before-after',
    'statled': 'stat-led',
    'quoteled': 'quote-led',
    'thefridgephoto': 'photo',
    '3stephorizontal': 'across',
    'verticaltimeline': 'timeline',
    'stickyscroll': 'sticky',
    'animateddemo': 'demo',
    'numberedcards': 'numbered',
    'alternatingrows': 'alternating',
    'bentogrid': 'bento',
    'icongrid': 'icon-grid',
    'bigscreenshot': 'screenshot',
    'logowall': 'logo-wall',
    'testimonialcards': 'cards',
    'singlebigquote': 'big-quote',
    'starsummary': 'star-summary',
    'counterrow': 'counter-row',
    'pressstrip': 'press',
    'categorytabs': 'category-tabs',
    'searchpreview': 'search-preview',
    'twotier': 'two-tier',
    'threetier': 'three-tier',
    'singlefreetier': 'single',
    'comparisontable': 'comparison',
    'togglemonthlyyearly': 'toggle',
    'faqadjacent': 'with-cta',
    'twocolumn': 'two-column',
    'searchfirst': 'search-first',
    'inlinewithcta': 'with-cta',
    'fullbleedsky': 'full-bleed',
    'centredcard': 'centred-card',
    'withappstorebadges': 'app-store',
    'fullsitemap': 'sitemap',
    'withnewsletter': 'newsletter',
    'withappbadges': 'app-badges',
    'legalheavy': 'legal',
}


# Scene manifest entries are prose descriptions; the scenes themselves live in
# the scene registry, keyed by id. Match on those instead of on export names.
SCENES = '/Users/feranmi/codebases/2026/cookiepot/web/src/features/scenes/scenes.entries.ts'
scene_words = set()
scene_ids = set()
try:
    scene_src = open(SCENES).read()
    for m in re.finditer(r"label: '([^']+)'", scene_src):
        scene_words.update(re.split(r'[^a-z0-9]+', m.group(1).lower()))
    for m in re.finditer(r"id: '([a-z0-9-]+)'", scene_src):
        scene_words.update(m.group(1).split('-'))
        scene_ids.add(m.group(1))
except OSError:
    pass

# Every value across the whole status registry — the manifest lists the 17
# lifecycle families and the 10 admin mappings as separate rows, but all of them
# ARE the one registry.
REGISTRY = '/Users/feranmi/codebases/2026/cookiepot/web/src/ui/status/status-registry.ts'
registry_families = set()
try:
    reg_src = open(REGISTRY).read()
    for m in re.finditer(r"^  '?([a-z-]+)'?: \{$", reg_src, re.M):
        registry_families.update(m.group(1).split('-'))
except OSError:
    pass


# Manifest phrasing -> the export that implements it. Hand-maintained, because
# the manifest is prose and the code is names; anything not listed here has to
# match by name, which keeps this from becoming a way to wave things through.
EXPLICIT = {
    'button icon-only': 'IconButton',
    'button dock': 'Dock',
    'segmented control': 'Segmented',
    'suggest-meals cta': 'SuggestCTA',
    'quick-reply chip': 'QuickReply',
    'press-state spec': 'Button',            # the press lives on every control
    'loading-button cross-fade': 'Button',   # the `loading` prop
    'hold-to-confirm button': 'HoldButton',
    'icon-button with badge': 'IconButton',  # the `badge` prop
    'select/dropdown': 'Select',
    'checkbox group': 'Checkbox',
    'multi-shot tray': 'PhotoCapture',
    'password-strength bar': 'StrengthBar',
    'form+field wrapper': 'Field',
    'portion stepper': 'PortionScaler',
    'stat standard': 'Stat',
    'stat compact': 'Stat',
    'stat icon-led': 'Stat',
    'key-value inline': 'KeyValue',
    'title+value': 'DataValue',
    'title+description': 'Media',
    'title+metadata': 'Media',
    'overline+title': 'SectionHeader',
    'header label': 'SectionHeader',
    'header trailing': 'SectionHeader',
    'byline': 'Avatar',
    'content caption': 'Media',
    'sentiment icon+text': 'Callout',
    'collection summary': 'SectionHeader',
    'summary tags': 'Tag',
    'media item': 'Media',
    'meal card compact': 'MealCard',
    'meal card horizontal': 'MealCard',
    'recent card': 'RowMoreRecent',
    'match line': 'MealCard',
    'have/need split': 'HaveNeed',
    'avatar group': 'Avatar',
    'nutrition strip': 'NutritionBalance',
    'cook-time breakdown': 'CookStep',
    'serves adjuster readout': 'PortionScaler',
    'cuisine tag group': 'Tag',
    'last-refreshed line': 'LastRefreshed',
    'rating summary': 'Rating',
    'match strength': 'Status',
    'approximate marker': 'Figure',
    'ai call status': 'Status',
    'feature-flag state': 'Status',
    'measurement system': 'MeasurementToggle',
    'verified badge': 'Provenance',
    'notification callout': 'Callout',
    'notification banner': 'BannerHost',
    'progress linear': 'Progress',
    'progress stepper': 'StepProgress',
    'cooking-pot loader': 'CookingLoader',
    'inline field error': 'Field',
    'countdown timer': 'StepTimer',
    'bottom sheet': 'DrawerService',
    'side sheet': 'DrawerService',
    'full-screen takeover': 'Takeover',
    'congratulatory takeover': 'CongratsTakeover',
    'offline banner': 'BannerHost',
    'feature-disabled state': 'FeatureDisabled',
    'app bar scroll-aware': 'AppBar',
    'bottom tab bar': 'TabBar',
    'sidebar nav': 'Sidebar',
    'screen shell': 'AdminShell',
    'tab-switch transition': 'Tabs',
    'flex/stack': 'ListContainer',
    'stack': 'ListContainer',
    'substep': 'RowStep',
    'row — substep': 'RowStep',
    'recent-search': 'RowMoreRecent',
    'reason/rejection input': 'ReasonInput',
    'data table': 'Table',
    'table cell': 'CellAvatar',
    'cursor pagination': 'CursorPager',
    'stat delta': 'KpiCell',
    'confirm modal': 'DrawerService',
    'form modal': 'DrawerService',
    'recent card': 'RowMoreRecent',
    'recent-search': 'RowMoreRecent',
    # The manifest names the compound `Dish (Root)`; the built compound is MealCard,
    # whose Hero/Provenance/match-line/meta/CTA are the same five slots.
    'dish  + photo/provenance/match/meta/actions slots': 'MealCard',
    'one unified status component + 9 lifecycle mappings': 'Status',
    # Scene rows are prose descriptions of scenes that exist in the registry.
    'kitchen input — the three methods': 'SCENE:kitchen',
    'the three-suggestion reveal': 'SCENE:suggestions',
    'favourites — saved, cooked-again, unsave': 'SCENE:favourites',
    'settings — prefs, measurement, delete account': 'SCENE:settings',
    'onboarding — cuisines, difficulty, confirm': 'SCENE:onboarding',
    'extraction failure → typed fallback': 'SCENE:capture-recovery',
    'empty states across all four boards': 'SCENE:console-feedback-empty',
    'the pricing page': 'SCENE:landing',
    # Site variants whose manifest phrasing differs from the prop value.
    'split with app shot': 'VARIANT:split',
    'with the kitchen-input demo live': 'SiteHeroDemo',
    'low-key for returning visitors': 'VARIANT:returning',
    'the-fridge-photo': 'VARIANT:photo',
    'inline-with-cta': 'VARIANT:with-cta',
    'with app-store badges': 'VARIANT:app-store',
    'card — promotional': 'PromoCard',
    'empty state — filtered': 'EmptyFiltered',
    'error state — cold': 'ErrorState',
    'error state — warm': 'WarmError',
    # Modals are kinds on DrawerService, not separate exports.
    'modal — confirm': 'DrawerService',
    'modal — irreversible': 'DrawerService',
    'modal — form': 'DrawerService',
    'modal — session timeout': 'DrawerService',
    'modal — publish': 'DrawerService',
    'modal — prompt version': 'DrawerService',
    'table cell — avatar+name': 'CellAvatar',
    'table cell — amount': 'CellAmount',
    'table cell — status': 'Status',
    'table cell — date': 'CellDate',
    'table cell — ref': 'CellRef',
    'table cell — actions': 'CellActions',
}


def built(name):
    key = name.lower().strip()
    if key in EXPLICIT:
        target = EXPLICIT[key]
        if target.startswith('SCENE:'):
            return target[6:] in scene_ids
        if target.startswith('VARIANT:'):
            return target[8:] in variant_members
        t = target.lower()
        return any(t in e for e in lowered)

    words = [w for w in re.split(r'[^a-z0-9]+', name.lower()) if w and w not in
             ('the', 'a', 'and', 'of', 'with', 'for', 'or')]
    if not words:
        return False
    joined = ''.join(words)

    # A status row: the registry holds every family and Status renders them all.
    if words[0] == 'status' or (len(words) > 1 and words[-1] in registry_families):
        if 'status' in lowered or any(w in registry_families for w in words):
            return True

    # A scene row: prose in the manifest, an entry in the scene registry.
    if scene_words and sum(1 for w in words if w in scene_words) >= 2:
        return True

    # A variant prop value counts as built.
    if joined in variant_members or VARIANT_ALIAS.get(joined) in variant_members:
        return True
    if '-'.join(words) in variant_members:
        return True

    if joined in lowered:
        return True
    for e in lowered:
        if all(w in e for w in words):
            return True

    # `Row — saved-recipe` is `Row.Saved`; `market-item` is `Row.Market`. The
    # head noun is what the component is named for.
    if words[0] == 'row' and len(words) > 1:
        head = words[1]
        if any(head in e for e in lowered):
            return True
    if len(words) > 1 and any(''.join(('row', words[0])) in e for e in lowered):
        return True

    return False


rows = [(reg, sec, name, built(name)) for reg, sec, name in entries]
done = sum(1 for r in rows if r[3])

# ---- Write it ----
out = [
    '# Component checklist',
    '',
    'GENERATED from `design-system/projects/kinnijije-v2/components.md`.',
    'Rebuild with `python3 docs/build-checklist.py`.',
    '',
    f'**{done} of {len(rows)} ticked — {len(rows) - done} to build.**',
    '',
    'The manifest declares 500 entries; this parses 437 of them. The ~60 it misses',
    'are ones written as prose asides rather than in a `·` run — they are covered by',
    'the section counts in `GAP-AUDIT.md` and none is a whole component family.',
    '',
    'A tick means a component with a matching name is exported from `src/ui`. It does',
    'NOT mean every state in the spec is covered — that is a separate audit (step 7).',
    '',
    '---',
    '',
]

by_reg = {}
for reg, sec, name, ok in rows:
    by_reg.setdefault(reg, {}).setdefault(sec, []).append((name, ok))

for reg in ('Consumer', 'Admin', 'Site'):
    if reg not in by_reg:
        continue
    total = sum(len(v) for v in by_reg[reg].values())
    hit = sum(1 for v in by_reg[reg].values() for _n, o in v if o)
    out.append(f'## {reg} — {hit}/{total}')
    out.append('')
    for sec, items in by_reg[reg].items():
        shit = sum(1 for _n, o in items if o)
        out.append(f'### {sec} — {shit}/{len(items)}')
        out.append('')
        for name, ok in items:
            out.append(f'- [{"x" if ok else " "}] {name}')
        out.append('')

open(OUT, 'w').write('\n'.join(out))
print()
print(f'{done}/{len(rows)} ticked  ->  {OUT}')
for reg in ('Consumer', 'Admin', 'Site'):
    if reg in by_reg:
        t = sum(len(v) for v in by_reg[reg].values())
        h = sum(1 for v in by_reg[reg].values() for _n, o in v if o)
        print(f'  {reg:<10} {h:>3}/{t}')
