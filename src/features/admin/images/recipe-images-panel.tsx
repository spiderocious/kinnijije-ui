import { useRef, useState } from 'react';
import { Check, Copy, ImageOff, Sparkles, Star, Trash2, Upload, X } from 'lucide-react';

import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import {
  useGenerateImage,
  useImageActions,
  useImagePrompt,
  useRecipeImages,
  useUploadImage,
} from './use-admin-images';
import type { AdminImage } from './admin-images.types';

/** Matches MAX_RECIPE_IMAGES on the server; the server is the real guard. */
const MAX_IMAGES = 8;

/**
 * The image lifecycle, as a badge.
 *
 * Local rather than reused: `Tag` is deliberately limited to neutral and info,
 * and `Status` maps a fixed set of domain enums. An image state is neither, so
 * forcing it through either would bend a component away from its contract.
 */
const STATUS_CLASS: Record<AdminImage['status'], string> = {
  pending: 'border-line-2 bg-paper-2 text-ink-3',
  review: 'border-caution-border bg-caution-soft text-caution-onsoft',
  published: 'border-success-border bg-success-soft text-success-onsoft',
  rejected: 'border-critical-border bg-critical-soft text-critical-onsoft',
};

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-pill border-hair px-1.5 py-0.5 text-[9.5px] font-extrabold',
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function ImageCard({
  image,
  mealId,
  busy,
}: {
  readonly image: AdminImage;
  readonly mealId: string;
  readonly busy: boolean;
}) {
  const { publish, reject, setPrimary, remove } = useImageActions(mealId);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <div
      className={[
        'relative overflow-hidden rounded-blade-xs border bg-paper',
        image.is_primary ? 'border-2 border-ink shadow-drop-sm' : 'border-hair border-line-2',
      ].join(' ')}
    >
      <div className="relative grid h-[92px] place-items-center border-b-hair border-line-2 bg-paper-2">
        {image.thumb_url !== null ? (
          <img src={image.thumb_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageOff size={20} className="text-ink-4" aria-hidden="true" />
        )}

        <span className="absolute left-1.5 top-1.5 flex gap-1">
          {image.is_primary && (
            <Badge className="border-ink bg-white text-ink">Primary</Badge>
          )}
          {/* Grape is AI provenance, system-wide. A photograph carries no mark. */}
          {image.source === 'generated' && (
            <Badge className="border-grape-border bg-grape-soft text-grape-onsoft">AI</Badge>
          )}
          <Badge className={STATUS_CLASS[image.status]}>{image.status}</Badge>
        </span>
      </div>

      <div className="flex flex-col gap-1.5 p-2">
        <span className="font-mono text-[10.5px] text-ink-3">
          {image.source}
          {image.check_confidence !== null && ` · ${image.check_confidence.toFixed(2)}`}
        </span>

        {image.check_reason !== null && (
          <p className="text-[10.5px] leading-snug text-ink-3">{image.check_reason}</p>
        )}
        {image.rejection_reason !== null && (
          <p className="text-[10.5px] leading-snug text-critical-onsoft">
            {image.rejection_reason}
          </p>
        )}

        {rejecting ? (
          <div className="flex flex-col gap-1.5">
            <input
              value={reason}
              onChange={(e) => { setReason(e.target.value); }}
              placeholder="Why? e.g. this is paella, not jollof"
              aria-label="Rejection reason"
              className="w-full rounded-[6px_2px_6px_2px] border-hair border-line-2 px-2 py-1 text-[11px] outline-none focus:border-sky"
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                destructive
                disabled={reason.trim().length === 0 || busy}
                onClick={() => {
                  reject.mutate({ imageId: image.id, reason: reason.trim() });
                  setRejecting(false);
                  setReason('');
                }}
              >
                Reject
              </Button>
              <Button size="sm" variant="tertiary" onClick={() => { setRejecting(false); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {image.status === 'review' && (
              <>
                <Button
                  size="sm"
                  loading={publish.isPending}
                  onClick={() => { publish.mutate(image.id); }}
                >
                  <Check size={12} strokeWidth={3} className="mr-1" />
                  Publish
                </Button>
                <Button size="sm" variant="tertiary" onClick={() => { setRejecting(true); }}>
                  <X size={12} strokeWidth={3} className="mr-1" />
                  Reject
                </Button>
              </>
            )}

            {image.status === 'published' && !image.is_primary && (
              <Button
                size="sm"
                variant="secondary"
                loading={setPrimary.isPending}
                onClick={() => { setPrimary.mutate(image.id); }}
              >
                <Star size={12} strokeWidth={2.6} className="mr-1" />
                Make primary
              </Button>
            )}

            <Button
              size="sm"
              variant="tertiary"
              destructive
              loading={remove.isPending}
              onClick={() => { remove.mutate(image.id); }}
              aria-label="Delete image"
            >
              <Trash2 size={12} strokeWidth={2.4} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Recipe imagery, on the recipe it belongs to.
 *
 * Three ways in, all landing in the same review step:
 *   1. Upload a finished PNG.
 *   2. Copy the prompt, generate it elsewhere, clean it, upload it.
 *   3. Generate in-app — a queued job the console follows.
 */
export function RecipeImagesPanel({ mealId }: { readonly mealId: string }) {
  const { data, isLoading } = useRecipeImages(mealId);
  const upload = useUploadImage(mealId);
  const generate = useGenerateImage(mealId);

  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const prompt = useImagePrompt(mealId, showPrompt);
  const images = data?.images ?? [];
  const atCap = images.length >= MAX_IMAGES;
  const busy = upload.isPending || generate.isPending;

  const copyPrompt = async () => {
    const text = draftPrompt ?? prompt.data?.prompt;
    if (text === undefined || text === null) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => { setCopied(false); }, 2000);
    } catch {
      // Clipboard is blocked in some contexts; the textarea is still selectable.
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-base font-extrabold text-ink">Images</h2>
        <Tag>
          {images.length} of {MAX_IMAGES}
        </Tag>
        <span className="flex-1" />

        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file !== undefined) upload.mutate(file);
            e.target.value = '';
          }}
        />

        <Button
          size="sm"
          variant="secondary"
          disabled={atCap || busy}
          loading={upload.isPending}
          onClick={() => { fileInput.current?.click(); }}
        >
          <Upload size={12} strokeWidth={2.6} className="mr-1" />
          Upload
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => { setShowPrompt((v) => !v); }}
        >
          <Copy size={12} strokeWidth={2.6} className="mr-1" />
          {showPrompt ? 'Hide prompt' : 'Get prompt'}
        </Button>

        <Button
          size="sm"
          disabled={atCap || busy}
          loading={generate.isPending}
          onClick={() => { generate.mutate(draftPrompt ?? undefined); }}
        >
          <Sparkles size={12} strokeWidth={2.6} className="mr-1" />
          Generate
        </Button>
      </header>

      {atCap && (
        <Callout
          tone="caution"
          title="This recipe is at the image limit"
          body="Delete one before adding another."
        />
      )}

      {upload.isError && (
        <Callout
          tone="critical"
          title="Upload failed"
          body={upload.error instanceof Error ? upload.error.message : 'Try again.'}
        />
      )}

      {showPrompt && (
        <div className="flex flex-col gap-2 rounded-blade-xs border-hair border-line-2 bg-paper-2 p-3">
          <p className="text-[12px] text-ink-3">
            Copy this, generate it wherever you like, remove the magenta background, then
            <strong className="text-ink"> Upload</strong> the finished PNG. Editing it here also
            changes what <strong className="text-ink">Generate</strong> sends.
          </p>
          <textarea
            value={draftPrompt ?? prompt.data?.prompt ?? 'Loading…'}
            onChange={(e) => { setDraftPrompt(e.target.value); }}
            rows={10}
            aria-label="Image prompt"
            className="w-full rounded-[6px_2px_6px_2px] border-hair border-line-2 bg-white p-2 font-mono text-[11px] leading-relaxed text-ink outline-none focus:border-sky"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => { void copyPrompt(); }}>
              {copied ? <Check size={12} strokeWidth={3} className="mr-1" /> : <Copy size={12} strokeWidth={2.6} className="mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            {draftPrompt !== null && (
              <Button size="sm" variant="tertiary" onClick={() => { setDraftPrompt(null); }}>
                Reset to default
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-ink-3">Loading images…</p>
      ) : images.length === 0 ? (
        <Callout
          tone="neutral"
          title="No images yet"
          body="Upload a photograph, or generate one. Until then this recipe shows its drawn icon."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {images.map((image) => (
            <ImageCard key={image.id} image={image} mealId={mealId} busy={busy} />
          ))}
        </div>
      )}
    </section>
  );
}
