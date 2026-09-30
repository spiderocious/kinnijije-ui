import { useEffect, useRef, useState } from 'react';

import { shuffledQuotes, type Quote } from '../../content/decide.quotes';

/**
 * Quotes, typed out one character at a time, while the machine thinks.
 *
 * Deliberately `aria-hidden`. The screen around this is already a polite live
 * region announcing real progress, and a typewriter inside one would queue a
 * fresh announcement on every character — turning a four-second wait into
 * hundreds of interruptions for anyone on a screen reader. Sighted people get
 * the joke; everybody else gets the progress, uninterrupted.
 */

/** Per character. Fast enough to finish a line well inside one hold. */
const TYPE_MS = 34;

/** How long a finished quote sits before it is cleared. */
const HOLD_MS = 2_600;

/** Per character, wiping back out. Quicker than typing, as erasing should be. */
const ERASE_MS = 16;

type Phase = 'typing' | 'holding' | 'erasing';

export function QuoteTyper({ className }: { readonly className?: string }) {
  // Shuffled once per mount: a fresh order each wait, stable within it.
  const quotesRef = useRef<Quote[]>(shuffledQuotes());
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<Phase>('typing');

  const quotes = quotesRef.current;
  const quote = quotes[index % quotes.length];
  const full = quote?.text ?? '';

  /**
   * Somebody who asked for less motion gets the whole line at once.
   *
   * Read once on mount rather than subscribed to: a wait lasts seconds, and a
   * preference changed mid-wait is not worth the listener.
   */
  const reduced = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current;

  useEffect(() => {
    if (reduced) {
      setTyped(full);
      const id = setTimeout(() => {
        setIndex((n) => n + 1);
      }, HOLD_MS + 1_200);
      return () => { clearTimeout(id); };
    }

    if (phase === 'typing') {
      if (typed.length < full.length) {
        const id = setTimeout(() => {
          setTyped(full.slice(0, typed.length + 1));
        }, TYPE_MS);
        return () => { clearTimeout(id); };
      }
      const id = setTimeout(() => { setPhase('holding'); }, HOLD_MS);
      return () => { clearTimeout(id); };
    }

    if (phase === 'holding') {
      setPhase('erasing');
      return;
    }

    // erasing
    if (typed.length > 0) {
      const id = setTimeout(() => {
        setTyped(full.slice(0, typed.length - 1));
      }, ERASE_MS);
      return () => { clearTimeout(id); };
    }

    setIndex((n) => n + 1);
    setPhase('typing');
    return;
  }, [typed, full, phase, reduced]);

  // The attribution only appears once the line is complete — a punchline
  // revealed before its setup is not a punchline.
  const done = typed.length === full.length && full.length > 0;

  return (
    <p
      aria-hidden="true"
      className={[
        'm-0 min-h-[3.25em] max-w-[34ch] text-[13.5px] leading-relaxed text-ink-3',
        className ?? '',
      ].join(' ')}
    >
      <span className="text-ink-2">{typed}</span>
      {/* The caret blinks only while there is something to type, so a finished
          line does not sit there flashing at somebody reading it. */}
      {!reduced && !done && (
        <span className="ml-px inline-block w-[1px] animate-pulse bg-grape align-middle text-transparent">
          |
        </span>
      )}
      {done && quote !== undefined && (
        <span className="text-ink-4"> - {quote.by}</span>
      )}
    </p>
  );
}
