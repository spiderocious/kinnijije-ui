import { EP } from '@shared/constants/endpoints';
import { staffClient } from '../services/staff-client';

import type { AdminImage, AdminImageList, ImagePrompt } from './admin-images.types';

export const adminImagesApi = {
  list: (mealId: string): Promise<AdminImageList> =>
    staffClient.get<AdminImageList>(EP.ADMIN.RECIPE_IMAGES(mealId)),

  /** The prompt, without generating anything. Costs nothing. */
  prompt: (mealId: string): Promise<ImagePrompt> =>
    staffClient.get<ImagePrompt>(EP.ADMIN.RECIPE_IMAGE_PROMPT(mealId)),

  requestUpload: (
    mealId: string,
    body: { content_type: string; content_length: number },
  ): Promise<{ image_id: string; url: string; expires_in_seconds: number }> =>
    staffClient.post(EP.ADMIN.RECIPE_IMAGE_UPLOAD_URL(mealId), body),

  confirmUpload: (mealId: string, imageId: string, contentType: string): Promise<AdminImage> =>
    staffClient.post(EP.ADMIN.RECIPE_IMAGE_CONFIRM(mealId, imageId), { content_type: contentType }),

  /** Returns a job id; the console follows it rather than waiting. */
  generate: (mealId: string, promptOverride?: string): Promise<{ job_id: string }> =>
    staffClient.post(
      EP.ADMIN.RECIPE_IMAGE_GENERATE(mealId),
      promptOverride !== undefined ? { prompt_override: promptOverride } : {},
    ),

  publish: (mealId: string, imageId: string): Promise<AdminImage> =>
    staffClient.post(EP.ADMIN.RECIPE_IMAGE_PUBLISH(mealId, imageId)),

  reject: (mealId: string, imageId: string, reason: string): Promise<AdminImage> =>
    staffClient.post(EP.ADMIN.RECIPE_IMAGE_REJECT(mealId, imageId), { reason }),

  setPrimary: (mealId: string, imageId: string): Promise<{ primary_image_id: string }> =>
    staffClient.put(EP.ADMIN.RECIPE_IMAGE_PRIMARY(mealId), { image_id: imageId }),

  remove: (mealId: string, imageId: string): Promise<void> =>
    staffClient.delete(EP.ADMIN.RECIPE_IMAGE(mealId, imageId)),
};

/**
 * Uploads the bytes straight to R2.
 *
 * Deliberately NOT through `apiClient`: it attaches our Authorization header,
 * and S3 rejects a presigned PUT that carries one. It is also a different
 * origin entirely — the whole point of presigning is that the bytes never
 * touch our server.
 */
export async function putToPresignedUrl(
  url: string,
  file: File,
): Promise<void> {
  const response = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!response.ok) {
    throw new Error(`Upload failed with ${String(response.status)}`);
  }
}
