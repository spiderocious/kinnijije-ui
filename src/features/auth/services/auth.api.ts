import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

import type { AuthSession, AuthUser, LoginPayload, RegisterPayload } from '../types/auth.types';

/**
 * The network layer for auth. Paths come from EP — never hand-written here,
 * because a path that drifts from the backend is the most common cause of a
 * mystery 404.
 */
export const authApi = {
  register: (payload: RegisterPayload): Promise<AuthSession> =>
    apiClient.post<AuthSession>(EP.AUTH.REGISTER, payload),

  login: (payload: LoginPayload): Promise<AuthSession> =>
    apiClient.post<AuthSession>(EP.AUTH.LOGIN, payload),

  me: (): Promise<AuthUser> => apiClient.get<AuthUser>(EP.USERS.ME),

  logout: (refreshToken: string): Promise<void> =>
    apiClient.post<void>(EP.AUTH.LOGOUT, { refresh_token: refreshToken }),
};
