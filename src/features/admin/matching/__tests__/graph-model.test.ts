import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  graphToRule,
  narrowLayout,
  ruleToGraph,
  unreachableNodes,
  wouldCycle,
  type RuleGraph,
} from '../graph-model';

/**
 * THE TEST THAT DECIDES WHETHER THE CANVAS SHIPS.
 *
 * The plan is explicit: the form is the reference editor, and a canvas feature
 * that cannot round-trip through it does not ship. A rule built in one editor
 * must open in the other and mean the same thing — otherwise the two have
 * forked and a rule means different things depending on where you opened it.
 *
 * So every clause the form can express is round-tripped here. If somebody adds
 * a canvas node for something `when` cannot hold, one of these fails.
 */
describe('round trip', () => {
  const cases: { name: string; when: Record<string, unknown>; then: Record<string, unknown> }[] = [
    {
      name: 'ingredients they must all have',
      when: { allOf: ['rice_long_grain', 'tomato'] },
      then: { meals: ['meal_a'], mode: 'replace' },
    },
    {
      name: 'any-of and none-of together',
      when: { anyOf: ['beef', 'chicken'], noneOf: ['pork'] },
      then: { meals: ['meal_a'], mode: 'replace' },
    },
    {
      name: 'moods and weights',
      when: { moods: ['tired', 'fast'], weights: ['rice'] },
      then: { meals: ['meal_a', 'meal_b'], mode: 'replace' },
    },
    {
      name: 'a time window with both bounds',
      when: { minutes: { min: 15, max: 40 } },
      then: { meals: ['meal_a'], mode: 'replace' },
    },
    {
      name: 'a one-sided time window',
      when: { minutes: { max: 40 } },
      then: { meals: ['meal_a'], mode: 'replace' },
    },
    {
      name: 'an hour window that wraps midnight',
      when: { hour: { min: 22, max: 2 } },
      then: { meals: ['meal_a'], mode: 'replace' },
    },
    {
      name: 'weather',
      when: { weather: 'rainy' },
      then: { meals: ['meal_a'], mode: 'replace' },
    },
    {
      name: 'cities',
      when: { cities: ['Lagos', 'Abuja'] },
      then: { meals: ['meal_a'], mode: 'replace' },
    },
    {
      name: 'boost rather than replace',
      when: { moods: ['comfort'] },
      then: { meals: ['meal_a'], mode: 'boost' },
    },
    {
      name: 'a catch-all with no conditions',
      when: {},
      then: { meals: ['meal_a'], mode: 'replace' },
    },
    {
      name: 'every clause at once',
      when: {
        allOf: ['rice_long_grain'],
        anyOf: ['tomato', 'tomato_paste'],
        noneOf: ['beef'],
        moods: ['tired'],
        weights: ['rice'],
        minutes: { min: 0, max: 40 },
        hour: { min: 17, max: 23 },
        weather: 'rainy',
        cities: ['Lagos'],
      },
      then: { meals: ['meal_a', 'meal_b'], mode: 'replace' },
    },
  ];

  for (const testCase of cases) {
    it(`survives: ${testCase.name}`, () => {
      const graph = ruleToGraph(
        testCase.when as never,
        testCase.then as never,
        [],
        null,
      );
      const back = graphToRule(graph);

      assert.deepEqual(back.when, testCase.when, 'the conditions changed');
      assert.deepEqual(back.then.meals, testCase.then.meals, 'the meals changed');
      assert.equal(back.then.mode, testCase.then.mode, 'the mode changed');
    });
  }

  it('keeps the curator positions when there is a stored layout', () => {
    const stored: RuleGraph = {
      nodes: [{ id: 'src-mood', kind: 'mood', x: 999, y: 888, ref: 'tired' }],
      edges: [],
    };

    const graph = ruleToGraph(
      { moods: ['tired'] } as never,
      { meals: ['meal_a'], mode: 'replace' } as never,
      [],
      stored,
    );

    const moodNode = graph.nodes.find((node) => node.id === 'src-mood');
    assert.equal(moodNode?.x, 999);
    assert.equal(moodNode?.y, 888);
  });

  it('lays out readably when there is no stored layout', () => {
    // Without this every node renders at the origin in a pile.
    const graph = ruleToGraph(
      { moods: ['tired'], weights: ['rice'] } as never,
      { meals: ['meal_a'], mode: 'replace' } as never,
      [],
      null,
    );

    const ys = graph.nodes.map((node) => node.y);
    assert.equal(new Set(ys).size > 1, true, 'nodes must not share one position');
  });

  it('gives a branch its own condition node and outcome', () => {
    const graph = ruleToGraph(
      { moods: ['tired'] } as never,
      { meals: ['meal_a'], mode: 'replace' } as never,
      [
        {
          id: 'b1',
          label: 'in a hurry',
          when: { minutes: { max: 15 } } as never,
          then: { meals: ['meal_quick'], mode: 'replace' } as never,
        },
      ],
      null,
    );

    assert.ok(graph.nodes.some((node) => node.id === 'b1' && node.kind === 'branch'));
    assert.ok(graph.nodes.some((node) => node.id === 'b1-serve'));
    // The branch hangs off the AND, which is what "and additionally, if…" means.
    assert.ok(graph.edges.some((edge) => edge.from === 'all' && edge.to === 'b1'));
  });

  it('ignores a node kind it does not understand', () => {
    // A graph from a newer version must not silently become a rule with a
    // condition nobody wrote.
    const graph: RuleGraph = {
      nodes: [
        { id: 'src-mood', kind: 'mood', x: 0, y: 0, ref: 'tired' },
        { id: 'mystery', kind: 'telepathy' as never, x: 0, y: 0, ref: 'whatever' },
        { id: 'serve', kind: 'serve', x: 0, y: 0, ref: 'replace:meal_a' },
      ],
      edges: [],
    };

    assert.deepEqual(graphToRule(graph).when, { moods: ['tired'] });
  });

  it('drops an empty source node rather than writing an empty clause', () => {
    const graph: RuleGraph = {
      nodes: [
        { id: 'src-mood', kind: 'mood', x: 0, y: 0, ref: '' },
        { id: 'serve', kind: 'serve', x: 0, y: 0, ref: 'replace:meal_a' },
      ],
      edges: [],
    };

    // An empty clause would read as a constraint the curator had set.
    assert.deepEqual(graphToRule(graph).when, {});
  });
});

describe('narrowLayout', () => {
  it('returns null for no layout', () => {
    assert.equal(narrowLayout(null), null);
  });

  it('keeps nodes whose kind it understands', () => {
    const narrowed = narrowLayout({
      nodes: [{ id: 'src-mood', kind: 'mood', x: 10, y: 20, ref: 'tired' }],
      edges: [{ from: 'src-mood', to: 'all' }],
    });

    assert.equal(narrowed?.nodes.length, 1);
    assert.equal(narrowed?.nodes[0]?.kind, 'mood');
  });

  /**
   * The untrusted-boundary case. A layout comes back from Mongo as
   * `kind: string`, and an older or newer console may have written a kind this
   * one does not know. Dropping it means the node loses its saved position and
   * gets laid out afresh — asserting it into the union instead would let an
   * unknown kind become a condition nobody wrote.
   */
  it('drops a node kind it does not understand', () => {
    const narrowed = narrowLayout({
      nodes: [
        { id: 'src-mood', kind: 'mood', x: 10, y: 20, ref: 'tired' },
        { id: 'future', kind: 'telepathy', x: 30, y: 40, ref: 'x' },
      ],
      edges: [],
    });

    assert.deepEqual(
      narrowed?.nodes.map((node) => node.id),
      ['src-mood'],
    );
  });
});

describe('wouldCycle', () => {
  const edges = [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
  ];

  it('refuses a self-connection', () => {
    assert.equal(wouldCycle(edges, 'a', 'a'), true);
  });

  it('refuses an edge that closes a loop', () => {
    // c already reaches nothing, but a -> b -> c means c -> a loops.
    assert.equal(wouldCycle(edges, 'c', 'a'), true);
  });

  it('allows an edge that does not loop', () => {
    assert.equal(wouldCycle(edges, 'a', 'c'), false);
    assert.equal(wouldCycle(edges, 'c', 'd'), false);
  });

  it('allows the first edge in an empty graph', () => {
    assert.equal(wouldCycle([], 'a', 'b'), false);
  });
});

describe('unreachableNodes', () => {
  it('finds a source node nobody wired up', () => {
    // The failure this catches: a curator adds a condition, forgets to
    // connect it, and the rule fires far more often than they expected with
    // nothing anywhere saying why.
    const graph: RuleGraph = {
      nodes: [
        { id: 'src-mood', kind: 'mood', x: 0, y: 0, ref: 'tired' },
        { id: 'orphan', kind: 'weight', x: 0, y: 0, ref: 'rice' },
        { id: 'all', kind: 'all', x: 0, y: 0, ref: null },
        { id: 'serve', kind: 'serve', x: 0, y: 0, ref: 'replace:meal_a' },
      ],
      edges: [
        { from: 'src-mood', to: 'all' },
        { from: 'all', to: 'serve' },
      ],
    };

    assert.deepEqual(unreachableNodes(graph), ['orphan']);
  });

  it('reports nothing when everything reaches an outcome', () => {
    const graph = ruleToGraph(
      { moods: ['tired'], weights: ['rice'] } as never,
      { meals: ['meal_a'], mode: 'replace' } as never,
      [],
      null,
    );

    assert.deepEqual(unreachableNodes(graph), []);
  });
});
