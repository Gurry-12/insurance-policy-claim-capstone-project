import { createContext, useState, useCallback, useEffect } from "react";

import { logout as revokeServerSession, refreshSession } from "../services/authService";
import { setToken as storeToken, clearToken } from "../api/tokenStore";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

// Marker used only to decide whether boot should attempt a silent restore.
// It is non-sensitive; the access token itself never touches localStorage.
const SESSION_MARKER = "ss_has_session";
const USER_STORAGE_KEY = "ss_user";

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(readStoredUser);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    const handleTokenRefreshed = (event) => {
      const newToken = event.detail;
      if (newToken) {
        storeToken(newToken);
        setToken(newToken);
      }
    };
    window.addEventListener("auth:token-refreshed", handleTokenRefreshed);
    return () => window.removeEventListener("auth:token-refreshed", handleTokenRefreshed);
  }, []);

  // On boot, silently restore the session using the HttpOnly refresh cookie.
  // The access token lives only in memory, so it does not survive a reload;
  // the refresh cookie does, and `/auth/refresh` gives us a fresh token.
  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      if (localStorage.getItem(SESSION_MARKER) !== "1") {
        setUser(null);
        return;
      }
      setIsRestoring(true);
      try {
        const newToken = await refreshSession();
        if (!cancelled && newToken) {
          storeToken(newToken);
          setToken(newToken);
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(SESSION_MARKER);
          localStorage.removeItem(USER_STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsRestoring(false);
        }
      }
    };
    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const isAuthenticated = !!token;

  const login = useCallback((newToken, newUser) => {
    storeToken(newToken);
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(SESSION_MARKER, "1");
  }, []);

  const logout = useCallback((isForced = false) => {
    if (!isForced) {
      localStorage.setItem("isLoggingOut", "true");
    }
    clearToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(SESSION_MARKER);
    setToken(null);
    setUser(null);
    revokeServerSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated, isRestoring, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
