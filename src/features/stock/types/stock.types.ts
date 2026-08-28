export interface StockItem {
  id: string;
  catalogue_id: string | null;
  name: string;
  quantity: number;
  unit: string;
  storage: string;
  group: string;
  icon: string;
  days_left: number | null;
  freshness: 'fresh' | 'soon' | 'past' | 'unknown';
  added_at: string;
  last_moved_at: string;
}

export interface StockDashboard {
  counts: { things_in: number; running_low: number; use_soon: number; could_make: number };
  use_first: StockItem[];
  running_low: { name: string; reason: string; catalogue_id: string | null }[];
  by_storage: { storage: string; items: StockItem[] }[];
}

export interface IngredientSuggestion {
  catalogue_id: string;
  name: string;
  group: string;
  icon: string;
  default_unit: string;
  units: string[];
  storage: string;
  matched_on: string;
}

/** A line in the entry flow, before it is committed. */
export interface StockDraft {
  /** Local key — the catalogue id is not unique once custom items appear. */
  key: string;
  catalogue_id: string | null;
  name: string;
  quantity: number;
  unit: string;
  units: string[];
  icon: string;
  /** Set when it came from a photo read rather than being typed. */
  confidence?: number;
  recognised?: boolean;
}

export interface CustomUnit {
  id: string;
  label: string;
  abbr: string;
  custom: true;
}
