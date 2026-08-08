import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem("todo_theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("todo_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" dark={dark} setDark={setDark} />} />
      <Route path="/register" element={<AuthPage mode="register" dark={dark} setDark={setDark} />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard dark={dark} setDark={setDark} /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
