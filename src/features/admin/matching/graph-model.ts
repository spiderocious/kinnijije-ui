import type { RuleThen, RuleWhen } from '../services/matching.api';

/**
 * The canvas and the form, over one document.
 *
 * THE RULE THIS FILE ENFORCES: the form is the reference editor. A rule built
 * in the canvas must open in the form and mean the same thing, and vice versa.
 * The moment the canvas can express something the form cannot, the two have
 * forked and a rule means different things depending on where you opened it.
 *
 * So the canvas is not a second data model. It is a VIEW of `when` and `then`,
 * and this module is the conversion both ways. Everything the canvas can draw
 * has to survive `graphToRule(ruleToGraph(x)) === x`, which is a test, not an
 * aspiration.
 *
 * WHAT THAT COSTS, deliberately accepted: the canvas cannot express an
 * arbitrary boolean tree. `when` is a flat set of ANDed clauses, so the graph
 * is a flat set of source nodes feeding one AND. A nested OR of ANDs has no
 * representation in the form, so the canvas does not offer it — the honest
 * alternative to a canvas that silently loses work.
 */

export type NodeKind =
  /** Ingredients they must all have. */
  | 'has'
  /** Ingredients they must have at least one of. */
  | 'hasAny'
  /** Ingredients that rule the rule out. */
  | 'without'
  | 'mood'
  | 'weight'
  | 'time'
  | 'hour'
  | 'weather'
  | 'city'
  /** The implicit AND every source feeds. One per graph. */
  | 'all'
  /** The outcome. One per graph, plus one per branch. */
  | 'serve'
  /** A branch: an extra condition that switches the answer. */
  | 'branch';

export interface GraphNode {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  /** Comma-joined values, kept as text so a node is self-describing. */
  ref?: string | null;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface RuleGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Which clause of `when` each source node owns. */
const CLAUSE_OF: Partial<Record<NodeKind, keyof RuleWhen>> = {
  has: 'allOf',
  hasAny: 'anyOf',
  without: 'noneOf',
  mood: 'moods',
  weight: 'weights',
  time: 'minutes',
  hour: 'hour',
  weather: 'weather',
  city: 'cities',
};

const LIST_KINDS: readonly NodeKind[] = ['has', 'hasAny', 'without', 'mood', 'weight', 'city'];
const RANGE_KINDS: readonly NodeKind[] = ['time', 'hour'];

function listOf(ref: string | null | undefined): string[] {
  return (ref ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** `"15-40"`, `"-40"` (under 40) or `"15-"` (over 15). */
function rangeOf(ref: string | null | undefined): { min?: number | null; max?: number | null } {
  const [rawMin, rawMax] = (ref ?? '').split('-');
  const min = rawMin !== undefined && rawMin.trim() !== '' ? Number(rawMin) : null;
  const max = rawMax !== undefined && rawMax.trim() !== '' ? Number(rawMax) : null;

  return {
    ...(min !== null && !Number.isNaN(min) && { min }),
    ...(max !== null && !Number.isNaN(max) && { max }),
  };
}

function rangeToRef(range: { min?: number | null; max?: number | null } | undefined): string {
  const min = range?.min ?? null;
  const max = range?.max ?? null;
  return `${min === null ? '' : String(min)}-${max === null ? '' : String(max)}`;
}

const ALL_NODE_KINDS: readonly NodeKind[] = [
  'has',
  'hasAny',
  'without',
  'mood',
  'weight',
  'time',
  'hour',
  'weather',
  'city',
  'all',
  'serve',
  'branch',
];

function isNodeKind(value: string): value is NodeKind {
  return (ALL_NODE_KINDS as readonly string[]).includes(value);
}

/**
 * A stored layout, narrowed on the way in.
 *
 * The layout comes back from Mongo as `kind: string` because that is honestly
 * what it is — nothing stops an older or newer version of the console having
 * written a kind this one does not know. Narrowing here rather than asserting
 * means an unknown kind is DROPPED, so it cannot become a condition nobody
 * wrote; the node simply loses its saved position and is laid out afresh.
 */
export function narrowLayout(
  stored: { nodes: { id: string; kind: string; x: number; y: number; ref?: string | null }[]; edges: { from: string; to: string }[] } | null,
): RuleGraph | null {
  if (stored === null) return null;

  return {
    nodes: stored.nodes.flatMap((node) =>
      isNodeKind(node.kind)
        ? [{ id: node.id, kind: node.kind, x: node.x, y: node.y, ref: node.ref ?? null }]
        : [],
    ),
    edges: stored.edges,
  };
}

/**
 * A rule, laid out as a graph.
 *
 * Positions come from the stored layout when there is one, so a curator's
 * arrangement survives. When there is not — a rule written in the form, opened
 * in the canvas for the first time — nodes are placed in a readable column,
 * because an unpositioned graph renders every node at the origin in a pile.
 */
export function ruleToGraph(
  when: RuleWhen,
  then: RuleThen,
  branches: readonly { id?: string; label?: string | null; when: RuleWhen; then: RuleThen }[],
  stored: RuleGraph | null,
): RuleGraph {
  const positions = new Map(stored?.nodes.map((node) => [node.id, node]) ?? []);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  let row = 0;
  const place = (id: string, kind: NodeKind, ref: string | null): void => {
    const saved = positions.get(id);
    nodes.push({
      id,
      kind,
      ref,
      x: saved?.x ?? 40,
      y: saved?.y ?? 40 + row * 70,
    });
    row += 1;
  };

  // Source nodes, one per clause actually present. A clause that is absent is
  // not a constraint, so it gets no node — an empty node would read as a
  // condition the curator had set.
  for (const [kind, clause] of Object.entries(CLAUSE_OF) as [NodeKind, keyof RuleWhen][]) {
    const value = when[clause];
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      place(`src-${kind}`, kind, value.join(', '));
    } else if (typeof value === 'string') {
      place(`src-${kind}`, kind, value);
    } else {
      const range = value as { min?: number | null; max?: number | null };
      if ((range.min ?? null) === null && (range.max ?? null) === null) continue;
      place(`src-${kind}`, kind, rangeToRef(range));
    }
  }

  const sourceIds = nodes.map((node) => node.id);

  // The AND node. Present even with no sources — a catch-all rule still has an
  // outcome, and the graph has to show how it connects.
  const andSaved = positions.get('all');
  nodes.push({ id: 'all', kind: 'all', ref: null, x: andSaved?.x ?? 300, y: andSaved?.y ?? 120 });
  for (const id of sourceIds) edges.push({ from: id, to: 'all' });

  const serveSaved = positions.get('serve');
  nodes.push({
    id: 'serve',
    kind: 'serve',
    ref: `${then.mode}:${then.meals.join(', ')}`,
    x: serveSaved?.x ?? 560,
    y: serveSaved?.y ?? 120,
  });
  edges.push({ from: 'all', to: 'serve' });

  // Branches hang off the AND: each is "and additionally, if…", which is
  // exactly what the form's branch rows mean.
  branches.forEach((branch, index) => {
    const id = branch.id ?? `branch-${String(index)}`;
    const saved = positions.get(id);
    const clause = Object.entries(CLAUSE_OF).find(([, key]) => branch.when[key] !== undefined);
    const clauseKey = clause?.[1];
    const raw = clauseKey === undefined ? undefined : branch.when[clauseKey];

    nodes.push({
      id,
      kind: 'branch',
      ref:
        raw === undefined
          ? (branch.label ?? 'branch')
          : Array.isArray(raw)
            ? raw.join(', ')
            : typeof raw === 'string'
              ? raw
              : rangeToRef(raw as { min?: number | null; max?: number | null }),
      x: saved?.x ?? 300,
      y: saved?.y ?? 240 + index * 80,
    });
    edges.push({ from: 'all', to: id });

    const outId = `${id}-serve`;
    const outSaved = positions.get(outId);
    nodes.push({
      id: outId,
      kind: 'serve',
      ref: `${branch.then.mode}:${branch.then.meals.join(', ')}`,
      x: outSaved?.x ?? 560,
      y: outSaved?.y ?? 240 + index * 80,
    });
    edges.push({ from: id, to: outId });
  });

  return { nodes, edges };
}

/**
 * A graph, back into a rule.
 *
 * Unknown node kinds are IGNORED rather than guessed at. A graph carrying
 * something this version does not understand must not silently become a rule
 * with a condition nobody wrote.
 */
export function graphToRule(graph: RuleGraph): {
  when: RuleWhen;
  then: RuleThen;
  layout: RuleGraph;
} {
  const when: RuleWhen = {};

  for (const node of graph.nodes) {
    const clause = CLAUSE_OF[node.kind];
    if (clause === undefined) continue;

    if (LIST_KINDS.includes(node.kind)) {
      const values = listOf(node.ref);
      if (values.length > 0) {
        (when as Record<string, unknown>)[clause] = values;
      }
      continue;
    }

    if (RANGE_KINDS.includes(node.kind)) {
      const range = rangeOf(node.ref);
      if (Object.keys(range).length > 0) {
        (when as Record<string, unknown>)[clause] = range;
      }
      continue;
    }

    // weather: a single word.
    const value = (node.ref ?? '').trim();
    if (value !== '') (when as Record<string, unknown>)[clause] = value;
  }

  const serve = graph.nodes.find((node) => node.id === 'serve');
  const [mode, mealList] = (serve?.ref ?? 'replace:').split(':');

  return {
    when,
    then: {
      meals: listOf(mealList),
      mode: mode === 'boost' ? 'boost' : 'replace',
    },
    layout: graph,
  };
}

/**
 * Would this connection create a cycle?
 *
 * A canvas that silently allows a loop is worse than no canvas: the rule it
 * produces either hangs or quietly drops a branch, and the curator has no way
 * to see which. Checked before the edge is added, not after.
 */
export function wouldCycle(edges: readonly GraphEdge[], from: string, to: string): boolean {
  if (from === to) return true;

  // Walk forward from `to` and see whether `from` is reachable. If it is, the
  // new edge closes a loop.
  const seen = new Set<string>();
  const queue = [to];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) continue;
    if (current === from) return true;
    if (seen.has(current)) continue;
    seen.add(current);

    for (const edge of edges) {
      if (edge.from === current) queue.push(edge.to);
    }
  }

  return false;
}

/**
 * Nodes that cannot affect the outcome.
 *
 * A source node nobody wired to the AND is a condition the curator thinks they
 * set and which does nothing. Silence there is how a rule ends up firing far
 * more often than its author expected.
 */
export function unreachableNodes(graph: RuleGraph): string[] {
  const reaching = new Set<string>();
  const queue = ['serve', ...graph.nodes.filter((n) => n.kind === 'serve').map((n) => n.id)];

  // Walk BACKWARDS from every outcome: anything that cannot reach an outcome
  // has no effect on what gets served.
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined || reaching.has(current)) continue;
    reaching.add(current);

    for (const edge of graph.edges) {
      if (edge.to === current) queue.push(edge.from);
    }
  }

  return graph.nodes.filter((node) => !reaching.has(node.id)).map((node) => node.id);
}
