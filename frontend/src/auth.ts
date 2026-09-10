export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export const setAuthSession = (token: string, user: unknown) => {
  sessionStorage.setItem('authToken', token);
  sessionStorage.setItem('authUser', JSON.stringify(user));
  touchAuthSession();
};

export const clearAuthSession = () => {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('authUser');
  sessionStorage.removeItem('authLastActive');
};

export const getAuthToken = () => sessionStorage.getItem('authToken');

export const getAuthUser = (): { id?: number; name?: string; email?: string; role?: string } => {
  try {
    return JSON.parse(sessionStorage.getItem('authUser') || '{}');
  } catch {
    return {};
  }
};

export const touchAuthSession = () => {
  sessionStorage.setItem('authLastActive', String(Date.now()));
};

export const getSessionIdleMs = () => {
  const last = Number(sessionStorage.getItem('authLastActive') || 0);
  return Date.now() - last;
};

export const isAuthSessionExpired = () => getSessionIdleMs() > SESSION_TIMEOUT_MS;

export const authHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};