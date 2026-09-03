import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("lsf_user");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem("lsf_user");
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("lsf_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("lsf_user");
    }
  }, [user]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email: email.trim(),
      password: password,
    });

    localStorage.setItem("lsf_token", data.token);

    const userData = {
      id: data.userId,
      fullName: data.fullName,
      role: data.role,
    };

    setUser(userData);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", {
      ...payload,
      email: payload.email ? payload.email.trim() : "",
    });

    localStorage.setItem("lsf_token", data.token);

    const userData = {
      id: data.userId,
      fullName: data.fullName,
      role: data.role,
    };

    setUser(userData);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("lsf_token");
    localStorage.removeItem("lsf_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);