/** Mirrors backend/src/features/admin/images/admin-images.types.ts. */
export type ImageSource = 'upload' | 'generated';
export type ImageStatus = 'pending' | 'review' | 'published' | 'rejected';

export interface AdminImage {
  id: string;
  key: string;
  hero_url: string | null;
  card_url: string | null;
  thumb_url: string | null;
  source: ImageSource;
  status: ImageStatus;
  is_primary: boolean;
  blur: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  prompt: string | null;
  model: string | null;
  prompt_version: number | null;
  check_confidence: number | null;
  check_reason: string | null;
  job_id: string | null;
  added_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string | null;
}

export interface AdminImageList {
  images: AdminImage[];
  primary_image_id: string | null;
}

export interface ImagePrompt {
  prompt: string;
  meal_name: string;
}
