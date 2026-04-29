import React, { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin } from "./api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("clinic_user");
      if (saved && saved !== "undefined") {
        setUser(JSON.parse(saved));
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const userData = await apiLogin({ username, password });
    setUser(userData);
    localStorage.setItem("clinic_user", JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("clinic_user");
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, role: user?.role, clinic_id: user?.clinic_id }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
