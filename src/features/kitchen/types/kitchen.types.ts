export interface KitchenState {
  /** What the cook currently says is in their kitchen. */
  items: string[];
  /** Used before, not already in the basket — feeds "pick from recent". */
  recent: string[];
}

export interface SaveKitchenPayload {
  items: string[];
}
