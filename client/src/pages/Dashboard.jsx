import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, CheckCircle2, CircleAlert, Clock3, LogOut, Moon, Plus, Search, Sun, Target, Trash2, Pencil, Check, X } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import TaskModal from "../components/TaskModal";

const initialStats = { total: 0, completed: 0, active: 0, overdue: 0, highPriority: 0, categories: {} };

export default function Dashboard({ dark, setDark }) {
  const { user, logout } = useAuth();
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [filters, setFilters] = useState({ search: "", status: "all", priority: "all", category: "all" });
  const [modal, setModal] = useState({ open: false, task: null });
  const [error, setError] = useState("");
  const [sidebar, setSidebar] = useState(false);
  const [reminders, setReminders] = useState([]);
  const audioContextRef = useRef(null);
  const notifiedRef = useRef(new Set());

  const load = async () => {
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "all" && v !== ""));
      const [tasksRes, statsRes] = await Promise.all([
        api.get("/todos", { params }),
        api.get("/todos/stats/summary")
      ]);
      setTodos(tasksRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your workspace.");
    }
  };

  useEffect(() => { load(); }, [filters.search, filters.status, filters.priority, filters.category]);
  // Five-minute due-date reminder.
  // The browser may require one user interaction before audio can play.
  useEffect(() => {
    const playBeep = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = audioContextRef.current || new AudioCtx();
        audioContextRef.current = ctx;
        if (ctx.state === "suspended") ctx.resume();

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
      } catch {
        // Some browsers block audio until the user interacts with the page.
      }
    };

    const showNotification = (todo, minutes) => {
      const message = minutes <= 1
        ? `"${todo.title}" is due in less than a minute.`
        : `"${todo.title}" is due in about ${minutes} minutes.`;

      setReminders(current => [
        ...current.filter(r => r.id !== todo._id),
        { id: todo._id, title: todo.title, message }
      ].slice(-3));

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Todo Pro reminder", {
          body: message,
          tag: `todo-${todo._id}`
        });
      }
      playBeep();
    };

    const checkReminders = () => {
      const now = Date.now();
      todos.forEach(todo => {
        if (todo.completed || !todo.dueDate) return;

        const due = new Date(todo.dueDate).getTime();
        const remaining = due - now;
        const fiveMinutes = 5 * 60 * 1000;

        // Trigger once when the task enters the five-minute window.
        if (remaining > 0 && remaining <= fiveMinutes && !notifiedRef.current.has(todo._id)) {
          notifiedRef.current.add(todo._id);
          showNotification(todo, Math.max(1, Math.ceil(remaining / 60000)));
        }
      });
    };

    const timer = setInterval(checkReminders, 10000);
    checkReminders();

    return () => clearInterval(timer);
  }, [todos]);

  const enableNotifications = async () => {
    try {
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && !audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
      }
    } catch {}
  };


  const categories = useMemo(() => Object.keys(stats.categories || {}).sort(), [stats.categories]);

  const saveTask = async form => {
    try {
      if (modal.task) await api.put(`/todos/${modal.task._id}`, form);
      else await api.post("/todos", form);
      setModal({ open: false, task: null });
      load();
    } catch (err) { setError(err.response?.data?.message || "Could not save task."); }
  };

  const toggle = async todo => {
    try {
      await api.put(`/todos/${todo._id}`, { ...todo, completed: !todo.completed });
      load();
    } catch { setError("Could not update task."); }
  };

  const remove = async id => {
    if (!confirm("Delete this task?")) return;
    try { await api.delete(`/todos/${id}`); load(); }
    catch { setError("Could not delete task."); }
  };

  const overdue = t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date();

  return (
    <div className="dashboard">
      <aside className={sidebar ? "sidebar open" : "sidebar"}>
        <div className="brand"><div className="logo"><CheckCircle2 /></div><span>Todo Pro</span></div>
        <div className="profile"><div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div><div><strong>{user.name}</strong><small>{user.email}</small></div></div>
        <nav><button className="nav-active"><BarChart3 /> Overview</button><button><Target /> My Tasks</button><button><Clock3 /> Upcoming</button></nav>
        <div className="sidebar-bottom"><button onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}{dark ? "Light mode" : "Dark mode"}</button><button onClick={logout}><LogOut /> Sign out</button></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setSidebar(!sidebar)}>☰</button>
          <div><span className="eyebrow">WORKSPACE</span><h1>Good to see you, {user.name.split(" ")[0]} 👋</h1></div>
          <div className="top-actions">
            <button className="btn ghost" onClick={enableNotifications}>🔔 Enable reminders</button>
            <button className="btn primary" onClick={() => setModal({ open: true, task: null })}><Plus size={18} /> New task</button>
          </div>
        </header>

        {error && <div className="error">{error}<button onClick={() => setError("")}><X size={15}/></button></div>}

        {reminders.length > 0 && (
          <div className="reminder-stack">
            {reminders.map(reminder => (
              <div className="reminder" key={reminder.id}>
                <div className="reminder-icon">🔔</div>
                <div><strong>Task reminder</strong><span>{reminder.message}</span></div>
                <button onClick={() => setReminders(current => current.filter(r => r.id !== reminder.id))}><X size={16}/></button>
              </div>
            ))}
          </div>
        )}

        <section className="stat-grid">
          <Stat icon={<BarChart3 />} label="Total tasks" value={stats.total} note="All tasks" />
          <Stat icon={<CheckCircle2 />} label="Completed" value={stats.completed} note={`${stats.total ? Math.round(stats.completed / stats.total * 100) : 0}% completion`} />
          <Stat icon={<Clock3 />} label="In progress" value={stats.active} note="Needs attention" />
          <Stat icon={<CircleAlert />} label="Overdue" value={stats.overdue} note={`${stats.highPriority} high priority`} danger />
        </section>

        <section className="content-card">
          <div className="section-head"><div><h2>My tasks</h2><p className="muted">Manage your priorities and stay on schedule.</p></div><span className="task-count">{todos.length} shown</span></div>

          <div className="toolbar">
            <div className="search"><Search size={18} /><input value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} placeholder="Search tasks..." /></div>
            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}><option value="all">All status</option><option value="active">Active</option><option value="completed">Completed</option></select>
            <select value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}><option value="all">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
            <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}><option value="all">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select>
          </div>

          <div className="task-list">
            {todos.length === 0 ? <div className="empty"><Target size={34}/><h3>No tasks found</h3><p>Try another filter or create your first task.</p><button className="btn primary" onClick={() => setModal({open:true, task:null})}><Plus size={17}/> Create task</button></div> :
              todos.map(todo => (
                <article className={`task ${todo.completed ? "task-done" : ""}`} key={todo._id}>
                  <button className="check" onClick={() => toggle(todo)}>{todo.completed ? <Check size={16}/> : null}</button>
                  <div className="task-main"><div className="task-title-row"><h3>{todo.title}</h3><span className={`priority ${todo.priority}`}>{todo.priority}</span></div><p>{todo.description || "No description added."}</p><div className="meta"><span>{todo.category}</span>{todo.dueDate && <span className={overdue(todo) ? "overdue" : ""}>{overdue(todo) ? "Overdue · " : "Due · "}{new Date(todo.dueDate).toLocaleDateString()}</span>}</div></div>
                  <div className="task-actions"><button onClick={() => setModal({open:true, task:todo})} title="Edit"><Pencil size={17}/></button><button className="danger-btn" onClick={() => remove(todo._id)} title="Delete"><Trash2 size={17}/></button></div>
                </article>
              ))}
          </div>
        </section>
      </main>
      <TaskModal open={modal.open} task={modal.task} onClose={() => setModal({open:false, task:null})} onSave={saveTask}/>
    </div>
  );
}

function Stat({ icon, label, value, note, danger }) {
  return <div className={`stat ${danger ? "stat-danger" : ""}`}><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>;
}
