import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

export interface Meal {
  id: string;
  slug: string;
  name: string;
  source: 'seed' | 'ai';
  cuisines: string[];
  difficulty: string;
  cook_time_minutes: number;
  serves: number;
  what_makes_it_good: string;
  description: string;
  hero_icon: string | null;
  ingredients: { name: string; quantity: number | null; unit: string | null; optional: boolean }[];
  steps: { index: number; heading: string; description: string; est_minutes: number }[];
}

export interface MatchedIngredient {
  name: string;
  state: 'enough' | 'low' | 'missing' | 'optional_missing';
  needed: number | null;
  needed_unit: string | null;
  have: number | null;
  have_unit: string | null;
}

export interface MealSuggestion {
  meal: Meal;
  score: number;
  match_line: string;
  ingredients: MatchedIngredient[];
  missing: string[];
  low: string[];
  nearly_there: boolean;
  is_favourite: boolean;
}

export interface MealDetail extends MealSuggestion {
  history: {
    times_cooked_recently: number;
    last_cooked_at: string | null;
    why_now: string;
  };
}

export const mealsApi = {
  suggest: (): Promise<MealSuggestion[]> => apiClient.get<MealSuggestion[]>(EP.MEALS.SUGGEST),
  list: (): Promise<Meal[]> => apiClient.get<Meal[]>(EP.MEALS.LIST),
  favourites: (): Promise<Meal[]> => apiClient.get<Meal[]>(EP.MEALS.FAVOURITES),
  detail: (mealId: string): Promise<MealDetail> => apiClient.get<MealDetail>(EP.MEALS.DETAIL(mealId)),
  favourite: (mealId: string): Promise<void> => apiClient.post<void>(EP.MEALS.FAVOURITE(mealId)),
  unfavourite: (mealId: string): Promise<void> => apiClient.delete<void>(EP.MEALS.FAVOURITE(mealId)),
  markCooked: (mealId: string): Promise<void> => apiClient.post<void>(EP.MEALS.COOKED(mealId)),

  /**
   * Writes and saves a recipe for a meal the assistant only NAMED.
   *
   * Returns the id of the meal we now hold — the same one every time for the
   * same name, so opening a suggestion twice does not make two copies.
   */
  generate: (name: string): Promise<{ meal_id: string }> =>
    apiClient.post<{ meal_id: string }>(EP.MEALS.GENERATE, { name }),
};
