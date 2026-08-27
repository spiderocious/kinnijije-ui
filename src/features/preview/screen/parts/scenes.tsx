import { Link } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { ExternalLink } from '@icons';
import { DeviceFrame } from '@features/scenes/parts/scene-frame';
import { SCENE_ENTRIES } from '@features/scenes/scenes.entries';
import {
  SCENE_GROUP_BLURB,
  SCENE_GROUP_ORDER,
  type SceneEntry,
  type SceneGroup,
} from '@features/scenes/scenes.registry';

import { Demo, Note, Rule, Section, Specimen } from './preview-canvas';

/**
 * Scenes, framed for review.
 *
 * The frames exist ONLY here. At `/scenes/<id>` a scene renders full-bleed at
 * the real viewport — a frame that is present in the shipped app is a frame
 * that lied during design.
 *
 * One preview part per scene group, so a group can be reviewed side by side
 * without scrolling past forty screens.
 */

function SceneBlock({ entry }: { readonly entry: SceneEntry }) {
  return (
    <div className="mb-9 last:mb-0">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-extrabold tracking-display">{entry.label}</h3>
          <p className="text-sm text-ink-2">{entry.summary}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <code className="font-mono text-xs text-ink-3">{entry.spec}</code>
          {/* The standalone route — the only place the scene is honest. */}
          <Link
            to={`${ROUTES.SCENES}/$sceneId`}
            params={{ sceneId: entry.id }}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-blade-xs border border-ink bg-white px-3 py-1 text-xs font-extrabold shadow-drop-sm transition-transform duration-press active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
          >
            Open standalone
            <ExternalLink size={12} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6 overflow-x-auto">
        <Repeat each={[...entry.frames]}>
          {(frame: 'phone' | 'desktop') => (
            <DeviceFrame key={frame} frame={frame} height={frame === 'phone' ? 700 : 560}>
              <entry.Scene frame={frame} />
            </DeviceFrame>
          )}
        </Repeat>
      </div>

      <Show when={entry.frames.length === 1}>
        <Note>
          Phone only — the desktop has nothing extra to show here, so it is not pretended
          otherwise.
        </Note>
      </Show>
    </div>
  );
}

/** Builds one preview part per scene group. */
function groupPart(group: SceneGroup, intro: string) {
  return function ScenesGroupPart() {
    const entries = SCENE_ENTRIES.filter((entry) => entry.group === group);

    return (
      <Specimen
        title={`Scenes — ${group}`}
        spec={`${entries.length} screens`}
        description={intro}
      >
        <Rule>
          <b>Nothing on these screens is hand-authored</b> — every block is a component from the
          library. Each is also a real route: press <b>Open standalone</b> to see it at a true
          viewport with no frame and no viewer chrome.
        </Rule>

        <Section label={group.toUpperCase()}>
          <Demo tone="plain">
            <Repeat each={entries}>
              {(entry: SceneEntry) => <SceneBlock key={entry.id} entry={entry} />}
            </Repeat>
          </Demo>
        </Section>
      </Specimen>
    );
  };
}

// The blurbs live in the registry beside the group order, so the index and this
// viewer cannot drift apart — a second copy here is how one gets a group the
// other does not have.
export const SCENE_PREVIEW_PARTS = SCENE_GROUP_ORDER.map((group) => ({
  group,
  Part: groupPart(group, SCENE_GROUP_BLURB[group]),
}));
