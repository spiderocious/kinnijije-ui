/**
 * The generated illustrations, mapped to what they depict.
 *
 * These live in `web/public/illustrations/` and are the flat, hand-drawn set
 * described in backend/docs/v2/illustrations/. They are RASTER, so unlike a
 * koboyo glyph they cannot take `currentColor` and recolour with a selected
 * tile. That is the whole reason a tile still uses a glyph: a picked tile turns
 * sky-blue, and a PNG would sit there in its original ink looking broken.
 *
 * So they are used where a picture is the point and no state changes under it:
 * the hero, the thinking state, the verdict plate, and the mood and weight
 * tiles, which are big enough for the art to read and are the two screens with
 * the most character.
 */

/** Available files, so a missing one is a build error rather than a 404. */
export const ILLUSTRATION = {
  heroPot: '/illustrations/a-hero-pot.png',
  thinkingPot: '/illustrations/d-thinking-pot.png',
  heroDish: '/illustrations/e-hero-dish.png',

  rice: '/illustrations/b1-rice.png',
  beans: '/illustrations/b2-beans.png',
  yam: '/illustrations/b3-yam.png',
  tomato: '/illustrations/b4-tomato.png',
  onion: '/illustrations/b5-onion.png',
  fish: '/illustrations/b6-fish.png',

  moodHurry: '/illustrations/c2-hurry.png',
  moodUpForIt: '/illustrations/c3-up-for-it.png',
  moodComfort: '/illustrations/c4-comfort.png',

  weightSolid: '/illustrations/f1-solid.png',
  weightLight: '/illustrations/f2-light.png',
  weightSoupy: '/illustrations/f3-soupy.png',
  weightSwallow: '/illustrations/f4-swallow.png',
} as const;

/**
 * Mood tiles.
 *
 * `tired` has no illustration yet (c1-drained was never generated), so it
 * falls back to its koboyo glyph. A missing entry here is the designed default,
 * not a gap to code around.
 */
export const MOOD_ART: Readonly<Record<string, string>> = {
  fast: ILLUSTRATION.moodHurry,
  proper: ILLUSTRATION.moodUpForIt,
  comfort: ILLUSTRATION.moodComfort,
};

/** Weight tiles. `rice` and `street` fall back to their glyphs. */
export const WEIGHT_ART: Readonly<Record<string, string>> = {
  solid: ILLUSTRATION.weightSolid,
  light: ILLUSTRATION.weightLight,
  soupy: ILLUSTRATION.weightSoupy,
  swallow: ILLUSTRATION.weightSwallow,
};

/**
 * The staples that have their own drawing.
 *
 * Keyed by catalogue id. Everything else uses its koboyo glyph, which is the
 * right default: 417 items cannot each have a bespoke illustration, and the
 * glyph set already covers them consistently.
 */
export const INGREDIENT_ART: Readonly<Record<string, string>> = {
  rice_long_grain: ILLUSTRATION.rice,
  beans_brown: ILLUSTRATION.beans,
  yam: ILLUSTRATION.yam,
  tomato: ILLUSTRATION.tomato,
  onion_red: ILLUSTRATION.onion,
  titus_fish: ILLUSTRATION.fish,
};
