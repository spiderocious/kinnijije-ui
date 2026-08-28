import { useNavigate } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { MealCard, type MatchStrength } from '@ui/domain';
import { Tag } from '@ui/status';

import type { ChatHistoryItem, ChatMeal } from '../services/chat.api';
import { ToolReceipts } from './tool-receipts';

const SOURCE_LABELS: Record<string, string> = {
  kitchen: 'from your kitchen',
  recipe: 'from a tested recipe',
  general: '',
};

/**
 * How strong a match is, derived from what the reply said is missing.
 *
 * This drives the card's banner and how loud its button is — a meal needing a
 * shopping trip must not compete visually with one that can be cooked now.
 */
function matchStrength(meal: ChatMeal): MatchStrength {
  if (meal.missing.length === 0) return 'nothing_to_buy';
  if (meal.missing.length <= 2) return 'strong_match';
  return 'needs_a_shop';
}

/**
 * One turn of the conversation.
 *
 * Meals render as the SAME card the suggestions screen uses, so a meal looks
 * like itself wherever it appears — rendering them as plain text would make
 * them unopenable, which is most of the reason for asking.
 */
export function ChatMessage({ message }: { readonly message: ChatHistoryItem }) {
  const navigate = useNavigate();

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-blade bg-sky px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-sky-onbase">
            {message.text}
          </p>
        </div>
      </div>
    );
  }

  const meals = message.payload?.meals ?? [];
  const results = message.payload?.tool_results ?? [];
  const citations = message.payload?.citations ?? [];

  return (
    <div className="flex gap-3">
      <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-grape-soft">
        <KoboyoIcon name="robotForAi" size={18} className="text-grape-onsoft" alone />
      </span>

      <div className="min-w-0 flex-1">
        <div className="rounded-blade bg-white px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{message.text}</p>

          <Show when={results.length > 0}>
            <ToolReceipts results={results} />
          </Show>

          {/* Provenance, always. A general-knowledge answer admits it. */}
          <Show when={message.payload?.source !== undefined}>
            <p className="mt-2 font-mono text-[11px] text-ink-3">
              {SOURCE_LABELS[message.payload?.source ?? 'general'] ?? 'general knowledge'}
            </p>
          </Show>

          <Show when={citations.length > 0}>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Repeat each={[...citations]}>
                {(citation: string) => (
                  <Tag key={citation} tone="info" size="sm">
                    {citation}
                  </Tag>
                )}
              </Repeat>
            </div>
          </Show>
        </div>

        <Show when={meals.length > 0}>
          <div className="mt-3 flex flex-col gap-3">
            <Repeat each={[...meals]}>
              {(meal: ChatMeal) => {
                const mealId = meal.meal_id;
                const isOurs = meal.is_ours && mealId !== null;

                /**
                 * EVERY meal opens, including one the assistant invented.
                 *
                 * Ours goes straight to its page. An invented one goes to the
                 * generated-meal route, which writes the recipe, saves it and
                 * swaps itself for the real id. A named dish nobody can open is
                 * a dead end, and it was the most common answer the chat gave.
                 */
                const open = (): void => {
                  if (isOurs) {
                    void navigate({ to: ROUTES.MEAL(mealId) });
                    return;
                  }
                  void navigate({
                    to: ROUTES.MEAL(ROUTES.GENERATED_MEAL_ID),
                    search: { meal: meal.name } as never,
                  });
                };

                return (
                  <div key={meal.name}>
                    <MealCard
                      name={meal.name}
                      source={isOurs ? 'seed' : 'ai'}
                      minutes={meal.cook_time_minutes ?? 30}
                      match={matchStrength(meal)}
                      matchLine={
                        meal.missing.length === 0
                          ? 'You have everything'
                          : `Still need ${String(meal.missing.length)}`
                      }
                      heroImage={{ kind: isOurs ? 'photo' : 'placeholder' }}
                      compact
                      onOpen={open}
                    />

                    <Show when={meal.why.length > 0}>
                      <p className="mt-1.5 px-1 text-xs text-ink-2">{meal.why}</p>
                    </Show>

                    {/* Still says where it came from — provenance is never
                        dropped just because the thing is now openable. */}
                    <Show when={!isOurs}>
                      <p className="mt-1 px-1 font-mono text-[11px] text-ink-3">
                        the assistant thought of this one — open it and we will write it out
                      </p>
                    </Show>
                  </div>
                );
              }}
            </Repeat>
          </div>
        </Show>
      </div>
    </div>
  );
}
