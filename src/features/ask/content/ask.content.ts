import type { AskQuestionStep } from '../types/ask.types';

/**
 * Everything Ask says.
 *
 * One file so the voice can be reviewed as a whole. The rules from
 * docs/v2/design.html §07 bind here exactly as they do in the tap flow: short
 * beats clever, no exclamation marks, never a joke inside an error, and never
 * a joke about somebody's food.
 */
export const ASK_COPY = {
  entry: {
    cta: 'Ask KinniJije AI',
    hint: 'Talk, type or tap',
  },

  header: {
    title: 'Ask KinniJije',
    restart: 'Start again',
  },

  questions: {
    kitchen: {
      ask: 'What do you have at home?',
      hint: 'Tap what you have, tell me, or say it.',
      nothing: 'Nothing, decide for me',
      search: 'Search ingredients',
      use: (n: number) => (n === 0 ? 'Continue' : `Use ${String(n)} ${n === 1 ? 'item' : 'items'}`),
      close: 'Close',
      popular: 'Popular',
      none: 'Nothing by that name. Try another word.',
    },
    mood: { ask: "How's your day going?", hint: 'Honestly. It changes what we pick.' },
    weight: { ask: 'What are you in the mood for?', hint: 'The shape of the plate.' },
    time: { ask: 'How long have you got?', hint: 'Be realistic.' },
    place: {
      ask: 'Where are you?',
      hint: 'So we can show what is being sold near you.',
      skip: 'Skip',
      pick: 'Pick an area',
      confirm: 'Use this area',
      open: 'Choose your area',
    },
  } satisfies Record<AskQuestionStep, { ask: string; hint: string } & Record<string, unknown>>,

  /**
   * What the pot says back.
   *
   * Deterministic and written, never generated — these cost no model call, and
   * thirty written lines is thirty chances to be annoying on a second read, so
   * anything that would not survive being seen five times is cut.
   */
  reactions: {
    kitchenSome: (first: string) => `${first}. That already opens a few doors.`,
    kitchenMany: (n: number) => `${String(n)} things. Plenty to work with.`,
    kitchenNone: 'No problem. I will work from what is quick.',
    moodTired: 'Understood. Nothing complicated then.',
    moodFast: 'Quick it is.',
    moodProper: 'Good. We can do something worth the effort.',
    moodComfort: 'Something familiar, then.',
    moodSurprise: 'Then let me pick.',
    weight: 'Noted.',
    place: 'Got it.',
  },

  /** Going back to an earlier answer. Destructive, so the first one is confirmed. */
  revert: {
    label: 'Go back to this answer',
    title: 'Go back to this answer?',
    body: 'Everything you said after this will be cleared, as if it never happened.',
    dontAsk: "Don't ask me again",
    confirm: 'Go back',
    cancel: 'Keep going',
  },

  composer: {
    placeholder: 'Or just tell me',
    send: 'Send',
    micLabel: 'Record a voice note',
    voiceOnly: 'Or say it',
    followUp: 'Ask about this dish, or push back',
    followUpsLeft: (n: number) =>
      n === 0 ? 'No more questions on this one' : `${String(n)} more question${n === 1 ? '' : 's'}`,
  },

  voice: {
    listening: 'Listening to you',
    done: 'Done',
    delete: 'Delete recording',
    play: 'Play recording',
    denied: 'No microphone access. You can still type or tap.',
    tooLong: 'Keep it under 30 seconds.',
  },

  turn: {
    transcribing: 'Working out what you said',
    parsing: 'Reading it',
    failed: 'That did not come through.',
    notFollowed: 'I did not quite follow that.',
    retry: 'Try again',
    alsoNoted: 'Also noted',
  },

  summary: {
    eyebrow: 'Tonight',
    youHave: 'You have',
    youNeed: "You'll need",
    orOneOfThese: 'Or one of these',
    framed: 'Framed for you',
    deterministic: 'Matched from your kitchen',
    more: (n: number) => `${String(n)} more in the shortlist`,
    title: (n: number) => `Found ${String(n)} ${n === 1 ? 'thing' : 'things'} you can cook.`,
    lead: (name: string, minutes: number) => `${name} leads, ${String(minutes)} min.`,
    allIn: 'Everything is in your kitchen.',
    view: 'Cook this',
    empty: 'Nothing quite fits',
    emptyBody: 'Nothing matched that combination. Try loosening the time, or tell me one more thing you have.',
    change: 'Change an answer',
  },

  /** Pushing back on a verdict. All three are local re-ranks, zero model calls. */
  pushback: {
    notFeelingIt: 'Not feeling it',
    faster: 'Make it faster',
    different: 'Something else',
  },

  /** "Save this" with no account yet. In place, never a redirect. */
  saveGate: {
    title: 'Keep this for later',
    body: (meal: string) => `Saving ${meal} needs a free account. It takes ten seconds and you come straight back.`,
    sub: 'Then we save it for you.',
    benefits: [
      'Every meal you save, waiting for you tomorrow',
      'Your kitchen remembered, so you never tap it twice',
      'A fresh idea every morning, before you ask',
    ],
    create: 'Create a free account',
    haveOne: 'I already have one',
    notNow: 'Not now',
    back: 'Back',
    close: 'Close',
    footnote: 'Free. No card. This conversation is kept either way.',
    signupTitle: 'Create your account',
    loginTitle: 'Welcome back',
    form: {
      name: 'Your name',
      namePlaceholder: 'Feranmi',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      createAndSave: 'Create account and save',
      signInAndSave: 'Sign in and save',
    },
  },

  bookmark: {
    save: 'Save this',
    saved: 'Saved',
    guestTitle: 'Save this for later',
    guestBody: 'Make a free account and it is here tomorrow.',
    guestCta: 'Create a free account',
    guestSkip: 'Not now',
  },

  limited: {
    title: "That's a lot of deciding",
    body: 'Another one shortly, or make an account and we will stop counting.',
  },
} as const;
