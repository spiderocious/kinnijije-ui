import { Link } from '@tanstack/react-router';
import { Repeat } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { KoboyoIcon } from '@icons';
import { SectionHeader } from '@ui/structure';

import { SCENE_ENTRIES } from '../scenes.entries';
import {
  SCENE_GROUP_BLURB,
  SCENE_GROUP_ORDER,
  type SceneEntry,
  type SceneGroup,
} from '../scenes.registry';

/**
 * Every scene, listed. The way in when you know the name but not the id.
 */
export function SceneIndexScreen() {
  const buckets = SCENE_GROUP_ORDER.map((group) => ({
    group,
    entries: SCENE_ENTRIES.filter((entry) => entry.group === group),
  })).filter((bucket) => bucket.entries.length > 0);

  return (
    <div className="mx-auto max-w-[880px] px-6 py-11">
      <header className="mb-8 flex items-end gap-4 border-b-bold border-ink pb-4">
        <h1 className="flex-1 font-display text-3xl font-extrabold leading-none tracking-display">
          Scenes
        </h1>
        <span className="font-mono text-xs text-ink-3">{SCENE_ENTRIES.length} screens</span>
      </header>

      <p className="mb-9 max-w-[70ch] text-md text-ink-2">
        Ordered the way a new cook meets the product — landing, first run, then the loop, then
        everything that only means something once they have cooked. Each is a real screen at a real
        viewport, no viewer chrome. Add <code className="font-mono text-sm">?frame=desktop</code> to
        force the desktop composition.
      </p>

      <Repeat each={buckets}>
        {(bucket: { group: SceneGroup; entries: SceneEntry[] }) => (
          <section key={bucket.group} className="mb-9">
            <SectionHeader title={bucket.group} count={bucket.entries.length} />
            <p className="mb-3 mt-1 text-sm text-ink-3">{SCENE_GROUP_BLURB[bucket.group]}</p>

            <ul className="flex flex-col gap-2">
              <Repeat each={bucket.entries}>
                {(entry: SceneEntry) => (
                  <li key={entry.id}>
                    <Link
                      to={`${ROUTES.SCENES}/$sceneId`}
                      params={{ sceneId: entry.id }}
                      className="flex items-center gap-4 rounded-blade border border-line-2 bg-white px-4 py-3 transition-colors hover:border-sky-edge hover:bg-sky-soft"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-md font-extrabold tracking-display">
                          {entry.label}
                        </span>
                        <span className="block text-sm text-ink-2">{entry.summary}</span>
                        <span className="mt-1 block font-mono text-xs text-ink-4">
                          {entry.spec} · {entry.frames.join(' + ')}
                        </span>
                      </span>
                      <KoboyoIcon name="arrowRight" size={18} className="shrink-0 text-ink-3" />
                    </Link>
                  </li>
                )}
              </Repeat>
            </ul>
          </section>
        )}
      </Repeat>
    </div>
  );
}

export default SceneIndexScreen;
