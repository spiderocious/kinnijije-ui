import type { ReactNode } from 'react';

/**
 * The email register — a different set of laws from the rest of the system.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/480-email-shell.html
 *                                                          481-email-header.html
 *                                                          482-email-button.html
 *                                                          483-email-card.html
 *                                                          484-email-footer.html
 *
 * **Email clients have no CSS variables, no flexbox, and no reliable
 * border-radius.** So this whole module is tables and inline styles, with the
 * hex values written out literally rather than read from a token. That is not a
 * lapse — it is the only construction that survives Outlook.
 *
 * **The blade degrades to a rectangle in Outlook, and that is accepted.** The
 * colour, the type and the copy carry the identity; no email is worth a VML
 * hack.
 *
 * These components render to static markup for an email-sending service. They
 * are not for use inside the app.
 */

/* The palette, written out — email cannot read a CSS variable. */
const INK = '#132430';
const INK_2 = '#3A5567';
const INK_3 = '#6E8798';
const PAPER = '#F7FAFC';
const PAPER_2 = '#EEF4F8';
const LINE = '#E3ECF2';
const SKY = '#38B6F0';
const WHITE = '#FFFFFF';
const GRAPE_SOFT = '#EFECFE';
const GRAPE_ONSOFT = '#3F2E9E';

/* Nunito degrades to Helvetica — no web fonts in email. */
const SANS = "'Nunito', Helvetica, Arial, sans-serif";
const DISPLAY = "'Baloo 2', 'Nunito', Helvetica, Arial, sans-serif";

const MAX_WIDTH = 520;

export interface EmailShellProps {
  /**
   * REQUIRED. The second line in every inbox, and it is not optional — an
   * email whose preview text is the first sentence of its own body wastes the
   * one piece of copy a recipient reads before deciding.
   */
  readonly preheader: string;
  readonly children: ReactNode;
}

/** The frame every email uses. */
export function EmailShell({ preheader, children }: EmailShellProps) {
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      width="100%"
      style={{ backgroundColor: PAPER, margin: 0, padding: 0 }}
    >
      <tbody>
        <tr>
          <td align="center" style={{ padding: '24px 12px' }}>
            {/* The preheader: visible to the inbox, hidden in the body. */}
            <div
              style={{
                display: 'none',
                maxHeight: 0,
                overflow: 'hidden',
                fontSize: '1px',
                lineHeight: '1px',
                color: PAPER,
              }}
            >
              {preheader}
            </div>

            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              border={0}
              width={MAX_WIDTH}
              style={{
                width: '100%',
                maxWidth: MAX_WIDTH,
                backgroundColor: WHITE,
                border: `2px solid ${INK}`,
                borderRadius: '24px 6px 24px 6px',
                fontFamily: SANS,
                color: INK,
              }}
            >
              <tbody>{children}</tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export interface EmailHeaderProps {
  readonly title?: string;
}

export function EmailHeader({ title }: EmailHeaderProps) {
  return (
    <tr>
      <td style={{ padding: '20px 24px', borderBottom: `1px solid ${LINE}` }}>
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: 22,
            fontWeight: 800,
            color: INK,
            letterSpacing: '-0.015em',
          }}
        >
          Kinnijije
        </span>
        {title !== undefined && (
          <span style={{ fontSize: 14, color: INK_3, marginLeft: 10 }}>{title}</span>
        )}
      </td>
    </tr>
  );
}

export interface EmailBodyProps {
  readonly children: ReactNode;
}

export function EmailBody({ children }: EmailBodyProps) {
  return (
    <tr>
      <td style={{ padding: 24, fontSize: 16, lineHeight: 1.55, color: INK_2 }}>{children}</td>
    </tr>
  );
}

export interface EmailHeadingProps {
  readonly children: ReactNode;
}

export function EmailHeading({ children }: EmailHeadingProps) {
  return (
    <h1
      style={{
        margin: '0 0 12px',
        fontFamily: DISPLAY,
        fontSize: 26,
        fontWeight: 800,
        lineHeight: 1.15,
        letterSpacing: '-0.015em',
        color: INK,
      }}
    >
      {children}
    </h1>
  );
}

export function EmailText({ children }: { readonly children: ReactNode }) {
  return <p style={{ margin: '0 0 14px', fontSize: 16, lineHeight: 1.55, color: INK_2 }}>{children}</p>;
}

export interface EmailButtonProps {
  readonly href: string;
  readonly label: string;
  readonly variant?: 'primary' | 'secondary';
}

/**
 * The only CTA construction that survives every major client.
 *
 * **Padding is on the CELL, never on the anchor** — Outlook ignores anchor
 * padding entirely, which is why a styled `<a>` collapses to a text link there.
 *
 * **One primary per email.** A second halves the response to both.
 */
export function EmailButton({ href, label, variant = 'primary' }: EmailButtonProps) {
  const primary = variant === 'primary';

  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '4px 0' }}>
      <tbody>
        <tr>
          <td
            align="center"
            style={{
              // The padding lives here, on the cell.
              padding: '13px 26px',
              backgroundColor: primary ? SKY : WHITE,
              border: `2px solid ${INK}`,
              borderRadius: '20px 6px 20px 6px',
            }}
          >
            <a
              href={href}
              style={{
                fontFamily: DISPLAY,
                fontSize: 16,
                fontWeight: 800,
                color: primary ? WHITE : INK,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {label}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export interface EmailCardProps {
  readonly name: string;
  readonly minutes: number;
  /** Renders the provenance line — the same claim as in the app. */
  readonly source: 'seed' | 'ai';
  readonly href: string;
}

/** A meal, in the email register. The provenance contract still holds. */
export function EmailCard({ name, minutes, source, href }: EmailCardProps) {
  const ai = source === 'ai';

  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      width="100%"
      style={{
        marginBottom: 12,
        backgroundColor: PAPER_2,
        border: `1px solid ${LINE}`,
        borderRadius: '16px 5px 16px 5px',
      }}
    >
      <tbody>
        <tr>
          <td style={{ padding: 16 }}>
            <a
              href={href}
              style={{
                fontFamily: DISPLAY,
                fontSize: 18,
                fontWeight: 800,
                color: INK,
                textDecoration: 'none',
              }}
            >
              {name}
            </a>
            <div style={{ marginTop: 6, fontSize: 14, color: INK_3 }}>
              {/* Even here, the label string is the one the app uses. */}
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  marginRight: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: '10px 3px 10px 3px',
                  backgroundColor: ai ? GRAPE_SOFT : '#E2F7F0',
                  color: ai ? GRAPE_ONSOFT : '#10604A',
                }}
              >
                {ai ? '◆ Made by AI' : '✓ Verified'}
              </span>
              <span style={{ fontFamily: 'monospace' }}>
                {ai ? '≈' : ''}
                {minutes} min
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export interface EmailFooterProps {
  /** REQUIRED. Every email carries a way to stop receiving it. */
  readonly unsubscribeHref: string;
  /** The pause link — offered in the body too, for the sensitive emails. */
  readonly pauseHref?: string;
}

export function EmailFooter({ unsubscribeHref, pauseHref }: EmailFooterProps) {
  return (
    <tr>
      <td
        style={{
          padding: '18px 24px',
          borderTop: `1px solid ${LINE}`,
          fontSize: 13,
          lineHeight: 1.6,
          color: INK_3,
        }}
      >
        <p style={{ margin: '0 0 8px' }}>Kinnijije — what to cook, from what you have.</p>
        <p style={{ margin: 0 }}>
          <a href={unsubscribeHref} style={{ color: INK_3, textDecoration: 'underline' }}>
            Unsubscribe
          </a>
          {pauseHref !== undefined && (
            <>
              {' · '}
              <a href={pauseHref} style={{ color: INK_3, textDecoration: 'underline' }}>
                Pause these for a while
              </a>
            </>
          )}
        </p>
      </td>
    </tr>
  );
}
