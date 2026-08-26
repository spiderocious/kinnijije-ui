import { useEffect, useState } from 'react';
import { useParams, useSearch } from '@tanstack/react-router';

import { NotFoundScreen } from '@ui/components';

import { SCENE_ENTRIES } from '../scenes.entries';
import type { SceneFrame } from '../scenes.registry';

/** Below this the desktop composition has nowhere to put its extra column. */
const DESKTOP_MIN_PX = 900;

/**
 * One scene, standalone.
 *
 * No viewer chrome, no device frame — the scene fills the real viewport, which
 * is the only way to see whether it actually works on a phone.
 *
 * The frame is chosen by viewport unless `?frame=` overrides it, so a desktop
 * composition can be reviewed on a laptop without resizing the window.
 */
export function SceneScreen() {
  const { sceneId } = useParams({ strict: false }) as { sceneId?: string };
  const search = useSearch({ strict: false }) as { frame?: SceneFrame };

  const entry = SCENE_ENTRIES.find((scene) => scene.id === sceneId);

  const [viewportFrame, setViewportFrame] = useState<SceneFrame>(() =>
    typeof window !== 'undefined' && window.innerWidth >= DESKTOP_MIN_PX ? 'desktop' : 'phone',
  );

  useEffect(() => {
    function onResize() {
      setViewportFrame(window.innerWidth >= DESKTOP_MIN_PX ? 'desktop' : 'phone');
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (entry === undefined) return <NotFoundScreen />;

  // Fall back to a frame the scene actually ships.
  const wanted = search.frame ?? viewportFrame;
  const frame = entry.frames.includes(wanted) ? wanted : (entry.frames[0] ?? 'phone');

  const { Scene } = entry;
  return (
    <div className="flex min-h-screen flex-col">
      <Scene frame={frame} />
    </div>
  );
}

export default SceneScreen;
