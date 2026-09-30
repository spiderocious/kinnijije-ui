/**
 * Something to read while the machine thinks.
 *
 * A wait with nothing in it feels twice as long as a wait with something to
 * read, and the honest alternative — a spinner and silence — is the one thing
 * guaranteed to make four seconds feel like ten.
 *
 * The rules for what goes in here:
 *
 *   Nigerian first. This is a Nigerian cooking app, and a wall of imported
 *   aphorisms about French bread would read as borrowed.
 *
 *   Attribution is honest, including when it is not known. "idk who wrote it"
 *   is funnier AND truer than inventing a source, and inventing one is how a
 *   product quietly teaches people wrong things.
 *
 *   Nothing punches down. Hunger is funny the way being broke is funny — from
 *   the inside, never at somebody.
 */
export interface Quote {
  readonly text: string;
  /** Who said it. Deliberately allowed to be a joke, or an admission. */
  readonly by: string;
}

export const DECIDE_QUOTES: readonly Quote[] = [
  { text: 'A hungry man is an angry man', by: 'idk who wrote it' },
  { text: 'Food wey sweet, na money kill am', by: 'every Nigerian mother' },
  { text: 'Rice is never the problem. What follows it is', by: 'a stew shortage survivor' },
  { text: 'You cannot use jollof to beg for forgiveness and fail', by: 'ancient Lagos wisdom' },
  { text: 'A watched pot never boils, but an unwatched one burns', by: 'somebody who learnt it twice' },
  { text: 'There is no such thing as too much pepper, only weak people', by: 'disputed' },
  { text: 'Indomie is a meal. Anyone who says otherwise has never been broke', by: 'the students' },
  { text: 'The best cook in the house is whoever is hungriest', by: 'proverb, probably' },
  { text: 'Eba does not ask questions. Eba provides', by: 'a satisfied customer' },
  { text: 'If you can smell it from the gate, you are already late', by: 'a neighbour' },
  { text: 'Beans take two hours. Patience takes longer', by: 'unverified' },
  { text: 'Nobody has ever regretted adding one more spoon of palm oil', by: 'contested, loudly' },
  { text: 'Plantain is proof that someone up there likes us', by: 'anonymous, wisely' },
  { text: 'A full stomach forgives almost anything', by: 'idk, but they were right' },
  { text: 'The soup you rush is the soup you explain', by: 'every aunty, at once' },
  { text: 'Hunger has no manners, which is why we cook before guests arrive', by: 'house rule' },
  { text: 'Salt is not an ingredient. Salt is a decision', by: 'a bold chef' },
  { text: 'Egusi does not need your approval', by: 'egusi' },
];

/**
 * A random order, fixed for one wait.
 *
 * Shuffled per mount rather than per tick: a list that reshuffles mid-wait can
 * show the same quote twice in a row, which looks like a bug rather than
 * variety. Fisher-Yates over a copy, so the exported array is never mutated.
 */
export function shuffledQuotes(): Quote[] {
  const pool = [...DECIDE_QUOTES];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = pool[i];
    const b = pool[j];
    if (a !== undefined && b !== undefined) {
      pool[i] = b;
      pool[j] = a;
    }
  }
  return pool;
}
