import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Recording a voice note.
 *
 * The amplitude is REAL, read off an AnalyserNode. A waveform that animates
 * while the room is silent is a lie somebody can hear, and it undermines the
 * one thing this screen has to communicate: that we are listening.
 *
 * Silence detection works off the same analyser rather than a fixed timer, so
 * it stops when somebody actually stops talking instead of when a clock runs
 * out mid-sentence.
 */

/** A recording longer than this is a monologue, not an answer. */
export const MAX_RECORDING_MS = 30_000;

/** Quiet for this long and we assume they are finished. */
const SILENCE_MS = 2_500;

/** RMS below this counts as silence. Tuned above typical room noise. */
const SILENCE_THRESHOLD = 0.012;

/** How many bars the waveform draws. */
export const WAVE_BARS = 24;

export type RecorderState = 'idle' | 'requesting' | 'denied' | 'recording' | 'ready';

export interface UseRecorder {
  state: RecorderState;
  /** 0–1 per bar, newest last. Drives the waveform directly. */
  levels: number[];
  elapsedMs: number;
  /** The finished recording, once there is one. */
  blob: Blob | null;
  start: () => Promise<void>;
  stop: () => void;
  discard: () => void;
  /** Why recording ended, for the analytics split. */
  stopReason: 'done' | 'silence' | 'max' | 'cancelled' | null;
}

export function useRecorder(): UseRecorder {
  const [state, setState] = useState<RecorderState>('idle');
  const [levels, setLevels] = useState<number[]>(() => new Array<number>(WAVE_BARS).fill(0));
  const [elapsedMs, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [stopReason, setStopReason] = useState<UseRecorder['stopReason']>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedRef = useRef(0);
  const quietSinceRef = useRef<number | null>(null);
  /** Read inside the animation frame, where state would be a stale closure. */
  const stoppingRef = useRef(false);

  const teardown = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => { track.stop(); });
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    recorderRef.current = null;
  }, []);

  const finish = useCallback(
    (reason: NonNullable<UseRecorder['stopReason']>) => {
      if (stoppingRef.current) return;
      stoppingRef.current = true;
      setStopReason(reason);
      recorderRef.current?.stop();
    },
    [],
  );

  const start = useCallback(async () => {
    setState('requesting');
    setBlob(null);
    setStopReason(null);
    stoppingRef.current = false;
    chunksRef.current = [];
    quietSinceRef.current = null;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Denied, dismissed, or no microphone — all the same to us, and all
      // handled by leaving the composer usable rather than nagging.
      setState('denied');
      return;
    }

    streamRef.current = stream;

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      setBlob(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
      setState('ready');
      teardown();
    };

    // Analyser for the wave AND the silence check — one source of truth for
    // "is anybody talking", so what is drawn and what is acted on agree.
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buffer = new Float32Array(analyser.fftSize);

    startedRef.current = performance.now();
    recorder.start();
    setState('recording');

    const tick = (): void => {
      if (stoppingRef.current) return;

      analyser.getFloatTimeDomainData(buffer);
      let sum = 0;
      for (const sample of buffer) sum += sample * sample;
      const rms = Math.sqrt(sum / buffer.length);

      // Scaled and clamped: raw RMS from a phone mic rarely passes 0.3, so the
      // bars would barely move without it.
      const level = Math.min(1, rms * 4);
      setLevels((prev) => [...prev.slice(1), level]);

      const now = performance.now();
      const elapsed = now - startedRef.current;
      setElapsed(elapsed);

      if (elapsed >= MAX_RECORDING_MS) {
        finish('max');
        return;
      }

      if (rms < SILENCE_THRESHOLD) {
        quietSinceRef.current ??= now;
        // Only after something was actually said — otherwise a slow start
        // would stop the recording before the first word.
        if (elapsed > 1_200 && now - quietSinceRef.current > SILENCE_MS) {
          finish('silence');
          return;
        }
      } else {
        quietSinceRef.current = null;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [finish, teardown]);

  const stop = useCallback(() => { finish('done'); }, [finish]);

  const discard = useCallback(() => {
    stoppingRef.current = true;
    recorderRef.current?.stop();
    teardown();
    setBlob(null);
    setElapsed(0);
    setLevels(new Array<number>(WAVE_BARS).fill(0));
    setState('idle');
    setStopReason('cancelled');
  }, [teardown]);

  // A tab closed mid-recording must release the microphone.
  useEffect(() => teardown, [teardown]);

  return { state, levels, elapsedMs, blob, start, stop, discard, stopReason };
}
