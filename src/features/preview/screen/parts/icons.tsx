import { useState } from 'react';
import { Repeat } from 'meemaw';

import { KOBOYO_ICON_NAMES, KoboyoIcon, type KoboyoIconName } from '@icons';

import { Demo, Grid, Note, Rule, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/07-icons-ui.html
 *                                                          08-icons-kitchen.html
 *                                                          09-icons-food.html
 *                                                          10-icon-weight.html
 */

const KITCHEN_SET: KoboyoIconName[] = [
  'cookingPot',
  'potStew',
  'woodenSpoon',
  'spatula',
  'whisk',
  'choppingBoard',
  'chefHat',
  'chefTallHat',
  'fryingPan',
  'kitchenTimer',
  'mortarPestle',
  'breadKnife',
  'kettle',
  'hob',
  'fridge',
  'freezer',
  'weighingScale',
  'shelf',
];

const FOOD_SET: KoboyoIconName[] = [
  'plateJollofRice',
  'bowlSoup',
  'plateFull',
  'couscousPlate',
  'injeraPlatter',
  'chilli',
  'tomato',
  'onion',
  'egg',
  'eggsResting',
  'bagRice',
  'bagBeans',
  'loafBread',
  'cheeseServed',
  'milkBottle',
  'wheat',
  'seedling',
  'waterDrop',
];

const UI_SET: KoboyoIconName[] = [
  'check',
  'closeCross',
  'chevronDown',
  'plus',
  'minus',
  'trash',
  'editPencil',
  'filter',
  'sortArrowsIcon',
  'searchSlash',
  'settings',
  'bookmark',
  'likeHeart',
  'ratingStar',
  'share',
  'download',
  'upload',
  'send',
];

const SIZES = [16, 20, 24, 32, 48];

function IconGrid({ names }: { readonly names: KoboyoIconName[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3">
      <Repeat each={names}>
        {(name: KoboyoIconName) => (
          <div
            key={name}
            className="flex flex-col items-center gap-2 rounded-blade-sm border border-line-2 bg-white px-2 py-3"
          >
            <KoboyoIcon name={name} size={28} />
            <span className="w-full truncate text-center font-mono text-xs text-ink-3">
              {name}
            </span>
          </div>
        )}
      </Repeat>
    </div>
  );
}

export function IconsPart() {
  const [query, setQuery] = useState('');
  const matches = KOBOYO_ICON_NAMES.filter((name) =>
    name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Specimen
      title="Icons"
      spec="07-icons-ui · 08-icons-kitchen · 09-icons-food · 10-icon-weight"
      description="184 koboyo hand-drawn glyphs, re-stroked so they hold their weight at 16px."
    >
      <Rule>
        <b>koboyo ships icons completely unstroked.</b> The drawn line is the fill shape, so it
        thins out optically as the icon shrinks and is unusable at 16–24px. Every glyph is
        re-stroked in <code>currentColor</code> at a width derived from its own viewBox —{' '}
        <code>weightPx × (viewBoxHeight ÷ renderedPx)</code> — which holds the apparent weight
        identical across a set whose viewBoxes range 74–285 units.
      </Rule>

      <Section label="THE WEIGHT RULE, PROVEN">
        <Demo>
          <div className="mb-5 flex flex-wrap items-end gap-6">
            <Repeat each={SIZES}>
              {(size: number) => (
                <div key={size} className="text-center">
                  <div className="mb-2 grid h-[56px] place-items-center">
                    <KoboyoIcon name="cookingPot" size={size} />
                  </div>
                  <span className="font-mono text-xs text-ink-3">{size}px</span>
                </div>
              )}
            </Repeat>
          </div>
          <Note>
            The same glyph at five sizes. The pen reads the same at every one — that is the
            derivation working. A fixed stroke-width would make the 16px version look bold and the
            48px version look hairline.
          </Note>
        </Demo>

        <Demo>
          <Grid cols={2}>
            <div className="text-center">
              <div className="mb-2 grid h-[72px] place-items-center">
                <KoboyoIcon name="chefHat" size={48} alone />
              </div>
              <p className="text-sm font-extrabold">alone</p>
              <p className="text-xs text-ink-3">1.15 / 0.9 above 56px — a lighter pen</p>
            </div>
            <div className="text-center">
              <div className="mb-2 grid h-[72px] place-items-center rounded-blade-sm bg-sky-soft">
                <KoboyoIcon name="chefHat" size={48} />
              </div>
              <p className="text-sm font-extrabold">boxed</p>
              <p className="text-xs text-ink-3">1.2 — the default, on any background</p>
            </div>
          </Grid>
        </Demo>
        <Note>
          For a standalone mark the fix is not more weight but colour — fill and stroke are separate
          attributes, so a soft body with a deeper outline reads better at display size than a
          fattened monochrome glyph.
        </Note>
      </Section>

      <Section label="THE KITCHEN SET">
        <Demo>
          <IconGrid names={KITCHEN_SET} />
        </Demo>
      </Section>

      <Section label="THE FOOD SET">
        <Demo>
          <IconGrid names={FOOD_SET} />
        </Demo>
        <Note>Dish and ingredient marks. These carry the domain — reach here before lucide.</Note>
      </Section>

      <Section label="THE UI SET">
        <Demo>
          <IconGrid names={UI_SET} />
        </Demo>
        <Note>
          lucide is kept for pure chrome where a hand-drawn mark would read as decoration — a
          chevron in a select, a spinner, a drag handle. Everything with a kitchen reading comes
          from koboyo.
        </Note>
      </Section>

      <Section label="ALL 184">
        <Demo>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter icons"
            aria-label="Filter icons"
            className="mb-4 h-ctrl w-full rounded-blade-sm border border-ink bg-white px-4 text-ctrl outline-none placeholder:text-ink-4 focus-visible:shadow-drop-sky"
          />
          <p className="mb-3 font-mono text-xs text-ink-3">{matches.length} icons</p>
          <IconGrid names={matches} />
        </Demo>
      </Section>
    </Specimen>
  );
}
