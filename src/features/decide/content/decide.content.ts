/**
 * Every word the flow says.
 *
 * One reviewable place, so the voice can be checked as a whole rather than
 * hunted through JSX. Voice rules, from docs/v2/design.html §07: short beats
 * clever, playful about the situation and never about the food, no
 * exclamation marks, no emoji, and never a joke inside an error.
 */
export const DECIDE_COPY = {
  hero: {
    /**
     * The headline is the question the visitor is already asking. The subhead
     * names the feeling rather than the mechanism, which the button and the
     * counters already cover.
     */
    // Split so the accent colour lands on the second line. "want to eat" over
    // "are you eating": it asks about appetite rather than a plan, which is the
    // thing somebody standing around undecided actually has.
    title: 'What do you want',
    titleAccent: 'to eat today?',
    sub: 'Stop being hungry and indecisive. Tell us what you have at home and KinniJije picks the meal, gives you the recipe, and says what you still need to buy.',
    cta: 'Show me what to eat',

    /*
     * The counters are NOT copy: they come from real server-side counts and
     * their labels live with the component that renders them, in stat-strip.tsx.
     * Inventing them here is how a landing page ends up quoting a number
     * nothing produced.
     */

    support: {
      prompt: 'Have a question?',
      label: 'Contact support',
      email: 'devferanmi@gmail.com',
    },

    signIn: 'Sign in',
    why: 'How it works',

    /**
     * What a signed-in cook sees instead.
     *
     * The guest copy sells the idea; a member has already bought it. Theirs
     * states what is ready and gets out of the way, and the counters and the
     * support line are dropped — social proof aimed at somebody who already
     * joined is noise.
     */
    member: {
      title: 'What do you want',
      titleAccent: 'to eat today?',
      /** With a kitchen on file. */
      subWithKitchen: (count: number) =>
        `Your kitchen is ready, ${String(count)} ${count === 1 ? 'thing' : 'things'} in it. Three quick questions and we will pick.`,
      /** Signed in, but nothing in stock yet. */
      subEmpty: 'Tell us what you have at home and we will pick tonight\'s meal.',
      cta: 'Decide for me',
    },
  },

  kitchen: {
    step: 'Step one',
    title: 'What do you have at home?',
    sub: "Tap what you've got. Rough is fine.",
    search: 'Search garri, ugu, panla, spaghetti…',
    more: 'More groups',
    fewer: 'Fewer groups',
    continue: (n: number) => (n === 0 ? 'Continue' : `Continue · ${String(n)} picked`),
    skip: "I have nothing, just decide for me",
  },

  /**
   * The invite, mid-flow.
   *
   * Written to be skippable without guilt: the dismiss line is a real option,
   * not a dark-pattern "no thanks, I hate saving money".
   */
  invite: {
    title: 'Want this remembered?',
    sub: 'Takes ten seconds. You keep going right after.',
    benefits: [
      'Your kitchen saved, so you never tap it again',
      'A fresh idea every morning, before you ask',
      'The full recipe and method, step by step',
    ],
    cta: 'Save my spot',
    dismiss: 'Not now, keep deciding',
    footnote: 'Free. No card. Your answers so far are kept either way.',
  },

  /** Shown to a signed-in cook in place of the kitchen step. */
  usingKitchen: {
    title: 'Using your kitchen',
    detail: (count: number, examples: string[]) =>
      `${String(count)} ${count === 1 ? 'thing' : 'things'} · ${examples.join(', ')}${count > examples.length ? '…' : ''}`,
    change: 'Change',
  },

  mood: {
    step: 'Step two',
    title: "How's your day going?",
    sub: 'Honestly. It changes what we pick.',
    continue: 'Continue',
  },

  weight: {
    step: 'Step three',
    title: 'What are you in the mood for?',
    sub: 'The shape of the plate, not the dish.',
    continue: 'Continue',
  },

  time: {
    step: 'Last one',
    title: 'How long have you got?',
    cityTitle: 'Where are you?',
    citySub: 'Optional. It lets us read the weather.',
    cityPlaceholder: 'Your city',
    cta: 'Decide what I eat',
    skip: 'Skip and decide without this',
  },

  thinking: {
    title: 'Working it out…',
  },

  verdict: {
    eyebrow: 'Tonight',
    change: 'Change an answer',
    restart: 'Start again',
    chosen: 'Chosen for you',
    nextBest: 'Next best',
    cook: 'Cook this',
    reject: 'Not feeling it? Try again',
    alternates: 'Or one of these',
    swap: 'tap to swap',
    have: 'You have',
    need: "You'll need",
    keepTitle: 'Keep this one?',
    keepBody:
      "Make a free account and we'll remember what you have, save this recipe, and have tomorrow's ready before you ask.",
    keepCta: 'Save it, free',
    keepSkip: 'No thanks, just cooking',
    /** Names the dish that was refused, so it reads as listening. */
    rejected: (name: string) => `Noted, not ${name.toLowerCase()}`,
    rejectedSub: "Here's the next one.",
  },

  /**
   * The slide past the last suggestion.
   *
   * Swiping on is a natural thing to do and used to hit a wall. This ends the
   * carousel somewhere that explains itself and offers only the things that
   * can actually produce different results.
   */
  endSlide: {
    title: "That's all of them",
    body: (count: number) =>
      count === 1
        ? 'One suggestion from what you told us. Change something and we will look again.'
        : `${String(count)} suggestions from what you told us. Change something and we will look again.`,
    change: 'Change an answer',
    regenerate: 'Try a different set',
    restart: 'Start over',
  },

  exhausted: {
    title: "That's everything that fits",
    body: 'Nothing left that matches what you asked for. Loosen the time, or tell us one more thing you have at home.',
    widen: 'Change an answer',
    restart: 'Start again',
  },

  limited: {
    title: "That's a lot of deciding",
    /** The refusal IS the offer. An honest wait, and a way past it. */
    body: (seconds: number) => {
      const minutes = Math.max(1, Math.ceil(seconds / 60));
      return `Another one in ${String(minutes)} ${minutes === 1 ? 'minute' : 'minutes'}, or make an account and we'll stop counting.`;
    },
    cta: 'Make a free account',
    wait: "I'll wait",
  },

  empty: {
    title: 'Nothing quite fits',
    body: 'Nothing matched that combination of time and taste. Try loosening one of them.',
  },
} as const;
