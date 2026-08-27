"""Generate one barrel per @ui group, then rewrite every import in the codebase.

Run after adding any component: python3 docs/build-barrels.py


The doubled path (`@ui/primitives/button/button`) came from reading "no barrels"
off four scaffold components — but the repo already had `@ui/drawer` and
`@icons` as barrels, so the convention was there and I mis-read it.

Group barrels give `import { Button } from '@ui/primitives'`.
"""
import os
import re
import subprocess

ROOT = '/Users/feranmi/codebases/2026/cookiepot/web'
UI = os.path.join(ROOT, 'src/ui')

# Groups that get a barrel. `drawer` and `icons` already have hand-written ones.
GROUPS = [
    'primitives',
    'inputs',
    'status',
    'display',
    'feedback',
    'navigation',
    'structure',
    'domain',
    'components',
    'chat',
    'stock',
    'insights',
    'planning',
    'capture',
    'site',
    'email',
]

HEADER = {
    'primitives': 'Actions — the controls a cook or curator presses.',
    'inputs': 'Inputs — everything that takes a value, sharing the disabled/readOnly/invalid triad.',
    'status': 'Status, badges and tags — the semantic enum and the lifecycle registry.',
    'display': 'Data display — figures, stats, tables and the audit surfaces.',
    'feedback': 'Feedback — callouts, progress, tooltips and empty states.',
    'navigation': 'Navigation — the app bar, tabs and the phone tab bar.',
    'structure': 'Structure — the surfaces and the named row shapes.',
    'domain': 'Domain — the components that carry KinniJije\'s own vocabulary.',
    'components': 'App shell components — not library primitives.',
    'chat': 'Chat — the cook asking, the chef answering, every answer cited.',
    'stock': 'The standing kitchen — maintained only by what the cook already does.',
    'insights': 'Insights — observations that must show their working.',
    'planning': 'Planning — mood, constraints, the week and portions.',
    'capture': 'Capture — the three ways in. Typing always works.',
    'site': 'The marketing site — the same stance at a louder register.',
    'email': 'Email — tables only, no CSS variables. A different register with its own laws.',
}


def module_files(group_dir):
    """Every component module in a group, as (import_path, filename)."""
    out = []
    for entry in sorted(os.listdir(group_dir)):
        full = os.path.join(group_dir, entry)
        if os.path.isdir(full):
            for f in sorted(os.listdir(full)):
                if f.endswith(('.ts', '.tsx')) and not f.startswith('index'):
                    out.append(f'./{entry}/{f.rsplit(".", 1)[0]}')
        elif entry.endswith(('.ts', '.tsx')) and not entry.startswith('index'):
            out.append(f'./{entry.rsplit(".", 1)[0]}')
    return out


written = []
for group in GROUPS:
    gdir = os.path.join(UI, group)
    if not os.path.isdir(gdir):
        continue
    mods = module_files(gdir)
    lines = [
        '/**',
        f' * {HEADER[group]}',
        ' *',
        ' * GENERATED BARREL. Import from the group, never the file:',
        f" *   import {{ … }} from '@ui/{group}';",
        ' */',
        '',
    ]
    for m in mods:
        lines.append(f"export * from '{m}';")
    lines.append('')
    path = os.path.join(gdir, 'index.ts')
    with open(path, 'w') as f:
        f.write('\n'.join(lines))
    written.append((group, len(mods)))

for group, n in written:
    print(f'  @ui/{group:<12} {n} modules')

# ---- Rewrite every import in src/ ----
pattern = re.compile(r"from '@ui/([a-z-]+)/[a-z-]+/[a-z-]+'")
group_set = {g for g, _ in written}
changed = 0

for dirpath, _dirs, files in os.walk(os.path.join(ROOT, 'src')):
    for name in files:
        if not name.endswith(('.ts', '.tsx')):
            continue
        p = os.path.join(dirpath, name)
        src = open(p).read()

        def repl(match):
            g = match.group(1)
            return f"from '@ui/{g}'" if g in group_set else match.group(0)

        new = pattern.sub(repl, src)
        if new != src:
            open(p, 'w').write(new)
            changed += 1

print(f'\nrewrote imports in {changed} files')

# ---- Collapse duplicate import lines from the same barrel ----
dup = re.compile(r"^import \{([^}]+)\} from '(@ui/[a-z-]+)';$", re.M)
merged = 0
for dirpath, _dirs, files in os.walk(os.path.join(ROOT, 'src')):
    for name in files:
        if not name.endswith(('.ts', '.tsx')):
            continue
        p = os.path.join(dirpath, name)
        src = open(p).read()
        by_source = {}
        for m in dup.finditer(src):
            by_source.setdefault(m.group(2), []).append(m)
        if not any(len(v) > 1 for v in by_source.values()):
            continue

        out = src
        for source, matches in by_source.items():
            if len(matches) < 2:
                continue
            names = []
            for m in matches:
                for n in m.group(1).split(','):
                    n = n.strip()
                    if n and n not in names:
                        names.append(n)
            # Types last, alphabetical within each half — matches the repo style.
            plain = sorted(n for n in names if not n.startswith('type '))
            types = sorted(n for n in names if n.startswith('type '))
            combined = f"import {{ {', '.join(plain + types)} }} from '{source}';"
            out = out.replace(matches[0].group(0), combined, 1)
            for m in matches[1:]:
                out = out.replace(m.group(0) + '\n', '', 1)
        if out != src:
            open(p, 'w').write(out)
            merged += 1

print(f'merged duplicate barrel imports in {merged} files')
