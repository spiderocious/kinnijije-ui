import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@shared/services/api-client';

import { DASHBOARD_KEY, STOCK_KEY } from '@features/stock/hooks/use-stock';

import { chatApi, type ChatHistoryItem, type ChatReply } from '../services/chat.api';

const CHAT_KEY = ['chat'] as const;

export function useChatHistory() {
  return useQuery({ queryKey: CHAT_KEY, queryFn: chatApi.history });
}

export function useAsk() {
  const queryClient = useQueryClient();

  return useMutation<ChatReply, ApiError, string, { previous: ChatHistoryItem[] }>({
    mutationFn: chatApi.ask,

    /**
     * The question appears the INSTANT it is sent.
     *
     * Waiting for the round trip meant your own words vanished from the box and
     * reappeared seconds later under a "thinking" row — which reads as the
     * message being lost. The turn can take two model calls now, so that gap is
     * long enough to be alarming.
     */
    onMutate: async (question) => {
      await queryClient.cancelQueries({ queryKey: CHAT_KEY });
      const previous = queryClient.getQueryData<ChatHistoryItem[]>(CHAT_KEY) ?? [];

      queryClient.setQueryData<ChatHistoryItem[]>(CHAT_KEY, [
        ...previous,
        {
          // Marked so the screen can render it as still-in-flight, and so it
          // cannot collide with a real server id.
          id: `pending-${String(previous.length)}-${question.slice(0, 24)}`,
          role: 'user',
          text: question,
          payload: null,
          created_at: new Date().toISOString(),
        },
      ]);

      return { previous };
    },

    // The send failed, so the message was never really there. Put the history
    // back rather than leaving a question that no one answered.
    onError: (_error, _question, context) => {
      if (context !== undefined) queryClient.setQueryData(CHAT_KEY, context.previous);
    },

    onSuccess: async () => {
      // The assistant may have CHANGED things — added to the kitchen, put
      // something on the list — so everything it can touch is now stale.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CHAT_KEY }),
        queryClient.invalidateQueries({ queryKey: STOCK_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
        queryClient.invalidateQueries({ queryKey: ['market'] }),
      ]);
    },
  });
}

export function useClearChat() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: chatApi.clear,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHAT_KEY });
    },
  });
}
