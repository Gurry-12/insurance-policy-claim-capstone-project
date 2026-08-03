// In-memory access token holder.
//
// Keeping the access token out of localStorage means an XSS payload cannot
// read it directly. Sessions are restored silently on app boot via the
// HttpOnly refresh cookie (see AuthContext.restoreSession), so a page reload
// never asks the user to log in again while the refresh session is alive.
let accessToken = null;

export const getToken = () => accessToken;

export const setToken = (token) => {
  accessToken = token ?? null;
};

export const clearToken = () => {
  accessToken = null;
};
