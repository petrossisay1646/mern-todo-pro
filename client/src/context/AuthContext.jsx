import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("todo_token");
    if (!token) return setLoading(false);

    api.get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem("todo_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async credentials => {
    const { data } = await api.post("/auth/login", credentials);
    localStorage.setItem("todo_token", data.token);
    setUser(data.user);
  };

  const register = async payload => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("todo_token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("todo_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
