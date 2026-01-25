import React from "react";
import api from "../services/axios";

export const AuthContext = React.createContext(null);

export function useAuth() {
  return React.useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // initialize state from localStorage
  const [token, setToken] = React.useState(() => localStorage.getItem("kf_token"));
  const [user, setUser] = React.useState(() => {
    const raw = localStorage.getItem("kf_user");
    return raw ? JSON.parse(raw) : null;
  });

  // always set axios header when token changes
  React.useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const login = ({ token: t, user: userData }) => {
    setToken(t);
    setUser(userData);
    localStorage.setItem("kf_token", t);
    localStorage.setItem("kf_user", JSON.stringify(userData));
    api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("kf_token");
    localStorage.removeItem("kf_user");
    delete api.defaults.headers.common["Authorization"];
  };

  // sync auth across tabs
  React.useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "kf_token") setToken(e.newValue);
      if (e.key === "kf_user") setUser(e.newValue ? JSON.parse(e.newValue) : null);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
