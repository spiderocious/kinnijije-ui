import { EP } from '@shared/constants/endpoints';
import { ENV } from '@shared/config/env';
import { apiClient } from '@shared/services/api-client';

import type {
  AskFollowUp,
  AskSession,
  AskSource,
  AskStep,
  AskTurn,
  AskUploadTicket,
} from '../types/ask.types';

/**
 * Ask KinniJije.
 *
 * Every call is public. The session id is the credential and it travels in the
 * path, so there is nothing to attach — `apiClient` will send a token when one
 * exists, which is harmless and lets a signed-in cook's history attach.
 */
export const askApi = {
  start: (): Promise<AskSession> => apiClient.post<AskSession>(EP.ASK.SESSIONS),

  session: (id: string): Promise<AskSession> => apiClient.get<AskSession>(EP.ASK.SESSION(id)),

  /**
   * A ticket to PUT one recording straight at storage.
   *
   * The audio never passes through our API: a thirty-second clip on a bad
   * connection would otherwise occupy a server process for the whole upload.
   */
  uploadTicket: (
    sessionId: string,
    input: { content_type: string; size: number },
  ): Promise<AskUploadTicket> =>
    apiClient.post<AskUploadTicket>(EP.ASK.UPLOAD_URL(sessionId), input),

  /**
   * Puts the bytes where the ticket says.
   *
   * Plain `fetch`, not `apiClient`: this goes to storage rather than to us, and
   * attaching our auth header to somebody else's host would leak a token.
   */
  upload: async (ticket: AskUploadTicket, blob: Blob): Promise<void> => {
    const response = await fetch(ticket.url, {
      method: 'PUT',
      headers: { 'Content-Type': blob.type },
      body: blob,
    });
    if (!response.ok) throw new Error(`Upload failed with ${String(response.status)}`);
  },

  createTurn: (
    sessionId: string,
    input: { step: AskStep; source: AskSource; text?: string; audio_key?: string },
  ): Promise<AskTurn> => apiClient.post<AskTurn>(EP.ASK.TURNS(sessionId), input),

  /**
   * Talking back to a verdict.
   *
   * The shortlist travels with the question so the model can only swap to
   * something already on screen — the server rejects anything outside it.
   */
  followUp: (
    sessionId: string,
    input: { question: string; allowed_meal_ids: string[]; context: string },
  ): Promise<AskFollowUp> => apiClient.post<AskFollowUp>(EP.ASK.FOLLOW_UP(sessionId), input),

  turn: (sessionId: string, turnId: string): Promise<AskTurn> =>
    apiClient.get<AskTurn>(EP.ASK.TURN(sessionId, turnId)),

  /** The absolute URL an EventSource needs. */
  streamUrl: (sessionId: string, turnId: string): string =>
    `${ENV.API_BASE_URL}${EP.ASK.TURN_STREAM(sessionId, turnId)}`,
};
