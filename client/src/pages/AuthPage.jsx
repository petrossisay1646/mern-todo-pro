import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { CheckSquare, Eye, EyeOff, Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage({ mode = "login", dark, setDark }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isRegister = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || "/dashboard"} replace />;

  const submit = async e => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isRegister) await register(form);
      else await login({ email: form.email, password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <main className="auth-page">
      <div className="auth-brand"><div className="logo"><CheckSquare /></div><strong>Todo Pro</strong></div>
      <button className="theme-float" onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button>
      <section className="auth-card">
        <span className="eyebrow">PRODUCTIVITY WORKSPACE</span>
        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="muted">{isRegister ? "Build a better workflow, one task at a time." : "Sign in to continue to your workspace."}</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={submit}>
          {isRegister && <label>Full name<input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Petros Sisay" /></label>}
          <label>Email<input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" /></label>
          <label>Password<div className="password-wrap"><input required minLength="6" type={show ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="At least 6 characters" /><button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button></div></label>
          <button className="btn primary full" disabled={busy}>{busy ? "Please wait..." : isRegister ? "Create account" : "Sign in"}</button>
        </form>
        <p className="switch">{isRegister ? "Already have an account?" : "Don't have an account?"} <button onClick={() => navigate(isRegister ? "/login" : "/register")}>{isRegister ? "Sign in" : "Create one"}</button></p>
      </section>
    </main>
  );
}
