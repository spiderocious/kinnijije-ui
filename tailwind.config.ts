import type { Config } from 'tailwindcss';

/**
 * Sky kitchen — every value here reads a CSS variable defined in `src/index.css`.
 * Nothing is hardcoded, so the `.counter` register (and any future mode) can
 * re-point a token without touching a single component.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/_foundation.css
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Ground */
        white: 'var(--white)',
        paper: {
          DEFAULT: 'var(--paper)',
          2: 'var(--paper-2)',
          3: 'var(--paper-3)',
        },
        line: {
          DEFAULT: 'var(--line)',
          2: 'var(--line-2)',
        },

        /* Ink ladder */
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          4: 'var(--ink-4)',
          inv: 'var(--ink-inv)',
        },

        /* Sky — the one action colour. Never a status. */
        sky: {
          50: 'var(--sky-50)',
          100: 'var(--sky-100)',
          200: 'var(--sky-200)',
          300: 'var(--sky-300)',
          400: 'var(--sky-400)',
          500: 'var(--sky-500)',
          600: 'var(--sky-600)',
          700: 'var(--sky-700)',
          800: 'var(--sky-800)',
          900: 'var(--sky-900)',
          DEFAULT: 'var(--sky)',
          deep: 'var(--sky-deep)',
          press: 'var(--sky-press)',
          soft: 'var(--sky-soft)',
          edge: 'var(--sky-edge)',
          on: 'var(--sky-on)',
          onbase: 'var(--sky-onbase)',
        },

        /* The semantic enum — 5 values x 5 slots, reused verbatim everywhere */
        neutral: {
          DEFAULT: 'var(--neutral)',
          soft: 'var(--neutral-soft)',
          onsoft: 'var(--neutral-onsoft)',
          border: 'var(--neutral-border)',
          on: 'var(--neutral-on)',
        },
        info: {
          DEFAULT: 'var(--info)',
          soft: 'var(--info-soft)',
          onsoft: 'var(--info-onsoft)',
          border: 'var(--info-border)',
          on: 'var(--info-on)',
        },
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-soft)',
          onsoft: 'var(--success-onsoft)',
          border: 'var(--success-border)',
          on: 'var(--success-on)',
        },
        caution: {
          DEFAULT: 'var(--caution)',
          soft: 'var(--caution-soft)',
          onsoft: 'var(--caution-onsoft)',
          border: 'var(--caution-border)',
          on: 'var(--caution-on)',
        },
        critical: {
          DEFAULT: 'var(--critical)',
          soft: 'var(--critical-soft)',
          onsoft: 'var(--critical-onsoft)',
          border: 'var(--critical-border)',
          on: 'var(--critical-on)',
        },

        /* Outside the enum — AI provenance only. Never a severity, never a button. */
        grape: {
          DEFAULT: 'var(--grape)',
          soft: 'var(--grape-soft)',
          onsoft: 'var(--grape-onsoft)',
          border: 'var(--grape-border)',
          on: 'var(--grape-on)',
        },

        /* Food tints — dish marks only, never chrome */
        dish: {
          fill: 'var(--dish-fill)',
          line: 'var(--dish-line)',
        },
        greens: {
          fill: 'var(--greens-fill)',
          line: 'var(--greens-line)',
        },
        berry: {
          fill: 'var(--berry-fill)',
          line: 'var(--berry-line)',
        },

        scrim: 'var(--scrim)',
      },

      /* THE BLADE — one sharp corner, three round. Pill and round are the
         only two exceptions in the whole system. */
      borderRadius: {
        'blade-xs': 'var(--blade-xs)',
        'blade-sm': 'var(--blade-sm)',
        blade: 'var(--blade-md)',
        'blade-md': 'var(--blade-md)',
        'blade-lg': 'var(--blade-lg)',
        'blade-xl': 'var(--blade-xl)',
        pill: 'var(--r-pill)',
        round: 'var(--r-round)',
      },

      borderWidth: {
        hair: 'var(--bw-hair)',
        DEFAULT: 'var(--bw)',
        bold: 'var(--bw-bold)',
      },

      /* Depth is a SOLID drop-edge. Blur is the overlay layer only. */
      boxShadow: {
        'drop-sm': 'var(--drop-sm)',
        drop: 'var(--drop)',
        'drop-lg': 'var(--drop-lg)',
        'drop-sky': 'var(--drop-sky)',
        'drop-crit': 'var(--drop-crit)',
        pop: 'var(--shadow-pop)',
        modal: 'var(--shadow-modal)',
        none: 'none',
      },

      fontFamily: {
        display: ['Baloo 2 Variable', 'Baloo 2', 'Nunito', 'system-ui', 'sans-serif'],
        sans: ['Nunito Variable', 'Nunito', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono Variable', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        xs: ['var(--fs-xs)', { lineHeight: '1.45' }],
        sm: ['var(--fs-sm)', { lineHeight: '1.5' }],
        base: ['var(--fs-base)', { lineHeight: '1.55' }],
        md: ['var(--fs-md)', { lineHeight: '1.55' }],
        lg: ['var(--fs-lg)', { lineHeight: '1.4' }],
        xl: ['var(--fs-xl)', { lineHeight: '1.3' }],
        '2xl': ['var(--fs-2xl)', { lineHeight: '1.2' }],
        '3xl': ['var(--fs-3xl)', { lineHeight: '1.1' }],
        '4xl': ['var(--fs-4xl)', { lineHeight: '1.06' }],
        '5xl': ['var(--fs-5xl)', { lineHeight: '1.04' }],
        '6xl': ['var(--fs-6xl)', { lineHeight: '1.02' }],
        ctrl: ['var(--fs-ctrl)', { lineHeight: '1.2' }],
      },

      letterSpacing: {
        display: 'var(--track-display)',
        h: 'var(--track-h)',
        body: 'var(--track-body)',
        label: 'var(--track-label)',
        overline: 'var(--track-overline)',
      },

      spacing: {
        1: 'var(--s-1)',
        2: 'var(--s-2)',
        3: 'var(--s-3)',
        4: 'var(--s-4)',
        5: 'var(--s-5)',
        6: 'var(--s-6)',
        7: 'var(--s-7)',
        8: 'var(--s-8)',
        9: 'var(--s-9)',
        10: 'var(--s-10)',
        11: 'var(--s-11)',
        pad: 'var(--pad)',
        'row-y': 'var(--row-y)',
        gap: 'var(--gap)',
      },

      /* Control heights resolve per register — KITCHEN by default, COUNTER
         under `.counter`. This is why no component takes a density prop. */
      height: {
        ctrl: 'var(--h-md)',
        'ctrl-sm': 'var(--h-sm)',
        'ctrl-lg': 'var(--h-lg)',
      },
      minHeight: {
        ctrl: 'var(--h-md)',
        'ctrl-sm': 'var(--h-sm)',
        'ctrl-lg': 'var(--h-lg)',
      },
      width: {
        ctrl: 'var(--h-md)',
        'ctrl-sm': 'var(--h-sm)',
        'ctrl-lg': 'var(--h-lg)',
      },
      minWidth: {
        ctrl: 'var(--h-md)',
        'ctrl-sm': 'var(--h-sm)',
        'ctrl-lg': 'var(--h-lg)',
      },

      zIndex: {
        base: 'var(--z-base)',
        sticky: 'var(--z-sticky)',
        nav: 'var(--z-nav)',
        dropdown: 'var(--z-dropdown)',
        scrim: 'var(--z-scrim)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      },

      transitionTimingFunction: {
        DEFAULT: 'var(--ease)',
        kj: 'var(--ease)',
        'kj-out': 'var(--ease-out)',
        'kj-in': 'var(--ease-in)',
      },

      transitionDuration: {
        press: 'var(--t-press)',
        fast: 'var(--t-fast)',
        base: 'var(--t-base)',
        slow: 'var(--t-slow)',
      },

      animation: {
        shimmer: 'kj-shimmer 1.4s var(--ease-out) infinite',
        serve: 'kj-serve var(--t-base) var(--ease) both',
        pop: 'kj-pop var(--t-base) var(--ease) both',
        steam: 'kj-steam 1.6s var(--ease-out) infinite',
        bob: 'kj-bob 2.4s var(--ease-out) infinite',
        spin: 'kj-spin 1.1s linear infinite',
        'slide-up': 'kj-slide-up var(--t-slow) var(--ease-out) both',
        'slide-down': 'kj-slide-down var(--t-slow) var(--ease-out) both',
        'slide-left': 'kj-slide-left var(--t-slow) var(--ease-out) both',
        'slide-right': 'kj-slide-right var(--t-slow) var(--ease-out) both',
        fade: 'kj-fade var(--t-fast) var(--ease-out) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
