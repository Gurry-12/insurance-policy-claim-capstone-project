import { createContext, useState, useCallback } from "react";


// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("ss_token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ss_user"));
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!token;

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem("ss_token", newToken);
    localStorage.setItem("ss_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback((isForced = false) => {
    if (!isForced) {
      localStorage.setItem("isLoggingOut", "true");
    }
    localStorage.removeItem("ss_token");
    localStorage.removeItem("ss_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
