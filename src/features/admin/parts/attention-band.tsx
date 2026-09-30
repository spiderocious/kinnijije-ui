import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle, Check } from 'lucide-react';

import { ROUTES } from '@shared/constants/routes';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';

import type { AdminOverview } from '../services/admin.api';

/**
 * What needs you, before anything else.
 *
 * The single biggest change in the redesign: the dashboard now OPENS by saying
 * whether anything is wrong, instead of making an operator read forty numbers
 * to work it out. Every alert is derived from figures the overview already
 * returns — nothing new is collected to produce this.
 *
 * When everything is fine it collapses to one quiet line rather than
 * disappearing. "Nothing is wrong" is a result worth stating; an absent band
 * is indistinguishable from a band that failed to render.
 */

interface Alert {
  readonly id: string;
  readonly severity: 'critical' | 'caution';
  readonly title: string;
  readonly detail: string;
  readonly to?: string;
  readonly cta?: string;
}

/** A count, phrased so it reads as English at 1 and at 12. */
const plural = (n: number, one: string, many: string): string =>
  `${String(n)} ${n === 1 ? one : many}`;

function alertsFor(data: AdminOverview): Alert[] {
  const out: Alert[] = [];

  /**
   * People who answered every question and were told we had nothing.
   *
   * Critical rather than caution: it is the one failure in this product that
   * a person actually experiences, and it is nearly always a recipe coverage
   * hole rather than a bug — which means it is fixable.
   */
  if (data.decide.empty_today > 0) {
    const { empty_today: today, empty_yesterday: yesterday } = data.decide;
    const direction =
      yesterday === 0 ? 'none yesterday'
      : today > yesterday ? `up from ${String(yesterday)} yesterday`
      : today < yesterday ? `down from ${String(yesterday)} yesterday`
      : `same as yesterday`;

    out.push({
      id: 'empty-verdicts',
      severity: 'critical',
      title: `${plural(today, 'person', 'people')} asked and got nothing back`,
      detail: `Empty verdicts today, ${direction}. Usually a recipe coverage hole, not a bug.`,
      to: ROUTES.ADMIN_DECIDE,
      cta: 'Open decide',
    });
  }

  if (data.jobs.failed_last_day > 0) {
    out.push({
      id: 'jobs-failed',
      severity: 'caution',
      title: `${plural(data.jobs.failed_last_day, 'job', 'jobs')} failed in the last 24 hours`,
      detail: 'Retried and failed again. The job list has the error on each one.',
      to: ROUTES.ADMIN_JOBS,
      cta: 'Open jobs',
    });
  }

  /**
   * A rejected reply is normal in ones and twos and alarming as a rate.
   *
   * Five percent, not a raw count: ten failures out of ten thousand calls is
   * noise, and ten out of fifty is a broken prompt. Only meaningful once there
   * is enough volume for a rate to mean anything at all.
   */
  const failureRate = data.ai.calls > 0 ? data.ai.failed / data.ai.calls : 0;
  if (data.ai.calls >= 50 && failureRate > 0.05) {
    out.push({
      id: 'ai-rejects',
      severity: 'caution',
      title: `${String(Math.round(failureRate * 100))}% of model replies are being rejected`,
      detail: `${String(data.ai.failed)} of ${String(data.ai.calls)} failed the envelope and were thrown away.`,
      to: ROUTES.ADMIN_AI,
      cta: 'Open AI audit',
    });
  }

  return out;
}

export function AttentionBand({ data }: { readonly data: AdminOverview }) {
  const navigate = useNavigate();
  const alerts = alertsFor(data);

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-blade-sm border-hair border-success-border bg-success-soft px-3.5 py-2.5 text-[13px] font-bold text-success-onsoft">
        <Check size={15} strokeWidth={3} className="shrink-0" />
        Nothing needs you. No failed jobs, no empty verdicts today.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            'flex items-start gap-2.5 rounded-blade-sm border-2 border-ink p-3 shadow-drop-sm',
            alert.severity === 'critical' ? 'bg-critical-soft' : 'bg-caution-soft',
          )}
        >
          <span
            className={cn(
              'grid h-6 w-6 shrink-0 place-items-center rounded-blade-xs text-white',
              alert.severity === 'critical' ? 'bg-critical' : 'bg-caution',
            )}
          >
            <AlertTriangle size={13} strokeWidth={2.8} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="m-0 text-[13.5px] font-extrabold text-ink">{alert.title}</p>
            <p className="m-0 mt-0.5 text-[12.5px] text-ink-2">{alert.detail}</p>
          </div>

          {alert.to !== undefined && (
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0 self-center"
              onClick={() => {
                void navigate({ to: alert.to as never });
              }}
            >
              {alert.cta}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
