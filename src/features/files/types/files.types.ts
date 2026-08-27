export type FilePurpose = 'shelf_photo' | 'receipt' | 'voice_note' | 'recipe_hero' | 'avatar';

export type FileStatus = 'pending' | 'ready' | 'expired';

/**
 * The wire shape of a file.
 *
 * Note what is NOT here: the storage key. It never crosses the wire — what you
 * get is `url`, freshly signed and short-lived. Do not persist it anywhere; ask
 * for the file again instead.
 */
export interface StoredFile {
  id: string;
  purpose: FilePurpose;
  status: FileStatus;
  content_type: string;
  size: number | null;
  original_filename: string | null;
  url: string | null;
  url_expires_in: number;
  uploaded_at: string | null;
  created_at: string;
}

export interface UploadTicket {
  file: StoredFile;
  upload_url: string;
  upload_expires_in: number;
  /** Must be sent verbatim on the PUT, or the signature will not match. */
  required_headers: Record<string, string>;
}

export interface RequestUploadPayload {
  purpose: FilePurpose;
  content_type: string;
  filename: string;
  size_bytes: number;
}
