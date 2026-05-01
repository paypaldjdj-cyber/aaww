import React, { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin } from "./api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("clinic_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username) {
          setUser(parsed);
        }
      } catch (e) {
        localStorage.removeItem("clinic_user");
      }
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

// Ensure this hook is used properly in components
export function useAuth() { 
    return useContext(AuthContext); 
}
