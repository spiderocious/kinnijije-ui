import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

export interface ChatMeal {
  meal_id: string | null;
  name: string;
  why: string;
  cook_time_minutes: number | null;
  difficulty: string | null;
  have: string[];
  missing: string[];
  /** Only ours can be cooked — an AI-invented dish has no steps to follow. */
  is_ours: boolean;
}

/** What the assistant actually did, so the interface can show receipts. */
export interface ToolResult {
  tool: string;
  toolGroup: string;
  result: 'success' | 'failed' | 'pending';
  resultCode: number;
  updatedData?: unknown;
  error?: string;
  partial?: { name: string; reason: string }[];
}

export interface ChatReply {
  id: string;
  kind: 'text' | 'meal_list' | 'single_meal' | 'stock_answer' | 'substitution' | 'refusal';
  text: string;
  meals: ChatMeal[];
  source: 'kitchen' | 'recipe' | 'general';
  citations: string[];
  /** Already carried out by the time this arrives — see the round-trip. */
  tool_results: ToolResult[];
  created_at: string;
}

export interface ChatHistoryItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  payload: {
    kind?: string;
    meals?: ChatMeal[];
    source?: string;
    citations?: string[];
    tool_results?: ToolResult[];
  } | null;
  created_at: string;
}

export const chatApi = {
  history: (): Promise<ChatHistoryItem[]> => apiClient.get<ChatHistoryItem[]>(EP.CHAT.HISTORY),
  ask: (question: string): Promise<ChatReply> => apiClient.post<ChatReply>(EP.CHAT.ASK, { question }),
  clear: (): Promise<void> => apiClient.delete<void>(EP.CHAT.CLEAR),
};
