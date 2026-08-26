/**
 * Icon proxy. All icon imports go through `@icons`, never `lucide-react` or
 * `blobatar` directly, so any of the three sources can be swapped in exactly
 * one place.
 *
 * Three sources, each with a job:
 *
 * 1. **koboyo** (`KoboyoIcon`) — the hand-drawn set, 184 glyphs. Carries the
 *    kitchen and food domain: pots, spoons, chopping boards, jollof, chilli,
 *    market stalls. Re-stroked at render time because koboyo ships them
 *    unstroked and they thin out below 24px. This is the system's default voice.
 * 2. **blobatar** (`Blob`, `BlobThinking`) — every creature. Deterministic,
 *    hue-locked to 205. `thinking` is the AI loader everywhere the chef is
 *    extracting, suggesting or generating.
 * 3. **lucide** — generic UI glyphs only, where koboyo has no equivalent and a
 *    hand-drawn mark would read as decoration rather than chrome. Kept
 *    deliberately narrow.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/07-icons-ui.html
 *                                                          08-icons-kitchen.html
 *                                                          09-icons-food.html
 *                                                          10-icon-weight.html
 */

/* ---------- koboyo — the hand-drawn set (default voice) ---------- */
export { KoboyoIcon } from './koboyo-icon';
export type { KoboyoIconProps, KoboyoIconName } from './koboyo-icon';
export { KOBOYO_GLYPHS, KOBOYO_ICON_NAMES } from './koboyo-data';
export type { KoboyoGlyph } from './koboyo-data';

/* ---------- blobatar — every creature ---------- */
export { Blob, BlobThinking, BLOB_EXPRESSIONS } from './blob';
export type { BlobProps, BlobExpression, BlobThinkingProps } from './blob';

/* ---------- lucide — generic chrome only ----------
   Deliberately narrow. Reach for a koboyo glyph first; add here only when the
   mark is pure UI furniture with no kitchen reading. */
export {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Info,
  Loader2,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

export type { LucideIcon, LucideProps } from 'lucide-react';
