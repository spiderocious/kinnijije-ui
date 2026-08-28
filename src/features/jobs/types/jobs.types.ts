export interface Job {
  id: string;
  type: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  progress: number;
  progress_label: string | null;
  result: unknown;
  error: string | null;
  attempts: number;
  max_attempts: number;
  is_terminal: boolean;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}
