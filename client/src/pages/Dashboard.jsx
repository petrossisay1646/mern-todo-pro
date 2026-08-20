import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  Target,
  Trash2,
  Pencil,
  Check,
  X,
  Kanban,
  Flame,
  Settings,
  Command,
  Pin,
  Calendar,
  Tag,
  ChevronDown,
  Sparkles,
  CheckSquare
} from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import TaskModal from "../components/TaskModal";
import PomodoroTimer from "../components/PomodoroTimer";
import KanbanBoard from "../components/KanbanBoard";
import AnalyticsView from "../components/AnalyticsView";
import BulkToolbar from "../components/BulkToolbar";
import SettingsModal from "../components/SettingsModal";
import ShortcutsModal from "../components/ShortcutsModal";
import Toast from "../components/Toast";

const initialStats = {
  total: 0,
  completed: 0,
  active: 0,
  inProgress: 0,
  overdue: 0,
  highPriority: 0,
  urgentPriority: 0,
  categories: {},
  tags: {},
  last7Days: [],
  streak: 0,
  totalEstimated: 0,
  totalActual: 0
};

export default function Dashboard({ dark, setDark }) {
  const { user, logout, updateProfile } = useAuth();
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [currentView, setCurrentView] = useState("list"); // 'list' | 'kanban' | 'focus' | 'analytics'
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
    category: "all",
    tag: "all",
    dueFilter: "all",
    sortBy: "smart"
  });

  const [modal, setModal] = useState({ open: false, task: null, defaultValues: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [sidebar, setSidebar] = useState(false);

  const audioContextRef = useRef(null);
  const notifiedRef = useRef(new Set());
  const searchInputRef = useRef(null);

  const addToast = (message, type = "success", title = "") => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const playSuccessSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {}
  };

  const loadData = useCallback(async () => {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "all" && v !== "")
      );
      const [tasksRes, statsRes] = await Promise.all([
        api.get("/todos", { params: cleanParams }),
        api.get("/todos/stats/summary")
      ]);
      setTodos(tasksRes.data);
      setStats(statsRes.data);
    } catch (err) {
      addToast(err.response?.data?.message || "Could not load workspace.", "error");
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Due-date reminders checker
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
      } catch {}
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
        new Notification("Todo Pro Reminder", {
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

        if (remaining > 0 && remaining <= fiveMinutes && !notifiedRef.current.has(todo._id)) {
          notifiedRef.current.add(todo._id);
          showNotification(todo, Math.max(1, Math.ceil(remaining / 60000)));
        }
      });
    };

    const timer = setInterval(checkReminders, 12000);
    checkReminders();
    return () => clearInterval(timer);
  }, [todos]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = e => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);
      if (e.key === "Escape") {
        setModal({ open: false, task: null, defaultValues: null });
        setSettingsOpen(false);
        setShortcutsOpen(false);
        setSelectedIds([]);
        return;
      }
      if (isInput) return;

      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setModal({ open: true, task: null, defaultValues: null });
      } else if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "1") {
        setCurrentView("list");
      } else if (e.key === "2") {
        setCurrentView("kanban");
      } else if (e.key === "3") {
        setCurrentView("focus");
      } else if (e.key === "4") {
        setCurrentView("analytics");
      } else if (e.key.toLowerCase() === "d") {
        setDark(prev => !prev);
      } else if (e.key === "?") {
        setShortcutsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setDark]);

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
      addToast("Reminders and audio sound enabled!", "success");
    } catch {
      addToast("Could not enable notifications", "error");
    }
  };

  // CRUD Actions
  const saveTask = async form => {
    try {
      if (modal.task) {
        await api.put(`/todos/${modal.task._id}`, form);
        addToast("Task updated successfully!");
      } else {
        await api.post("/todos", form);
        addToast("Task created successfully!");
        playSuccessSound();
      }
      setModal({ open: false, task: null, defaultValues: null });
      loadData();
    } catch (err) {
      addToast(err.response?.data?.message || "Could not save task.", "error");
    }
  };

  const toggleTask = async todo => {
    try {
      await api.patch(`/todos/${todo._id}/toggle`);
      if (!todo.completed) {
        playSuccessSound();
        addToast(`Completed: "${todo.title}"`);
      }
      loadData();
    } catch {
      addToast("Could not update task status.", "error");
    }
  };

  const updateTaskStatus = async (id, status) => {
    try {
      await api.put(`/todos/${id}`, { status });
      loadData();
    } catch {
      addToast("Could not update task stage.", "error");
    }
  };

  const removeTask = async id => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/todos/${id}`);
      addToast("Task deleted.");
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      loadData();
    } catch {
      addToast("Could not delete task.", "error");
    }
  };

  const toggleSubtask = async (todo, subtaskIdx) => {
    try {
      const updatedSubtasks = [...todo.subtasks];
      updatedSubtasks[subtaskIdx].completed = !updatedSubtasks[subtaskIdx].completed;
      await api.patch(`/todos/${todo._id}/subtasks`, { subtasks: updatedSubtasks });
      loadData();
    } catch {
      addToast("Could not update subtask", "error");
    }
  };

  // Bulk Operations
  const toggleSelectTask = id => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === todos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(todos.map(t => t._id));
    }
  };

  const handleBulkComplete = async completed => {
    try {
      await api.post("/todos/bulk-update", {
        ids: selectedIds,
        updates: { completed, status: completed ? "completed" : "todo" }
      });
      addToast(`Updated ${selectedIds.length} tasks.`);
      setSelectedIds([]);
      loadData();
    } catch {
      addToast("Bulk update failed.", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected tasks?`)) return;
    try {
      await api.post("/todos/bulk-delete", { ids: selectedIds });
      addToast(`Deleted ${selectedIds.length} tasks.`);
      setSelectedIds([]);
      loadData();
    } catch {
      addToast("Bulk delete failed.", "error");
    }
  };

  const handleBulkPriority = async priority => {
    try {
      await api.post("/todos/bulk-update", {
        ids: selectedIds,
        updates: { priority }
      });
      addToast(`Updated priority to ${priority} for ${selectedIds.length} tasks.`);
      setSelectedIds([]);
      loadData();
    } catch {
      addToast("Bulk priority update failed.", "error");
    }
  };

  const categories = useMemo(
    () => Object.keys(stats.categories || {}).sort(),
    [stats.categories]
  );
  const tagsList = useMemo(
    () => Object.keys(stats.tags || {}).sort(),
    [stats.tags]
  );

  const isOverdue = t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date();

  return (
    <div className="dashboard">
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Sidebar */}
      <aside className={sidebar ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="logo"><CheckCircle2 /></div>
          <span>Todo Pro</span>
        </div>

        <div className="profile" onClick={() => setSettingsOpen(true)} title="Click to edit profile">
          <div className="avatar" style={{ backgroundColor: user?.avatarColor || "#635bff" }}>
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="profile-text">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
        </div>

        <nav>
          <button
            className={currentView === "list" ? "nav-active" : ""}
            onClick={() => { setCurrentView("list"); setSidebar(false); }}
          >
            <CheckSquare size={18} /> My Tasks
          </button>
          <button
            className={currentView === "kanban" ? "nav-active" : ""}
            onClick={() => { setCurrentView("kanban"); setSidebar(false); }}
          >
            <Kanban size={18} /> Kanban Board
          </button>
          <button
            className={currentView === "focus" ? "nav-active" : ""}
            onClick={() => { setCurrentView("focus"); setSidebar(false); }}
          >
            <Target size={18} /> Focus Timer
          </button>
          <button
            className={currentView === "analytics" ? "nav-active" : ""}
            onClick={() => { setCurrentView("analytics"); setSidebar(false); }}
          >
            <BarChart3 size={18} /> Analytics & Streaks
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button onClick={() => setShortcutsOpen(true)}>
            <Command size={18} /> Shortcuts <kbd className="shortcut-kbd-inline">?</kbd>
          </button>
          <button onClick={() => setSettingsOpen(true)}>
            <Settings size={18} /> Settings & Profile
          </button>
          <button onClick={() => setDark(!dark)}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={logout} className="signout-btn">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setSidebar(!sidebar)}>☰</button>
            <div>
              <span className="eyebrow">PRODUCTIVITY WORKSPACE</span>
              <h1>
                Welcome back, {user.name.split(" ")[0]}
                {stats.streak > 0 && <span className="streak-chip">🔥 {stats.streak}d streak</span>}
              </h1>
            </div>
          </div>

          <div className="top-actions">
            <button className="btn ghost" onClick={enableNotifications} title="Enable audio reminders">
              🔔 Reminders
            </button>
            <button
              className="btn primary"
              onClick={() => setModal({ open: true, task: null, defaultValues: null })}
            >
              <Plus size={18} /> New Task <kbd className="shortcut-kbd-inline">N</kbd>
            </button>
          </div>
        </header>

        {/* Reminders banner */}
        {reminders.length > 0 && (
          <div className="reminder-stack">
            {reminders.map(reminder => (
              <div className="reminder" key={reminder.id}>
                <div className="reminder-icon">🔔</div>
                <div>
                  <strong>Upcoming Deadline</strong>
                  <span>{reminder.message}</span>
                </div>
                <button onClick={() => setReminders(current => current.filter(r => r.id !== reminder.id))}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Stat Cards Grid (Always visible for quick pulse) */}
        <section className="stat-grid">
          <Stat
            icon={<BarChart3 />}
            label="Total Tasks"
            value={stats.total}
            note="All registered tasks"
            onClick={() => { setFilters({ ...filters, status: "all", dueFilter: "all" }); setCurrentView("list"); }}
          />
          <Stat
            icon={<CheckCircle2 />}
            label="Completed"
            value={stats.completed}
            note={`${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% completion`}
            onClick={() => { setFilters({ ...filters, status: "completed", dueFilter: "all" }); setCurrentView("list"); }}
          />
          <Stat
            icon={<Clock3 />}
            label="In Progress / Active"
            value={stats.active}
            note={`${stats.inProgress || 0} in active sprint`}
            onClick={() => { setFilters({ ...filters, status: "active", dueFilter: "all" }); setCurrentView("list"); }}
          />
          <Stat
            icon={<CircleAlert />}
            label="Overdue / Urgent"
            value={stats.overdue}
            note={`${stats.urgentPriority || 0} urgent tasks`}
            danger={stats.overdue > 0}
            onClick={() => { setFilters({ ...filters, dueFilter: "overdue" }); setCurrentView("list"); }}
          />
        </section>

        {/* Navigation View Switcher Tabs */}
        <div className="view-switcher-bar">
          <button
            className={`view-btn ${currentView === "list" ? "active" : ""}`}
            onClick={() => setCurrentView("list")}
          >
            <CheckSquare size={16} /> List View
          </button>
          <button
            className={`view-btn ${currentView === "kanban" ? "active" : ""}`}
            onClick={() => setCurrentView("kanban")}
          >
            <Kanban size={16} /> Kanban Board
          </button>
          <button
            className={`view-btn ${currentView === "focus" ? "active" : ""}`}
            onClick={() => setCurrentView("focus")}
          >
            <Target size={16} /> Focus Mode (Pomodoro)
          </button>
          <button
            className={`view-btn ${currentView === "analytics" ? "active" : ""}`}
            onClick={() => setCurrentView("analytics")}
          >
            <BarChart3 size={16} /> Analytics & Insights
          </button>
        </div>

        {/* View 1: List View */}
        {currentView === "list" && (
          <section className="content-card">
            <div className="section-head">
              <div>
                <h2>Task Catalog</h2>
                <p className="muted">Organize, filter, checklist, and prioritize your workload.</p>
              </div>
              <div className="section-head-actions">
                <span className="task-count">{todos.length} shown</span>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="toolbar-extended">
              <div className="search">
                <Search size={18} />
                <input
                  ref={searchInputRef}
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search tasks, descriptions, or tags... (Press /)"
                />
                {filters.search && (
                  <button className="clear-search-btn" onClick={() => setFilters({ ...filters, search: "" })}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">Status: All</option>
                <option value="active">Active (Pending)</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={filters.priority}
                onChange={e => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="all">Priority: All</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>

              <select
                value={filters.dueFilter}
                onChange={e => setFilters({ ...filters, dueFilter: e.target.value })}
              >
                <option value="all">Due Date: All</option>
                <option value="today">📅 Due Today</option>
                <option value="week">📅 Next 7 Days</option>
                <option value="overdue">⚠️ Overdue</option>
              </select>

              <select
                value={filters.category}
                onChange={e => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="all">Category: All</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filters.sortBy}
                onChange={e => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <option value="smart">Sort: Smart (Pinned First)</option>
                <option value="dueDate">Sort: Due Date</option>
                <option value="priority">Sort: Priority</option>
                <option value="title">Sort: Alphabetical</option>
                <option value="createdAt">Sort: Newest</option>
              </select>
            </div>

            {/* Tag Filter Chips */}
            {tagsList.length > 0 && (
              <div className="tag-filter-chips">
                <span className="tag-chips-label"><Tag size={13} /> Tags:</span>
                <button
                  className={`tag-chip ${filters.tag === "all" ? "active" : ""}`}
                  onClick={() => setFilters({ ...filters, tag: "all" })}
                >
                  All
                </button>
                {tagsList.map(tag => (
                  <button
                    key={tag}
                    className={`tag-chip ${filters.tag === tag ? "active" : ""}`}
                    onClick={() => setFilters({ ...filters, tag: filters.tag === tag ? "all" : tag })}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Bulk Selection Header */}
            {todos.length > 0 && (
              <div className="list-select-header">
                <label className="select-all-label">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === todos.length && todos.length > 0}
                    onChange={toggleSelectAll}
                  />
                  <span>Select All ({todos.length})</span>
                </label>
              </div>
            )}

            {/* Task List */}
            <div className="task-list">
              {todos.length === 0 ? (
                <div className="empty">
                  <Target size={36} />
                  <h3>No tasks found</h3>
                  <p>Try adjusting your search/filter or create your next task.</p>
                  <button
                    className="btn primary"
                    onClick={() => setModal({ open: true, task: null, defaultValues: null })}
                  >
                    <Plus size={17} /> Create Task
                  </button>
                </div>
              ) : (
                todos.map(todo => {
                  const subtasksTotal = (todo.subtasks || []).length;
                  const subtasksDone = (todo.subtasks || []).filter(s => s.completed).length;
                  const isSelected = selectedIds.includes(todo._id);

                  return (
                    <article
                      key={todo._id}
                      className={`task ${todo.completed ? "task-done" : ""} ${todo.pinned ? "task-pinned" : ""} ${isSelected ? "task-selected" : ""}`}
                    >
                      {/* Checkbox for Bulk Select */}
                      <input
                        type="checkbox"
                        className="bulk-item-checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTask(todo._id)}
                      />

                      {/* Complete Check Button */}
                      <button
                        className="check"
                        onClick={() => toggleTask(todo)}
                        title={todo.completed ? "Mark as active" : "Mark as completed"}
                      >
                        {todo.completed ? <Check size={16} /> : null}
                      </button>

                      {/* Main Task Content */}
                      <div className="task-main">
                        <div className="task-title-row">
                          {todo.pinned && <Pin size={14} className="pin-icon" title="Pinned to top" />}
                          <h3 onClick={() => setModal({ open: true, task: todo, defaultValues: null })}>
                            {todo.title}
                          </h3>
                          <span className={`priority ${todo.priority}`}>{todo.priority}</span>
                          <span className="category-pill">{todo.category}</span>
                        </div>

                        {todo.description && (
                          <p className="task-desc">{todo.description}</p>
                        )}

                        {/* Interactive Subtasks in List */}
                        {subtasksTotal > 0 && (
                          <div className="task-subtasks-preview">
                            <div className="subtasks-summary-bar">
                              <span><CheckSquare size={13} /> {subtasksDone} of {subtasksTotal} subtasks</span>
                              <div className="mini-progress-bar">
                                <div
                                  className="mini-progress-fill"
                                  style={{ width: `${Math.round((subtasksDone / subtasksTotal) * 100)}%` }}
                                />
                              </div>
                            </div>
                            <div className="subtasks-inline-list">
                              {todo.subtasks.map((st, sIdx) => (
                                <label key={sIdx} className="subtask-inline-item">
                                  <input
                                    type="checkbox"
                                    checked={st.completed}
                                    onChange={() => toggleSubtask(todo, sIdx)}
                                  />
                                  <span className={st.completed ? "subtask-title completed" : "subtask-title"}>
                                    {st.title}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Meta: Tags, Due Date, Est time */}
                        <div className="meta">
                          {todo.dueDate && (
                            <span className={isOverdue(todo) ? "overdue" : ""}>
                              <Calendar size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                              {isOverdue(todo) ? "Overdue · " : "Due · "}
                              {new Date(todo.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                          {todo.estimatedMinutes > 0 && (
                            <span><Clock3 size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} /> {todo.estimatedMinutes} min</span>
                          )}
                          {todo.tags && todo.tags.length > 0 && (
                            <div className="task-tags-row">
                              {todo.tags.map(t => (
                                <span
                                  key={t}
                                  className="tag-pill-sm"
                                  onClick={() => setFilters({ ...filters, tag: t })}
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="task-actions">
                        <button
                          onClick={() => setModal({ open: true, task: todo, defaultValues: null })}
                          title="Edit Task"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="danger-btn"
                          onClick={() => removeTask(todo._id)}
                          title="Delete Task"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* View 2: Kanban Board */}
        {currentView === "kanban" && (
          <KanbanBoard
            todos={todos}
            onEditTask={task => setModal({ open: true, task, defaultValues: null })}
            onDeleteTask={removeTask}
            onToggleTask={toggleTask}
            onUpdateStatus={updateTaskStatus}
            onAddNew={({ status }) => setModal({ open: true, task: null, defaultValues: { status } })}
          />
        )}

        {/* View 3: Focus Timer (Pomodoro) */}
        {currentView === "focus" && (
          <PomodoroTimer
            tasks={todos}
            onToggleTask={toggleTask}
            defaultWorkMinutes={user?.pomodoroLength || 25}
          />
        )}

        {/* View 4: Analytics & Insights */}
        {currentView === "analytics" && (
          <AnalyticsView
            stats={stats}
            user={user}
            todos={todos}
          />
        )}

        {/* Floating Bulk Toolbar */}
        <BulkToolbar
          selectedCount={selectedIds.length}
          onClear={() => setSelectedIds([])}
          onBulkComplete={handleBulkComplete}
          onBulkDelete={handleBulkDelete}
          onBulkPriority={handleBulkPriority}
        />
      </main>

      {/* Modals */}
      <TaskModal
        open={modal.open}
        task={modal.task}
        onClose={() => setModal({ open: false, task: null, defaultValues: null })}
        onSave={saveTask}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        onUpdateUser={updateProfile}
        onDataChanged={loadData}
      />

      <ShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}

function Stat({ icon, label, value, note, danger, onClick }) {
  return (
    <div
      className={`stat ${danger ? "stat-danger" : ""} ${onClick ? "stat-clickable" : ""}`}
      onClick={onClick}
    >
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}
