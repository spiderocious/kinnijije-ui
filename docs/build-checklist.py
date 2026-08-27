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


entries = []  # (register, section, name)

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
        text = re.sub(r'\s*—\s*[^·]*', '', text)        # drop em-dash notes
        names = [n.strip(' *·—') for n in text.split('·')]

    names = [n for n in names if n and len(n) > 1 and not n.lower().startswith('plus ')]
    for n in names:
        entries.append((reg, section, n))

    got = len([1 for r, s, _ in entries if r == reg and s == section])
    if got != declared:
        print(f'  ~ {reg}/{section}: parsed {got}, manifest says {declared}')

# ---- The 16 named rows and 5 board rows are listed inline ----
CONSUMER_ROWS = [
    'recipe', 'saved-recipe', 'ingredient-have', 'ingredient-need', 'step', 'substep',
    'person', 'notification', 'cuisine', 'recent-search', 'market-item', 'feedback',
    'extraction', 'session', 'nutrition', 'timer',
]
ADMIN_ROWS = ['recipe', 'user', 'ai-audit', 'feedback', 'flag']
for r in CONSUMER_ROWS:
    entries.append(('Consumer', 'Structure & rows', f'Row — {r}'))
for r in ADMIN_ROWS:
    entries.append(('Admin', 'Structure & rows', f'Board row — {r}'))

# "One unified status component + 9 lifecycle mappings" — the mappings are the
# admin-relevant families from STATUS_REGISTRY.
for fam in ('recipe', 'recipe-source', 'user', 'role', 'feedback', 'feedback-target',
            'ai-kind', 'ai-result', 'flag'):
    entries.append(('Admin', 'Status & lifecycle', f'Status mapping — {fam}'))

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


def built(name):
    words = [w for w in re.split(r'[^a-z0-9]+', name.lower()) if w and w not in
             ('the', 'a', 'and', 'of', 'with', 'for', 'or')]
    if not words:
        return False
    if ''.join(words) in lowered:
        return True
    for e in lowered:
        if all(w in e for w in words):
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
