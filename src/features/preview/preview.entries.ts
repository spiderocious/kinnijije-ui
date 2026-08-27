import type { PreviewEntry } from './preview.registry';

import {
  DurationInputPart,
  LoadingStatesPart,
  PromoCardPart,
  TypographyPart,
} from './screen/parts/loading-states';
import {
  CounterActionsPart,
  CounterBoardPart,
  CounterEditorsPart,
} from './screen/parts/counter-more';
import {
  SiteBodyPart,
  SiteClosersPart,
  SiteHeaderHeroPart,
} from './screen/parts/site-variants';
import { PalettePart } from './screen/parts/palette';
import { TypePart } from './screen/parts/type';
import { GeometryPart } from './screen/parts/geometry';
import { BladePart } from './screen/parts/blade';
import { MotionPart } from './screen/parts/motion';
import { ElevationPart } from './screen/parts/elevation';
import { IconsPart } from './screen/parts/icons';
import { BlobatarPart } from './screen/parts/blobatar';
import { DensityPart } from './screen/parts/density';
import { ButtonsPart } from './screen/parts/buttons';
import {
  FilterChipPart,
  IconButtonPart,
  PillButtonPart,
  SegmentedPart,
} from './screen/parts/button-variants';
import {
  ButtonGroupPart,
  ContinueBarPart,
  DockPart,
  FabPart,
  HoldButtonPart,
  SuggestCtaPart,
} from './screen/parts/action-surfaces';
import {
  FieldPart,
  InputPart,
  SelectionPart,
  TextareaPart,
} from './screen/parts/inputs-base';
import {
  ChipInputPart,
  ComboboxPart,
  SelectPart,
  SliderPart,
  StepperPart,
} from './screen/parts/inputs-pickers';
import { BadgeTagPart, StatusPart } from './screen/parts/status';
import { DrawerPart } from './screen/parts/drawer';
import { FigurePart, MealCardPart, ProvenancePart, StatPart } from './screen/parts/meal';
import { CardPart, EmptyStatePart, RowsPart } from './screen/parts/structure';
import {
  CalloutPart,
  NavigationPart,
  ProgressPart,
  TooltipPart,
} from './screen/parts/feedback-nav';
import { CookStepPart, HaveNeedPart, HonestyPart } from './screen/parts/cook';
import { AuditPart, ConsolePart, TablePart } from './screen/parts/counter';
import { EmailPart, SitePart } from './screen/parts/site-email';
import {
  CapturePart,
  ChatPart,
  InsightsPart,
  PlanningPart,
  ShellPart,
  StockPart,
} from './screen/parts/families';
import {
  InputsDatePart,
  InputsDomainPart,
  InputsEditorsPart,
  InputsNumericPart,
  InputsSecurityPart,
  InputsUploadPart,
} from './screen/parts/inputs-more';
import {
  ChartsPart,
  ContentPart,
  LinksPart,
  ValuePairsPart,
} from './screen/parts/display-more';
import {
  CelebrationPart,
  ErrorStatesPart,
  PopoverPart,
} from './screen/parts/feedback-more';
import { SCENE_PREVIEW_PARTS } from './screen/parts/scenes';
import { SCENE_ENTRIES } from '@features/scenes/scenes.entries';

/**
 * Every specimen, in sidebar order.
 *
 * Add an entry here the moment a component is built — never batch. Each entry's
 * `Part` is a preview component with a descriptive filename (`buttons.tsx`,
 * never `21-buttons.tsx`).
 */
/** One entry per scene group that actually has scenes. */
const SCENE_ENTRIES_FOR_PREVIEW: PreviewEntry[] = SCENE_PREVIEW_PARTS.filter(({ group }) =>
  SCENE_ENTRIES.some((scene) => scene.group === group),
).map(({ group, Part }) => ({
  id: `scenes-${group.toLowerCase().replace(/\s+/g, '-')}`,
  label: group,
  group: 'Scenes' as const,
  Part,
}));

export const PREVIEW_ENTRIES: readonly PreviewEntry[] = [
  /* ---------- Foundation ---------- */
  { id: 'palette', label: 'Palette', group: 'Foundation', Part: PalettePart },
  { id: 'type', label: 'Type', group: 'Foundation', Part: TypePart },
  { id: 'typography', label: 'Heading · Text · Caption', group: 'Foundation', Part: TypographyPart },
  { id: 'geometry', label: 'Geometry', group: 'Foundation', Part: GeometryPart },
  { id: 'blade', label: 'The blade', group: 'Foundation', Part: BladePart },
  { id: 'motion', label: 'Motion', group: 'Foundation', Part: MotionPart },
  { id: 'elevation', label: 'Elevation', group: 'Foundation', Part: ElevationPart },
  { id: 'icons', label: 'Icons', group: 'Foundation', Part: IconsPart },
  { id: 'blobatar', label: 'Blobatar', group: 'Foundation', Part: BlobatarPart },
  { id: 'density', label: 'Density', group: 'Foundation', Part: DensityPart },

  /* ---------- Actions ---------- */
  { id: 'button', label: 'Button', group: 'Actions', Part: ButtonsPart },
  { id: 'icon-button', label: 'Button — icon', group: 'Actions', Part: IconButtonPart },
  { id: 'pill-button', label: 'Button — pill', group: 'Actions', Part: PillButtonPart },
  { id: 'filter-chip', label: 'Filter chip', group: 'Actions', Part: FilterChipPart },
  { id: 'segmented', label: 'Segmented', group: 'Actions', Part: SegmentedPart },
  { id: 'button-group', label: 'Button group', group: 'Actions', Part: ButtonGroupPart },
  { id: 'dock', label: 'Button dock', group: 'Actions', Part: DockPart },
  { id: 'fab', label: 'FAB', group: 'Actions', Part: FabPart },
  { id: 'hold-button', label: 'Hold-to-confirm', group: 'Actions', Part: HoldButtonPart },
  { id: 'continue-bar', label: 'Continue bar', group: 'Actions', Part: ContinueBarPart },
  { id: 'suggest-cta', label: 'Suggest CTA', group: 'Actions', Part: SuggestCtaPart },
  { id: 'links', label: 'Links · Action menu', group: 'Actions', Part: LinksPart },

  /* ---------- Inputs ---------- */
  { id: 'input', label: 'Text input', group: 'Inputs', Part: InputPart },
  { id: 'textarea', label: 'Textarea', group: 'Inputs', Part: TextareaPart },
  { id: 'field', label: 'Form field', group: 'Inputs', Part: FieldPart },
  { id: 'selection', label: 'Checkbox · Radio · Switch', group: 'Inputs', Part: SelectionPart },
  { id: 'stepper', label: 'Stepper', group: 'Inputs', Part: StepperPart },
  { id: 'select', label: 'Select', group: 'Inputs', Part: SelectPart },
  { id: 'combobox', label: 'Combobox', group: 'Inputs', Part: ComboboxPart },
  { id: 'chip-input', label: 'Chip input', group: 'Inputs', Part: ChipInputPart },
  { id: 'slider', label: 'Slider', group: 'Inputs', Part: SliderPart },
  { id: 'inputs-numeric', label: 'Number · Multi-select · Rating', group: 'Inputs', Part: InputsNumericPart },
  { id: 'inputs-security', label: 'OTP · Password', group: 'Inputs', Part: InputsSecurityPart },
  { id: 'inputs-date', label: 'Date · Time · Range', group: 'Inputs', Part: InputsDatePart },
  { id: 'inputs-upload', label: 'File upload', group: 'Inputs', Part: InputsUploadPart },
  { id: 'inputs-domain', label: 'Domain pickers', group: 'Inputs', Part: InputsDomainPart },
  { id: 'inputs-duration', label: 'Duration input', group: 'Inputs', Part: DurationInputPart },
  { id: 'inputs-editors', label: 'Row editors', group: 'Inputs', Part: InputsEditorsPart },

  /* ---------- Status ---------- */
  { id: 'status', label: 'Status contract', group: 'Status', Part: StatusPart },
  { id: 'badge-tag', label: 'Badge · Tag', group: 'Status', Part: BadgeTagPart },

  /* ---------- Feedback ---------- */
  { id: 'drawer', label: 'DrawerService', group: 'Feedback', Part: DrawerPart },
  { id: 'empty-state', label: 'Empty state', group: 'Feedback', Part: EmptyStatePart },
  { id: 'callout', label: 'Callout', group: 'Feedback', Part: CalloutPart },
  { id: 'progress', label: 'Progress', group: 'Feedback', Part: ProgressPart },
  { id: 'tooltip', label: 'Tooltip', group: 'Feedback', Part: TooltipPart },
  { id: 'popover', label: 'Popover', group: 'Feedback', Part: PopoverPart },
  { id: 'error-states', label: 'Errors · Loader', group: 'Feedback', Part: ErrorStatesPart },
  { id: 'celebration', label: 'Celebration ladder', group: 'Feedback', Part: CelebrationPart },

  /* ---------- Data display ---------- */
  { id: 'figure', label: 'Figure', group: 'Data display', Part: FigurePart },
  { id: 'stat', label: 'Stat', group: 'Data display', Part: StatPart },
  { id: 'value-pairs', label: 'Value pairs', group: 'Data display', Part: ValuePairsPart },
  { id: 'charts', label: 'Charts', group: 'Data display', Part: ChartsPart },
  { id: 'content', label: 'Accordion · Media · Timeline', group: 'Data display', Part: ContentPart },

  /* ---------- Trust & AI ---------- */
  { id: 'provenance', label: 'Provenance pair', group: 'Trust & AI', Part: ProvenancePart },
  { id: 'meal-card', label: 'Meal card', group: 'Trust & AI', Part: MealCardPart },
  { id: 'honesty', label: 'Honesty bar · AI disclosure', group: 'Trust & AI', Part: HonestyPart },

  /* ---------- Chat ---------- */
  { id: 'chat', label: 'Chat', group: 'Chat', Part: ChatPart },

  /* ---------- Kitchen ---------- */
  { id: 'stock', label: 'Standing kitchen', group: 'Kitchen', Part: StockPart },
  { id: 'capture', label: 'Capture', group: 'Kitchen', Part: CapturePart },

  /* ---------- Insights ---------- */
  { id: 'insights', label: 'Insights', group: 'Insights', Part: InsightsPart },

  /* ---------- Planning ---------- */
  { id: 'planning', label: 'Planning', group: 'Planning', Part: PlanningPart },

  /* ---------- Recipe & cook ---------- */
  { id: 'have-need', label: 'Have / need', group: 'Recipe & cook', Part: HaveNeedPart },
  { id: 'cook-step', label: 'Cook step · Timer', group: 'Recipe & cook', Part: CookStepPart },

  /* ---------- Structure ---------- */
  { id: 'card', label: 'Card · Panel', group: 'Structure', Part: CardPart },
  { id: 'promo-card', label: 'Promotional card', group: 'Structure', Part: PromoCardPart },
  { id: 'rows', label: 'Rows', group: 'Structure', Part: RowsPart },

  /* ---------- Navigation ---------- */
  { id: 'navigation', label: 'App bar · Tabs · Tab bar', group: 'Navigation', Part: NavigationPart },
  { id: 'shell', label: 'Sidebar · Shell pieces', group: 'Navigation', Part: ShellPart },

  /* ---------- Counter (curator console) ---------- */
  { id: 'console', label: 'The COUNTER register', group: 'Counter', Part: ConsolePart },
  { id: 'table', label: 'Table · Cursor pager', group: 'Counter', Part: TablePart },
  { id: 'audit', label: 'JSON · Diff', group: 'Counter', Part: AuditPart },
  { id: 'counter-actions', label: 'Bulk · Filters · Danger', group: 'Counter', Part: CounterActionsPart },
  { id: 'counter-board', label: 'Board rows', group: 'Counter', Part: CounterBoardPart },
  { id: 'counter-editors', label: 'Shell · Editors · Ledger', group: 'Counter', Part: CounterEditorsPart },

  /* ---------- The states everything shares ---------- */
  { id: 'loading-states', label: 'Skeletons · Empties · Failures', group: 'Feedback', Part: LoadingStatesPart },

  /* ---------- Marketing ---------- */
  { id: 'site', label: 'Marketing site', group: 'Marketing', Part: SitePart },
  { id: 'site-hero', label: 'Header · Hero', group: 'Marketing', Part: SiteHeaderHeroPart },
  { id: 'site-body', label: 'Problem · Features · Proof · Gallery', group: 'Marketing', Part: SiteBodyPart },
  { id: 'site-closers', label: 'How · Pricing · FAQ · CTA · Footer', group: 'Marketing', Part: SiteClosersPart },

  /* ---------- Email ---------- */
  { id: 'email', label: 'Email templates', group: 'Email', Part: EmailPart },

  /* ---------- Scenes — one part per group ---------- */
  ...SCENE_ENTRIES_FOR_PREVIEW,
];
