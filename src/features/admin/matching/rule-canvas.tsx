import { useCallback, useMemo, useState } from 'react';

import {
  Background,
  Controls,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { Show } from 'meemaw';

import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';

import {
  graphToRule,
  ruleToGraph,
  unreachableNodes,
  wouldCycle,
  type NodeKind,
  type RuleGraph,
} from './graph-model';
import type { RuleThen, RuleWhen } from '../services/matching.api';

import '@xyflow/react/dist/style.css';

/**
 * The canvas: interface two from the brief.
 *
 * Drag conditions in, connect them, form a meal. It is a SECOND EDITOR over the
 * identical `match_rules` document, not a parallel system — a rule built here
 * opens in the form and vice versa, which `graph-model.test.ts` proves rather
 * than assumes.
 *
 * WHAT IT DELIBERATELY CANNOT DO: an arbitrary boolean tree. `when` is a flat
 * set of ANDed clauses, so the graph is sources feeding one AND. Offering a
 * nested OR here would produce a rule the form cannot show, and the plan is
 * explicit that the form is the reference. The branch nodes cover the case
 * people actually want — "if the time is between x and y, switch the answer".
 */

/** What each node kind is called and what it holds, for the palette. */
const PALETTE: readonly { kind: NodeKind; label: string; hint: string }[] = [
  { kind: 'has', label: 'Has all of', hint: 'rice_long_grain, tomato' },
  { kind: 'hasAny', label: 'Has any of', hint: 'beef, chicken' },
  { kind: 'without', label: 'Does not have', hint: 'pork' },
  { kind: 'mood', label: 'Mood', hint: 'tired, fast' },
  { kind: 'weight', label: 'Wants', hint: 'rice, soupy' },
  { kind: 'time', label: 'Minutes', hint: '15-40' },
  { kind: 'hour', label: 'Hour', hint: '17-23' },
  { kind: 'weather', label: 'Weather', hint: 'rainy' },
  { kind: 'city', label: 'City', hint: 'Lagos' },
];

const KIND_LABEL: Record<NodeKind, string> = {
  has: 'Has all of',
  hasAny: 'Has any of',
  without: 'Does not have',
  mood: 'Mood',
  weight: 'Wants',
  time: 'Minutes',
  hour: 'Hour',
  weather: 'Weather',
  city: 'City',
  all: 'All of these',
  serve: 'Serve',
  branch: 'If also',
};

/**
 * Node colour by role, following the plan's three kinds: source, logic,
 * output. The blade radius and the solid drop edge come from the design
 * system — no blurs anywhere.
 */
function toneFor(kind: NodeKind): string {
  if (kind === 'all') return 'border-ink bg-caution-soft';
  if (kind === 'serve') return 'border-ink bg-success-soft';
  if (kind === 'branch') return 'border-ink bg-caution-soft';
  return 'border-ink bg-sky-100';
}

interface RuleNodeData extends Record<string, unknown> {
  kind: NodeKind;
  ref: string | null;
  onRefChange: (value: string) => void;
  unreachable: boolean;
}

/** One node on the canvas. Editable in place, so there is no side panel to hunt. */
function RuleNode({ data }: NodeProps<Node<RuleNodeData>>) {
  const { kind, ref, onRefChange, unreachable } = data;
  const editable = kind !== 'all';

  return (
    <div
      className={`rounded-blade-xs border-2 p-2 shadow-drop-sm ${toneFor(kind)} ${
        unreachable ? 'opacity-60 ring-2 ring-critical' : ''
      }`}
      style={{ minWidth: 150 }}
    >
      <p className="mb-1 text-[9px] font-extrabold uppercase tracking-overline text-ink-3">
        {KIND_LABEL[kind]}
      </p>
      <Show
        when={editable}
        fallback={<p className="text-xs font-extrabold text-ink">everything above</p>}
      >
        <input
          value={ref ?? ''}
          onChange={(event) => {
            onRefChange(event.target.value);
          }}
          // `nodrag` stops React Flow stealing the pointer from the field.
          className="nodrag w-full rounded-blade-xs border border-line bg-white px-1.5 py-1 font-mono text-[11px] text-ink"
          placeholder="…"
        />
      </Show>
      <Show when={unreachable}>
        <p className="mt-1 text-[9px] font-extrabold text-critical-on">not connected</p>
      </Show>
    </div>
  );
}

export function RuleCanvas({
  when,
  then,
  branches,
  layout,
  onApply,
}: {
  readonly when: RuleWhen;
  readonly then: RuleThen;
  readonly branches: readonly { id?: string; label?: string | null; when: RuleWhen; then: RuleThen }[];
  readonly layout: RuleGraph | null;
  /** Hands the canvas's version of the rule back to the form. */
  readonly onApply: (next: { when: RuleWhen; then: RuleThen; layout: RuleGraph }) => void;
}) {
  const initial = useMemo(
    () => ruleToGraph(when, then, branches, layout),
    [when, then, branches, layout],
  );

  const [refs, setRefs] = useState<Record<string, string | null>>(
    () => Object.fromEntries(initial.nodes.map((node) => [node.id, node.ref ?? null])),
  );
  const [warning, setWarning] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<RuleNodeData>>(
    initial.nodes.map((node) => ({
      id: node.id,
      type: 'rule',
      position: { x: node.x, y: node.y },
      data: {
        kind: node.kind,
        ref: node.ref ?? null,
        unreachable: false,
        onRefChange: () => undefined,
      },
    })),
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    initial.edges.map((edge) => ({
      id: `${edge.from}->${edge.to}`,
      source: edge.from,
      target: edge.to,
    })),
  );

  /** The current graph, read back off React Flow's state. */
  const currentGraph = useCallback((): RuleGraph => {
    return {
      nodes: nodes.map((node) => ({
        id: node.id,
        kind: node.data.kind,
        x: node.position.x,
        y: node.position.y,
        ref: refs[node.id] ?? null,
      })),
      edges: edges.map((edge) => ({ from: edge.source, to: edge.target })),
    };
  }, [nodes, edges, refs]);

  const orphans = useMemo(() => unreachableNodes(currentGraph()), [currentGraph]);

  const decorated = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          ref: refs[node.id] ?? null,
          unreachable: orphans.includes(node.id),
          onRefChange: (value: string) => {
            setRefs((current) => ({ ...current, [node.id]: value }));
          },
        },
      })),
    [nodes, refs, orphans],
  );

  /**
   * Connecting two nodes, with the cycle check BEFORE the edge is added.
   *
   * A canvas that silently allows a loop is worse than no canvas: the rule it
   * produces either hangs or quietly drops a branch, and the curator cannot
   * see which. So the connection is refused and the reason is said out loud.
   */
  const onConnect = useCallback(
    (connection: Connection) => {
      const plain = edges.map((edge) => ({ from: edge.source, to: edge.target }));

      if (wouldCycle(plain, connection.source, connection.target)) {
        setWarning(
          'That would make a loop. A condition cannot depend on the thing it decides.',
        );
        return;
      }

      setWarning(null);
      setEdges((current) => addEdge(connection, current));
    },
    [edges, setEdges],
  );

  const addNode = (kind: NodeKind, hint: string): void => {
    // One node per clause: `when` holds one value per clause, so a second
    // "Mood" node would silently overwrite the first on save.
    const id = `src-${kind}`;
    if (nodes.some((node) => node.id === id)) {
      setWarning(`There is already a ${KIND_LABEL[kind].toLowerCase()} condition.`);
      return;
    }

    setWarning(null);
    setRefs((current) => ({ ...current, [id]: '' }));
    setNodes((current) => [
      ...current,
      {
        id,
        type: 'rule',
        position: { x: 40, y: 40 + current.length * 70 },
        data: {
          kind,
          ref: '',
          unreachable: true,
          onRefChange: () => undefined,
        },
      },
    ]);
    // Wired to the AND immediately: an unconnected condition does nothing,
    // and making the curator remember the wire is a trap rather than a choice.
    setEdges((current) => [...current, { id: `${id}->all`, source: id, target: 'all' }]);
    void hint;
  };

  const nodeTypes = useMemo(() => ({ rule: RuleNode }), []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {PALETTE.map((item) => (
          <Button
            key={item.kind}
            size="sm"
            variant="secondary"
            onClick={() => {
              addNode(item.kind, item.hint);
            }}
          >
            + {item.label}
          </Button>
        ))}
      </div>

      <Show when={warning !== null}>
        <Callout tone="caution" title="Cannot do that" body={warning ?? ''} />
      </Show>

      <Show when={orphans.length > 0}>
        <Callout
          tone="caution"
          title={`${String(orphans.length)} condition${orphans.length === 1 ? '' : 's'} not connected`}
          body="A condition that does not reach an outcome has no effect. The rule will fire more often than you expect."
        />
      </Show>

      <div
        className="rounded-blade border-2 border-ink shadow-drop"
        style={{ height: 460 }}
      >
        <ReactFlow
          nodes={decorated}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: false }}
        >
          <Background gap={16} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => {
            onApply(graphToRule(currentGraph()));
          }}
        >
          Use this in the form
        </Button>
        <p className="text-xs text-ink-3">
          The canvas and the form are the same rule. Positions are saved, so your layout
          survives.
        </p>
      </div>
    </div>
  );
}
