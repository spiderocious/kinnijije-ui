/**
 * Wire types for auth.
 *
 * These mirror the backend's serialiser exactly — snake_case, because that is
 * what crosses the wire. Renaming a field here without renaming it on the
 * server is the classic silent seam bug, so they are kept identical rather
 * than "tidied" into camelCase.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'moderator' | 'admin' | 'super_admin';
  status: 'pending' | 'active' | 'suspended' | 'banned' | 'deleted';
  email_verified_at: string | null;
  last_login_at: string | null;
  /** The server owns this. The client routes on it and never guesses. */
  onboarding_completed_at: string | null;
  has_onboarded: boolean;
  prefs: {
    cuisines: string[];
    difficulty: 'easy' | 'medium' | 'anything';
    measurement: 'metric' | 'imperial';
  };
  /** Drives the weather that shapes an AI answer. */
  city: string | null;
  country: string | null;
  notifications: { low_stock_nudges: boolean; weekly_summary: boolean };
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
