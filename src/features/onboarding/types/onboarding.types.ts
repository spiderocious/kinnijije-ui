export interface OnboardingState {
  completed: boolean;
  completed_at: string | null;
  cuisines: string[];
  difficulty: 'easy' | 'medium' | 'anything';
  measurement: 'metric' | 'imperial';
  kitchen_items: string[];
  /** Offered by the server, so the option list lives in exactly one place. */
  available_cuisines: string[];
}

export interface SaveOnboardingPayload {
  cuisines?: string[];
  difficulty?: 'easy' | 'medium' | 'anything';
  measurement?: 'metric' | 'imperial';
  kitchen_items?: string[];
}
