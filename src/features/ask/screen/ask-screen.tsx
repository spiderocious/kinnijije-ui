import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { RotateCcw, X } from 'lucide-react';

import { useSession } from '@features/auth/hooks/use-session';
import { useToggleFavourite } from '@features/meals/hooks/use-meals';
import { DecideThinking } from '@features/decide/screen/parts/decide-thinking';
import { VerdictStories } from '@features/decide/screen/parts/verdict-stories';
import { useDecide, useDecideOptions } from '@features/decide/hooks/use-decide';
import type { Mood, TimeBudget, Weight } from '@features/decide/types/decide.types';
import { ROUTES } from '@shared/constants/routes';
import { useFeatures } from '@shared/hooks/use-features';
import { EVENTS, analytics } from '@shared/services/analytics';
import { cn } from '@shared/utils/cn';

import { ASK_COPY } from '../content/ask.content';
import { usePlacesAvailable } from '@features/chowdeck/use-chowdeck';

import { useAskPlace } from '../hooks/use-ask-place';
import { useAskSession } from '../hooks/use-ask-session';
import { useAskTurn } from '../hooks/use-ask-turn';
import { useRecorder } from '../hooks/use-recorder';
import { askApi } from '../services/ask.api';
import { ASK_STEPS, type AskMessage, type AskQuestionStep } from '../types/ask.types';
import { AskBubble, AskTyping } from './parts/ask-bubble';
import { AskComposer } from './parts/ask-composer';
import { AskDock } from './parts/ask-dock';
import { KitchenPanel } from './parts/kitchen-panel';
import { RecordingModal } from './parts/recording-modal';
import { PlaceSheet } from './parts/place-sheet';
import { RevertConfirm } from './parts/revert-confirm';
import { SaveGate } from './parts/save-gate';
import { VerdictSummary } from './parts/verdict-summary';

/**
 * Ask KinniJije.
 *
 * The same four questions and the same single `POST /decide` as the tap flow,
 * reached by talking. It shares the DRAFT and the verdict deck with that flow
 * and shares no layout with it at all — which is what lets this exist without
 * being able to break it.
 */

/** Remembers "don't ask me again" across visits. A preference, not data. */
const REVERT_PREF = 'kj.ask_revert_confirmed';

/** The questions, in order. Matches the backend's ASK_STEPS. */
const FLOW: readonly AskQuestionStep[] = ASK_STEPS.filter(
  (step): step is AskQuestionStep => step !== 'follow_up',
);

export default function AskScreen() {
  const navigate = useNavigate();
  const features = useFeatures();
  const { isSignedIn } = useSession();
  const options = useDecideOptions();
  const decide = useDecide();
  const session = useAskSession();
  const favourite = useToggleFavourite();
  /**
   * Where to look for offers. Inferred rather than asked — see `useAskPlace`.
   * Without this `place` was always null and the deck never showed a card.
   */
  const inferredPlace = useAskPlace(features.chowdeck_offers, decide.draft.city ?? null);
  /**
   * Whether asking about an area is worth anybody's time.
   *
   * The flag alone is not enough: switched on with no saved places, the picker
   * is an empty list and the question is a dead end.
   */
  const offersOn = usePlacesAvailable(features.chowdeck_offers);
  const recorder = useRecorder();

  const [step, setStep] = useState<AskQuestionStep>('kitchen');
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [placeSheetOpen, setPlaceSheetOpen] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  /**
   * Whether a verdict is on screen, tracked HERE rather than read off the
   * decide hook.
   *
   * `decide.verdict` is separate React state from `decide.draft`, so
   * `patch({ verdict: null })` clears the stored draft and leaves the hook's
   * verdict set — which left the footer stuck on "Start again" with no dock
   * after somebody asked to change an answer. Ask needs "is the conversation
   * finished" as its own idea, and `reset()` is too blunt for that because it
   * wipes every answer too.
   */
  const [showingVerdict, setShowingVerdict] = useState(false);
  /** The dish they just refused, so the next card can acknowledge it. */
  const [rejectedName, setRejectedName] = useState<string | null>(null);
  /**
   * The meal they tried to keep before they had an account.
   *
   * Held so the save can complete ITSELF once they sign up — asking somebody to
   * find the dish again after registering is how the intent gets lost, and the
   * intent is the whole reason they registered.
   */
  const [pendingSave, setPendingSave] = useState<{ id: string; name: string } | null>(null);

  /**
   * The thinking curtain, which OUTLIVES `isDeciding`.
   *
   * A plain `if (isDeciding) return <Thinking/>` unmounted the whole thread,
   * so the conversation was thrown away and rebuilt — and an exit animation was
   * impossible, because the element is gone the instant the flag clears. This
   * holds it mounted for one more beat so it can sweep off.
   */
  const [curtain, setCurtain] = useState<'hidden' | 'in' | 'out'>('hidden');
  /**
   * How many follow-ups are left, as the SERVER last reported it.
   *
   * Null until the first one, because the real cap depends on whether they are
   * signed in and that is the server's business. The UI hides the box at zero;
   * the server refuses regardless, which is what makes it a cap.
   */
  const [followUpsLeft, setFollowUpsLeft] = useState<number | null>(null);

  /**
   * The step somebody is asking to go back to, pending confirmation.
   *
   * `localStorage`, not `sessionStorage`, for the preference: "don't ask me
   * again" that forgets on the next visit has not been honoured. The draft and
   * the session stay session-scoped for privacy; a UI preference carries
   * nothing about what anybody cooked.
   */
  const [pendingRevert, setPendingRevert] = useState<AskQuestionStep | null>(null);
  const skipConfirm = useRef(false);
  useEffect(() => {
    try {
      skipConfirm.current = localStorage.getItem(REVERT_PREF) === '1';
    } catch {
      // Blocked storage just means we ask every time, which is the safe default.
    }
  }, []);

  const turn = useAskTurn(session.sessionId, features.ask_streaming);
  /**
   * A SECOND follower, for spoken follow-ups.
   *
   * Separate from `turn` so a follow-up transcript can never be mistaken for an
   * answer to one of the four questions — they settle through different effects
   * and would otherwise fight over the same state.
   */
  const followUpTurn = useAskTurn(session.sessionId, features.ask_streaming);

  /**
   * The session id lives in the address bar.
   *
   * `replace`, never push: the id appearing is a detail of the same page, not
   * somewhere you navigated — pushing would make Back take somebody to a bare
   * `/ask` that immediately rewrites itself, which is a trap.
   */
  useEffect(() => {
    if (session.sessionId === null) return;
    if (window.location.pathname.endsWith(session.sessionId)) return;
    void navigate({
      to: ROUTES.ASK_SESSION(session.sessionId) as never,
      replace: true,
    });
  }, [session.sessionId, navigate]);
  const threadRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef(Date.now());

  const kitchen = decide.draft.kitchenItems;

  const say = useCallback((message: Omit<AskMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...message, id: `m${String(prev.length)}_${String(Date.now())}` }]);
  }, []);

  /**
   * The opening question. ONCE, guarded by a ref.
   *
   * A dependency array is not enough here, for two independent reasons:
   *
   *   StrictMode double-invokes every effect in development, so the pot asked
   *   the same question twice on every launch.
   *
   *   `isSignedIn` starts false and flips true when the session resolves,
   *   which re-ran this a second time — in PRODUCTION as well, where
   *   StrictMode is not involved.
   *
   * A ref is the right instrument because the greeting is not derived state:
   * it happens once per conversation regardless of what re-renders.
   */
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    analytics.track(EVENTS.ASK_SESSION_STARTED, { surface: 'ask', is_signed_in: isSignedIn });
    say({ role: 'pot', text: ASK_COPY.questions.kitchen.ask, step: 'kitchen' });
  }, [say, isSignedIn]);

  /**
   * Scrolls to the newest POT message, not the raw bottom.
   *
   * Scrolling to the bottom puts the dock in view and the question off it,
   * which is exactly backwards — the question is the thing that needs reading.
   */
  useEffect(() => {
    const node = threadRef.current;
    if (node === null) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  /** Moves the conversation on, with the pot's written reaction. */
  /**
   * Moves the conversation on.
   *
   * The reaction and the next question are ONE message, not two. Two bubbles
   * arriving together is a machine emptying a queue; a person says "Rice. That
   * opens a few doors — how's your day going?" in a single breath, and the
   * transcript should read the way a person talks.
   */
  const advance = useCallback(
    (from: AskQuestionStep, reaction: string | null) => {
      const next = FLOW[FLOW.indexOf(from) + 1];

      if (next === undefined) {
        if (reaction !== null) say({ role: 'pot', text: reaction });
        void decide.decide();
        return;
      }

      /**
       * The area is only worth asking when there is somewhere to show.
       *
       * With the flag off or no saved places, the picker would open on an
       * empty list — so the question is skipped entirely and we decide. That
       * is the same guard the tap flow uses for "I'll order".
       */
      if (next === 'place' && !offersOn) {
        if (reaction !== null) say({ role: 'pot', text: reaction });
        void decide.decide();
        return;
      }

      const question = ASK_COPY.questions[next].ask;
      say({
        role: 'pot',
        text: reaction === null ? question : `${reaction}\n\n${question}`,
        step: next,
      });
      setStep(next);
    },
    [say, decide],
  );

  /** A tap. Instant, local, no request — the fast path stays the fast path. */
  const answerByTap = useCallback(
    (which: AskQuestionStep, value: string | number) => {
      const label = String(value);
      analytics.track(EVENTS.ASK_STEP_ANSWERED, { surface: 'ask', step: which, method: 'tap' });

      if (which === 'mood') {
        decide.patch({ mood: value as Mood });
        say({ role: 'cook', text: label, source: 'tap', step: which });
        const reactions = ASK_COPY.reactions;
        const line =
          value === 'tired' ? reactions.moodTired
          : value === 'fast' ? reactions.moodFast
          : value === 'proper' ? reactions.moodProper
          : value === 'comfort' ? reactions.moodComfort
          : reactions.moodSurprise;
        advance('mood', line);
        return;
      }
      if (which === 'weight') {
        decide.patch({ weight: value as Weight });
        say({ role: 'cook', text: label, source: 'tap', step: which });
        advance('weight', ASK_COPY.reactions.weight);
        return;
      }
      if (which === 'time') {
        decide.patch({ minutes: value as TimeBudget, mode: 'cook' });
        say({ role: 'cook', text: label, source: 'tap', step: which });
        advance('time', null);
      }
    },
    [decide, say, advance],
  );

  /** The kitchen answer commits as ONE bubble, however many taps it took. */
  const commitKitchen = useCallback(
    (items: string[]) => {
      decide.patch({ kitchenItems: items, kitchenSkipped: items.length === 0, mode: 'cook' });
      analytics.track(EVENTS.ASK_STEP_ANSWERED, {
        surface: 'ask',
        step: 'kitchen',
        method: 'tap',
        item_count: items.length,
      });

      const first = items[0];
      say({
        role: 'cook',
        text: items.length === 0 ? ASK_COPY.questions.kitchen.nothing : items.join(', '),
        source: 'tap',
        step: 'kitchen',
      });

      const reactions = ASK_COPY.reactions;
      advance(
        'kitchen',
        items.length === 0 ? reactions.kitchenNone
        : items.length >= 4 ? reactions.kitchenMany(items.length)
        : reactions.kitchenSome(first ?? ''),
      );
    },
    [decide, say, advance],
  );

  /** Typing or speaking. Queued server-side; the answer arrives on the stream. */
  const sendFreeform = useCallback(
    async (input: { text?: string; blob?: Blob; durationMs?: number }) => {
      const id = await session.ensure();
      if (id === null) return;

      setBusy(true);
      const isVoice = input.blob !== undefined;

      // Optimistic: the bubble paints at full opacity immediately, with only a
      // small clock saying the answer is still coming.
      say({
        role: 'cook',
        text: isVoice ? '🎙 Voice note' : (input.text ?? ''),
        source: isVoice ? 'voice' : 'text',
        step,
        pending: true,
      });

      try {
        let audioKey: string | undefined;

        if (input.blob !== undefined) {
          const ticket = await askApi.uploadTicket(id, {
            content_type: input.blob.type || 'audio/webm',
            size: input.blob.size,
          });
          await askApi.upload(ticket, input.blob);
          audioKey = ticket.key;
          analytics.track(EVENTS.ASK_UPLOAD_COMPLETED, {
            surface: 'ask',
            bytes: input.blob.size,
            ok: true,
          });
        }

        const created = await askApi.createTurn(id, {
          step,
          source: isVoice ? 'voice' : 'text',
          ...(input.text !== undefined && { text: input.text }),
          ...(audioKey !== undefined && { audio_key: audioKey }),
        });

        analytics.track(EVENTS.ASK_TURN_QUEUED, {
          surface: 'ask',
          source: isVoice ? 'voice' : 'text',
        });
        turn.follow(created.id, id);
      } catch {
        setBusy(false);
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, pending: false, failed: true } : m,
          ),
        );
        analytics.track(EVENTS.ASK_MESSAGE_FAILED, { surface: 'ask', step });
      }
    },
    [session, step, say, turn],
  );

  /**
   * What the stream came back with.
   *
   * A rejected parse is NOT a failure: the raw text is still shown, because
   * somebody who spoke deserves to see we heard them, and the question is
   * simply asked again.
   */
  /**
   * Each turn is handled EXACTLY once, tracked by id.
   *
   * This guard is the fix for a runaway loop that fired thousands of requests:
   * on the last step `nextStep` is undefined, so the branch below called
   * `decide()` and returned early WITHOUT `turn.reset()`. The turn stayed
   * `done`, and because `useAskTurn` returns a fresh object every render the
   * effect re-ran and decided again, forever.
   *
   * A ref keyed on the turn id rather than tighter dependencies, because the
   * real invariant is "this answer has been applied", not "these values
   * changed" — and that holds however the dependencies churn.
   */
  const handledTurn = useRef<string | null>(null);

  useEffect(() => {
    const settled = turn.turn;
    if (settled === null || (settled.status !== 'done' && settled.status !== 'failed')) return;
    if (handledTurn.current === settled.id) return;
    handledTurn.current = settled.id;

    setBusy(false);
    setMessages((prev) =>
      prev.map((m, i) =>
        i === prev.length - 1
          ? {
              ...m,
              pending: false,
              failed: settled.status === 'failed',
              text: settled.raw_text ?? m.text,
              ...(settled.notes.length > 0 && { notes: settled.notes }),
            }
          : m,
      ),
    );

    if (settled.status === 'failed') {
      analytics.track(EVENTS.ASK_PARSE_REJECTED, { surface: 'ask', reason: settled.error_code });
      turn.reset();
      return;
    }

    const answers = settled.answers;
    if (answers === null) {
      /**
       * The parse was rejected — too vague, or below the confidence floor.
       *
       * NOT a failure: the raw text still shows, because somebody who spoke
       * deserves to see we heard them. We say we did not follow and ask again.
       *
       * `turn.reset()` is what makes a second attempt possible at all. Without
       * it the settled turn stays in state, the handled-turn guard refuses to
       * re-enter, and the conversation is stuck forever on the typing dots —
       * which is exactly what "something small" did.
       */
      turn.reset();
      say({
        role: 'pot',
        text: `${ASK_COPY.turn.notFollowed} ${ASK_COPY.questions[step].ask}`,
        step,
      });
      return;
    }

    analytics.track(EVENTS.ASK_PARSE_COMPLETED, {
      surface: 'ask',
      source: settled.source,
      confidence: settled.confidence,
      note_count: settled.notes.length,
    });
    if (settled.notes.length > 0) {
      analytics.track(EVENTS.ASK_NOTES_EXTRACTED, {
        surface: 'ask',
        note_count: settled.notes.length,
        source: settled.source,
      });
    }

    // Only fields the sentence actually answered. A null stays null and that
    // question is asked normally — guessing is what makes a parse feel wrong.
    decide.patch({
      ...(answers.kitchen_items.length > 0 && { kitchenItems: answers.kitchen_items }),
      ...(answers.mood !== null && { mood: answers.mood }),
      ...(answers.weight !== null && { weight: answers.weight }),
      ...(answers.minutes !== null && { minutes: answers.minutes }),
      mode: 'cook',
    });

    // Jump to the first question still unanswered.
    const draft = decide.draft;
    const nextStep = FLOW.find((candidate) => {
      if (candidate === 'kitchen') return answers.kitchen_items.length === 0 && draft.kitchenItems.length === 0;
      if (candidate === 'mood') return (answers.mood ?? draft.mood) === null;
      if (candidate === 'weight') return (answers.weight ?? draft.weight) === null;
      return (answers.minutes ?? draft.minutes) === null;
    });

    if (nextStep === undefined) {
      // Reset BEFORE deciding. Leaving a settled turn in place was half of the
      // runaway loop above.
      turn.reset();
      void decide.decide();
      return;
    }
    say({ role: 'pot', text: ASK_COPY.questions[nextStep].ask, step: nextStep });
    setStep(nextStep);
    turn.reset();
  }, [turn, decide, say, step]);

  /**
   * The verdict, once it lands.
   *
   * The bubble is idempotent through `prev.some`, but the two events below are
   * not — and a double-fired completion inflates the one number this feature
   * is judged on. The ref guards them for the same reason the greeting is
   * guarded: StrictMode in development, and a re-render on any dependency in
   * production.
   */
  const announced = useRef(false);
  useEffect(() => {
    if (decide.verdict === null || announced.current) return;
    announced.current = true;
    setShowingVerdict(true);
    setMessages((prev) =>
      prev.some((m) => m.kind === 'summary')
        ? prev
        : [...prev, { id: `summary_${String(Date.now())}`, role: 'pot', text: '', kind: 'summary' }],
    );
    analytics.track(EVENTS.ASK_SUMMARY_SHOWN, {
      surface: 'ask',
      pool_size: decide.verdict.pool.length,
      provenance: decide.verdict.provenance,
      is_empty: decide.verdict.verdict.meal_id === '',
    });
    analytics.track(EVENTS.ASK_SESSION_COMPLETED, {
      surface: 'ask',
      ms_total: Date.now() - startedAt.current,
    });
  }, [decide.verdict]);

  /**
   * Every candidate refused.
   *
   * `reject()` raises this once the pool empties. Ask ignored it, so refusing
   * the last card left the deck mounted with nothing to show and no way out —
   * which is why the buttons looked broken: there was genuinely nothing left
   * to act on. Back to the thread, with the offer to widen.
   *
   * An effect rather than a render-time branch, because this writes state and
   * doing that during render is a loop waiting to happen.
   */
  useEffect(() => {
    if (!decide.exhausted) return;
    setDeckOpen(false);
    setShowingVerdict(false);
    setRejectedName(null);
    setMessages((prev) =>
      prev.some((m) => m.kind === 'exhausted')
        ? prev
        : [
            ...prev.filter((m) => m.kind !== 'summary'),
            {
              id: `exhausted_${String(Date.now())}`,
              role: 'pot',
              text: ASK_COPY.summary.emptyBody,
              kind: 'exhausted',
            },
          ],
    );
  }, [decide.exhausted]);

  /**
   * Raise the curtain while deciding, drop it after.
   *
   * The exit is driven by a timer rather than `animationend` because the
   * element must stay mounted for the whole sweep, and a missed event on a
   * backgrounded tab would strand it on screen forever.
   */
  useEffect(() => {
    if (decide.isDeciding) {
      setCurtain('in');
      return;
    }
    if (curtain === 'hidden') return;

    setCurtain('out');
    const id = setTimeout(() => { setCurtain('hidden'); }, 380);
    return () => { clearTimeout(id); };
  }, [decide.isDeciding, curtain]);

  /** Scroll back and change an answer. */
  /**
   * Going back to a question and answering it again.
   *
   * Everything after that point is REMOVED from the thread, not appended to.
   * A transcript that keeps a superseded answer above a corrected one makes
   * somebody read both and work out which is current — the whole reason to
   * scroll back is to make the old answer stop counting.
   *
   * The answers themselves are cleared too, for the same reason: a draft that
   * still holds the mood you just rewound past would decide on it.
   */
  const revisit = useCallback(
    (which: AskQuestionStep) => {
      analytics.track(EVENTS.ASK_STEP_REVISITED, { surface: 'ask', step: which, from_step: step });

      const from = FLOW.indexOf(which);
      decide.patch({
        verdict: null,
        ...(from <= 0 && { kitchenItems: [], kitchenSkipped: false }),
        ...(from <= 1 && { mood: null }),
        ...(from <= 2 && { weight: null }),
        ...(from <= 3 && { minutes: null }),
      });

      announced.current = false;
      setShowingVerdict(false);
      setDeckOpen(false);

      // Everything from that question onward goes. The index is found on the
      // POT message that asked it, so the question itself survives and the
      // answer below it does not.
      setMessages((prev) => {
        const at = prev.findIndex((m) => m.role === 'pot' && m.step === which);
        return at === -1 ? prev : prev.slice(0, at + 1);
      });
      setStep(which);
    },
    [decide, step],
  );

  /**
   * The undo button asks first — once.
   *
   * Reverting destroys everything after that point, which is not guessable
   * from an arrow. After the first confirmation the preference is honoured and
   * it just works, which is what stops the dialog becoming something people
   * click through without reading.
   */
  const requestRevert = useCallback(
    (which: AskQuestionStep) => {
      if (skipConfirm.current) {
        revisit(which);
        return;
      }
      setPendingRevert(which);
    },
    [revisit],
  );

  /**
   * A clean slate. ONE implementation, used by every caller.
   *
   * The deck's "start again" used to call `decide.reset()` alone, which left
   * the whole transcript on screen under a fresh empty bubble — the thread
   * said one thing and the state said another. Start again means start again:
   * new session, empty thread, first question.
   */
  const restart = useCallback(() => {
    decide.reset();
    session.reset();
    handledTurn.current = null;
    announced.current = false;
    turn.reset();
    setShowingVerdict(false);
    setDeckOpen(false);
    setPanelOpen(false);
    setSaved(false);
    setBusy(false);
    setStep('kitchen');
    startedAt.current = Date.now();
    // Replaces the thread rather than appending to it, so nothing survives.
    setMessages([
      {
        id: `m0_${String(Date.now())}`,
        role: 'pot',
        text: ASK_COPY.questions.kitchen.ask,
        step: 'kitchen',
      },
    ]);
    // Back to the bare path. Leaving the old id there would resurrect the
    // finished conversation on the next reload.
    void navigate({ to: ROUTES.ASK, replace: true });
  }, [decide, session, turn, navigate]);

  /**
   * Talking back to the verdict.
   *
   * The shortlist travels with the question so the model can only ever promote
   * something already on screen. `redecide` re-runs the deterministic ranker
   * rather than letting the model invent an answer — the division of labour the
   * whole flow rests on.
   */
  const askFollowUp = useCallback(
    async (question: string) => {
      const id = session.sessionId;
      const current = decide.verdict;
      if (id === null || current === null) return;

      setBusy(true);
      say({ role: 'cook', text: question, source: 'text', pending: true });

      const shortlist = [current.verdict, ...current.pool].filter((m) => m.meal_id !== '');

      try {
        const reply = await askApi.followUp(id, {
          question,
          allowed_meal_ids: shortlist.map((m) => m.meal_id),
          // Everything the model is allowed to know. Rendered here because the
          // client holds the verdict; the server never re-reads it.
          context: [
            `KITCHEN: ${decide.draft.kitchenItems.join(', ') || 'nothing stated'}`,
            `ASKED FOR: ${decide.draft.mood ?? '?'} / ${decide.draft.weight ?? '?'} / ${String(decide.draft.minutes ?? '?')} min`,
            `SUGGESTED: ${current.verdict.name} (${current.verdict.meal_id})`,
            `SHORTLIST: ${shortlist.map((m) => `${m.name} (${m.meal_id}, ${String(m.cook_time_minutes)}min)`).join('; ')}`,
          ].join('\n'),
        });

        setFollowUpsLeft(reply.remaining);
        setMessages((prev) =>
          prev.map((m, i) => (i === prev.length - 1 ? { ...m, pending: false } : m)),
        );
        say({ role: 'pot', text: reply.text });

        if (reply.action === 'swap' && reply.meal_id !== null) {
          decide.chooseAlternate(reply.meal_id);
        }
        if (reply.action === 'redecide') {
          setShowingVerdict(false);
          announced.current = false;
          void decide.decide();
        }
      } catch {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, pending: false, failed: true } : m,
          ),
        );
      } finally {
        setBusy(false);
      }
    },
    [session.sessionId, decide, say],
  );

  /** The actual save. Shared by the direct path and the after-signup replay. */
  const persistSave = useCallback(
    (mealId: string) => {
      setSaved(true);
      favourite.mutate({ mealId, favourite: true });
      analytics.track(EVENTS.ASK_BOOKMARK_SAVED, { surface: 'ask', meal_id: mealId });
    },
    [favourite],
  );

  /**
   * A spoken follow-up.
   *
   * Reuses the turn pipeline for the hard part — presigned upload, job,
   * transcription, stream — because duplicating that for one more surface is
   * how two recorders drift apart. The server transcribes and skips the parse
   * (`step: 'follow_up'`), and the text comes back here to be asked as a
   * question.
   */
  const sendFollowUpVoice = useCallback(
    async (blob: Blob) => {
      const id = session.sessionId;
      if (id === null) return;

      setBusy(true);
      try {
        const ticket = await askApi.uploadTicket(id, {
          content_type: blob.type || 'audio/webm',
          size: blob.size,
        });
        await askApi.upload(ticket, blob);
        const created = await askApi.createTurn(id, {
          step: 'follow_up',
          source: 'voice',
          audio_key: ticket.key,
        });
        analytics.track(EVENTS.ASK_VOICE_SENT, {
          surface: 'ask',
          step: 'follow_up',
          bytes: blob.size,
        });
        // The transcript arrives on the stream; `followUpTurn` picks it up.
        followUpTurn.follow(created.id, id);
      } catch {
        setBusy(false);
        analytics.track(EVENTS.ASK_MESSAGE_FAILED, { surface: 'ask', step: 'follow_up' });
      }
    },
    [session.sessionId, followUpTurn],
  );

  /**
   * A spoken follow-up, once it has been transcribed.
   *
   * The pipeline gives us text; from here it is the same path a typed
   * follow-up takes, so there is one implementation of what a follow-up means.
   */
  const handledFollowUp = useRef<string | null>(null);
  useEffect(() => {
    const settled = followUpTurn.turn;
    if (settled === null || settled.status === 'pending') return;
    if (handledFollowUp.current === settled.id) return;
    handledFollowUp.current = settled.id;

    followUpTurn.reset();
    setBusy(false);

    if (settled.status === 'failed' || settled.raw_text === null) {
      say({ role: 'pot', text: ASK_COPY.turn.failed });
      return;
    }
    void askFollowUp(settled.raw_text);
  }, [followUpTurn, askFollowUp, say]);

  const bookmark = useCallback(() => {
    const meal = decide.verdict?.verdict;
    if (meal === undefined || meal.meal_id === '') return;

    analytics.track(EVENTS.ASK_BOOKMARK_CLICKED, {
      surface: 'ask',
      meal_id: meal.meal_id,
      is_signed_in: isSignedIn,
    });

    /**
     * No account yet: ask IN PLACE rather than navigating away.
     *
     * A redirect to /register threw away the thread, the verdict and the thing
     * they were trying to keep — and asked somebody mid-task to start a
     * different task. The modal costs one form and the save finishes itself.
     */
    if (!isSignedIn) {
      analytics.track(EVENTS.ASK_BOOKMARK_BLOCKED, { surface: 'ask', meal_id: meal.meal_id });
      setPendingSave({ id: meal.meal_id, name: meal.name });
      return;
    }

    persistSave(meal.meal_id);
  }, [decide.verdict, isSignedIn, persistSave]);

  /**
   * The questions this person will ACTUALLY be asked.
   *
   * The place step is dropped when there is nowhere to show offers, so the rail
   * must drop it too — promising five questions and asking four is a small lie
   * that makes the whole thing feel careless.
   */
  const askedSteps = useMemo(
    () => (offersOn ? FLOW : FLOW.filter((s) => s !== 'place')),
    [offersOn],
  );
  const stepIndex = askedSteps.indexOf(step);

  const visible = useMemo(
    () => messages.filter((m) => m.kind !== 'summary' || showingVerdict),
    [messages, showingVerdict],
  );

  // The deck IS the tap flow's, mounted whole — so nothing about the verdict
  // experience can drift from the version that already works.
  if (deckOpen && showingVerdict && decide.verdict !== null) {
    return (
      /* Full screen, and wider than the thread behind it. The deck is the
         detail view — a swipeable card with a photo, ingredients and offers
         has more to show than a chat column, and the 520px cap that suits a
         transcript makes it feel boxed on a desktop. The cap lives on the
         shared decide component, so it is widened HERE rather than there. */
      <div className="fixed inset-0 z-modal bg-paper [&>div]:max-w-[720px]">
        <VerdictStories
          verdict={decide.verdict}
          rejectedName={rejectedName}
          onCook={(mealId) => {
            if (mealId === '') return;
            /**
             * Record the choice BEFORE navigating.
             *
             * Without this a guest who picks the third card and then signs up
             * lands on whatever happened to be the winner — the tap flow has
             * done this since it shipped, and leaving it out here is why
             * "Cook this" looked like it did nothing useful.
             */
            decide.chooseAlternate(mealId);
            analytics.track(EVENTS.ASK_BOOKMARK_CLICKED, {
              surface: 'ask',
              meal_id: mealId,
              is_signed_in: isSignedIn,
            });
            void navigate({ to: isSignedIn ? ROUTES.MEAL(mealId) : ROUTES.REGISTER });
          }}
          onSignUp={() => { void navigate({ to: ROUTES.REGISTER }); }}
          onReject={(mealId) => {
            // The name is what the next screen says they refused. Read before
            // rejecting, because rejecting removes it from the pool.
            const refused = [decide.verdict?.verdict, ...(decide.verdict?.pool ?? [])].find(
              (m) => m?.meal_id === mealId,
            );
            setRejectedName(refused?.name ?? null);
            decide.reject(mealId);
          }}
          onChangeAnswer={() => { setDeckOpen(false); requestRevert('time'); }}
          onRegenerate={() => { setDeckOpen(false); void decide.decide(); }}
          onRestart={restart}
          mode="cook"
          place={decide.draft.place ?? inferredPlace}
          showOffers={features.chowdeck_offers}
        />
      </div>
    );
  }

  /**
   * NOT an early return.
   *
   * The curtain is rendered at the end of the tree, over the conversation,
   * which stays mounted underneath. Scroll position, the thread and every
   * input survive — and when it lifts, what was behind it is exactly what was
   * there before rather than a fresh render.
   */

  return (
    <div className="mx-auto flex h-screen w-full max-w-[520px] flex-col bg-paper" style={{ height: '100dvh' }}>
      <header className="flex shrink-0 items-center gap-2.5 border-b-hair border-line bg-white px-4 py-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-blade-xs border-2 border-ink bg-sky text-white">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 14h16a8 8 0 0 1-8 7 8 8 0 0 1-8-7Z" />
            <path d="M12 5v2" />
          </svg>
        </span>
        <b className="font-display text-[14.5px] text-ink">{ASK_COPY.header.title}</b>

        <span className="ml-auto flex items-center gap-1.5" aria-hidden="true">
          {askedSteps.map((_, i) => (
            <i
              key={i}
              className={cn(
                'block h-1 w-5 rounded-pill transition-colors duration-slow',
                i <= stepIndex ? 'bg-sky' : 'bg-line-2',
              )}
            />
          ))}
        </span>

        <button
          type="button"
          onClick={() => { void navigate({ to: ROUTES.ENTRY }); }}
          aria-label="Close"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-round text-ink-4 hover:bg-paper-2 hover:text-ink"
        >
          <X size={15} strokeWidth={2.6} />
        </button>
      </header>

      <div
        ref={threadRef}
        className="flex min-h-0 flex-1 flex-col gap-[13px] overflow-y-auto overscroll-contain px-[14px] pb-2 pt-[15px]"
        aria-live="polite"
      >
        {visible.map((message, i) =>
          message.kind === 'summary' && showingVerdict && decide.verdict !== null ? (
            <VerdictSummary
              key={message.id}
              verdict={decide.verdict}
              saved={saved}
              onBookmark={bookmark}
              onOpen={() => {
                analytics.track(EVENTS.ASK_SUGGESTIONS_OPENED, { surface: 'ask' });
                setDeckOpen(true);
              }}
              // Tapping an alternate promotes it to the top of the card rather
              // than opening the deck — the same local re-rank "not feeling it"
              // uses, so it costs nothing and the thread stays put.
              place={decide.draft.place ?? inferredPlace}
              showOffers={features.chowdeck_offers}
              onPick={(mealId) => {
                decide.chooseAlternate(mealId);
                analytics.track(EVENTS.ASK_SUGGESTIONS_OPENED, { surface: 'ask', via: 'strip' });
              }}
            />
          ) : (
            <AskBubble
              key={message.id}
              message={message}
              index={i}
              onRevisit={requestRevert}
              {...(message.pending === true && { onRetry: undefined })}
            />
          ),
        )}

        {/* Only ever while a request is genuinely in flight. Faking thought to
            seem clever is the one thing here that would damage trust. */}
        {busy && turn.transcript === null && <AskTyping />}
      </div>

      <div className="flex shrink-0 flex-col gap-2.5 border-t-2 border-ink bg-white px-[14px] pb-[max(13px,env(safe-area-inset-bottom))] pt-3">
        {!showingVerdict && (
          <AskDock
            step={step}
            options={options.data}
            kitchen={kitchen}
            busy={busy}
            onOpenPanel={() => {
              analytics.track(EVENTS.ASK_PANEL_EXPANDED, { surface: 'ask', step });
              setPanelOpen(true);
            }}
            onKitchenToggle={(label) => {
              decide.patch({
                kitchenItems: kitchen.includes(label)
                  ? kitchen.filter((x) => x !== label)
                  : [...kitchen, label],
              });
            }}
            onNothing={() => { commitKitchen([]); }}
            onAnswer={answerByTap}
            place={decide.draft.place ?? null}
            onOpenPlaces={() => { setPlaceSheetOpen(true); }}
            onSkipPlace={() => {
              analytics.track(EVENTS.ASK_STEP_SKIPPED, { surface: 'ask', step: 'place' });
              void decide.decide();
            }}
          />
        )}

        {/* Kitchen is the one step with a Continue, because picking several
            things is not one decision — every other step auto-advances. */}
        {step === 'kitchen' && kitchen.length > 0 && !showingVerdict && (
          <button
            type="button"
            onClick={() => { commitKitchen(kitchen); }}
            className="mt-2 w-full rounded-blade-xs border-2 border-ink bg-sky py-2.5 text-[13px] font-extrabold text-white shadow-drop-sm transition-transform duration-fast active:scale-[.98]"
          >
            {ASK_COPY.questions.kitchen.use(kitchen.length)}
          </button>
        )}

        {/*
          After a verdict the composer ADAPTS rather than disappearing: the same
          box, now pointed at the dish. This is the whole point of the chat
          format — the wizard has nowhere to put "make it faster".

          It hides at zero rather than failing on submit, but the server refuses
          regardless, so the cap holds for anybody holding curl.
        */}
        {showingVerdict && features.ask_free_text && followUpsLeft !== 0 && (
          <AskComposer
            disabled={busy}
            textOn
            voiceOn={features.ask_voice}
            recording={
              recorder.blob !== null
                ? { blob: recorder.blob, durationMs: recorder.elapsedMs }
                : null
            }
            placeholder={ASK_COPY.composer.followUp}
            onSendText={(text) => { void askFollowUp(text); }}
            onSendVoice={() => {
              if (recorder.blob === null) return;
              void sendFollowUpVoice(recorder.blob);
              recorder.discard();
            }}
            onStartRecording={() => {
              analytics.track(EVENTS.ASK_MIC_CLICKED, { surface: 'ask', step: 'follow_up' });
              void recorder.start();
            }}
            onDiscardRecording={() => {
              analytics.track(EVENTS.ASK_RECORDING_DELETED, {
                surface: 'ask',
                duration_ms: recorder.elapsedMs,
              });
              recorder.discard();
            }}
          />
        )}

        {showingVerdict && followUpsLeft !== null && followUpsLeft <= 2 && (
          <p className="m-0 text-center font-mono text-[10.5px] font-semibold text-ink-4">
            {ASK_COPY.composer.followUpsLeft(followUpsLeft)}
          </p>
        )}

        {!showingVerdict && (
          <AskComposer
            disabled={busy}
            textOn={features.ask_free_text}
            voiceOn={features.ask_voice}
            recording={
              recorder.blob !== null
                ? { blob: recorder.blob, durationMs: recorder.elapsedMs }
                : null
            }
            onSendText={(text) => {
              analytics.track(EVENTS.ASK_TEXT_SENT, { surface: 'ask', char_count: text.length, step });
              void sendFreeform({ text });
            }}
            onSendVoice={() => {
              if (recorder.blob === null) return;
              analytics.track(EVENTS.ASK_VOICE_SENT, {
                surface: 'ask',
                duration_ms: recorder.elapsedMs,
                bytes: recorder.blob.size,
              });
              void sendFreeform({ blob: recorder.blob, durationMs: recorder.elapsedMs });
              recorder.discard();
            }}
            onStartRecording={() => {
              analytics.track(EVENTS.ASK_MIC_CLICKED, { surface: 'ask', step });
              void recorder.start();
            }}
            onDiscardRecording={() => {
              analytics.track(EVENTS.ASK_RECORDING_DELETED, {
                surface: 'ask',
                duration_ms: recorder.elapsedMs,
              });
              recorder.discard();
            }}
          />
        )}

        {recorder.state === 'denied' && (
          <p className="mt-2 text-center text-[11.5px] text-caution-onsoft">
            {ASK_COPY.voice.denied}
          </p>
        )}

        {/*
          Push back on the verdict. Each one is a LOCAL re-rank over the pool we
          already hold, so none of them costs a model call — which is what makes
          them affordable to offer at all.
        */}
        {showingVerdict && decide.verdict !== null && decide.verdict.verdict.meal_id !== '' && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                const current = decide.verdict?.verdict;
                if (current === undefined) return;
                setRejectedName(current.name);
                decide.reject(current.meal_id);
              }}
              className="rounded-pill border-2 border-line-2 bg-white px-3 py-1.5 text-[12px] font-extrabold text-ink-2 transition-colors duration-fast hover:border-ink"
            >
              {ASK_COPY.pushback.notFeelingIt}
            </button>
            <button
              type="button"
              onClick={() => { requestRevert('time'); }}
              className="rounded-pill border-2 border-line-2 bg-white px-3 py-1.5 text-[12px] font-extrabold text-ink-2 transition-colors duration-fast hover:border-ink"
            >
              {ASK_COPY.pushback.faster}
            </button>
            <button
              type="button"
              onClick={() => { requestRevert('weight'); }}
              className="rounded-pill border-2 border-line-2 bg-white px-3 py-1.5 text-[12px] font-extrabold text-ink-2 transition-colors duration-fast hover:border-ink"
            >
              {ASK_COPY.pushback.different}
            </button>
          </div>
        )}

        {showingVerdict && (
          <button
            type="button"
            onClick={restart}
            className="flex w-full items-center justify-center gap-1.5 rounded-blade-xs border-2 border-line-2 bg-white py-2.5 text-[12.5px] font-extrabold text-ink-2 hover:border-ink"
          >
            <RotateCcw size={13} strokeWidth={2.6} />
            {ASK_COPY.header.restart}
          </button>
        )}
      </div>

      {panelOpen && (
        <KitchenPanel
          options={options.data}
          selected={kitchen}
          onChange={(items) => { decide.patch({ kitchenItems: items }); }}
          onClose={() => { setPanelOpen(false); }}
          onSearch={(query, count) => {
            analytics.track(EVENTS.ASK_PANEL_SEARCH, {
              surface: 'ask',
              query_length: query.length,
              result_count: count,
              matched: count > 0,
            });
          }}
        />
      )}

      {placeSheetOpen && (
        <PlaceSheet
          value={decide.draft.place ?? null}
          onChange={(picked) => {
            decide.patch({
              place: picked,
              ...(picked?.city != null && { city: picked.city }),
            });
            if (picked === null) return;
            analytics.track(EVENTS.DECIDE_PLACE_CHOSEN, {
              surface: 'ask',
              place_id: picked.id,
              city: picked.city,
            });
          }}
          onClose={() => {
            setPlaceSheetOpen(false);
            const picked = decide.draft.place;
            if (picked == null) return;
            say({ role: 'cook', text: picked.name, source: 'tap', step: 'place' });
            say({ role: 'pot', text: ASK_COPY.reactions.place });
            void decide.decide();
          }}
          onSkip={() => {
            setPlaceSheetOpen(false);
            analytics.track(EVENTS.ASK_STEP_SKIPPED, { surface: 'ask', step: 'place' });
            void decide.decide();
          }}
        />
      )}

      {pendingSave !== null && (
        <SaveGate
          mealName={pendingSave.name}
          onClose={() => { setPendingSave(null); }}
          onAuthed={() => {
            /**
             * The intent survives the signup.
             *
             * `useRegister`/`useLogin` take `onDone` precisely so they do not
             * navigate — the modal closes, the thread is still there, and the
             * save they asked for completes without them doing it twice.
             */
            const meal = pendingSave;
            setPendingSave(null);
            persistSave(meal.id);
            analytics.track(EVENTS.ASK_BOOKMARK_SAVED, {
              surface: 'ask',
              meal_id: meal.id,
              after_signup: true,
            });
          }}
        />
      )}

      {pendingRevert !== null && (
        <RevertConfirm
          // The answer they would be going back to, so the dialog names
          // something concrete rather than asking about "this step".
          answer={
            messages.find((m) => m.role === 'cook' && m.step === pendingRevert)?.text ??
            ASK_COPY.questions[pendingRevert].ask
          }
          onCancel={() => { setPendingRevert(null); }}
          onConfirm={(dontAskAgain) => {
            if (dontAskAgain) {
              skipConfirm.current = true;
              try {
                localStorage.setItem(REVERT_PREF, '1');
              } catch {
                // Honoured for this page view either way.
              }
            }
            const target = pendingRevert;
            setPendingRevert(null);
            revisit(target);
          }}
        />
      )}

      {/*
        The curtain, over the conversation rather than instead of it.

        `fixed` and opaque so it covers completely, but the thread underneath
        is still mounted — which is what makes this read as something passing
        across the screen rather than the app discarding your place and
        rebuilding it.
      */}
      {curtain !== 'hidden' && (
        <div
          className={cn(
            'fixed inset-0 z-modal bg-paper',
            curtain === 'in' ? 'kj-curtain-in' : 'kj-curtain-out',
          )}
          // The conversation behind is inert while this is up, but it is still
          // there — a screen reader should not wander into it mid-sweep.
          aria-hidden={curtain === 'out'}
        >
          <DecideThinking candidates={null} />
        </div>
      )}

      {recorder.state === 'recording' && (
        <RecordingModal
          levels={recorder.levels}
          elapsedMs={recorder.elapsedMs}
          onDone={recorder.stop}
        />
      )}
    </div>
  );
}
