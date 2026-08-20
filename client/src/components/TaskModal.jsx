import { useEffect, useState } from "react";
import { X, Plus, Trash2, CheckSquare, Tag, Pin, Clock, Calendar, AlertTriangle } from "lucide-react";

const emptyTask = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  category: "Work",
  tags: [],
  subtasks: [],
  pinned: false,
  estimatedMinutes: 30,
  dueDate: "",
  completed: false
};

const defaultCategories = ["Work", "Personal", "Development", "Study", "Finance", "Health"];
const popularTags = ["urgent", "bug", "feature", "meeting", "review", "design", "shopping"];

export default function TaskModal({ open, onClose, onSave, task }) {
  const [form, setForm] = useState(emptyTask);
  const [newSubtask, setNewSubtask] = useState("");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        status: task.status || (task.completed ? "completed" : "todo"),
        category: task.category || "General",
        tags: Array.isArray(task.tags) ? [...task.tags] : [],
        subtasks: Array.isArray(task.subtasks) ? [...task.subtasks] : [],
        pinned: Boolean(task.pinned),
        estimatedMinutes: task.estimatedMinutes || 0,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
        completed: Boolean(task.completed)
      });
    } else {
      setForm(emptyTask);
    }
    setNewSubtask("");
    setTagInput("");
  }, [task, open]);

  if (!open) return null;

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const addSubtask = e => {
    e?.preventDefault();
    if (!newSubtask.trim()) return;
    setForm(current => ({
      ...current,
      subtasks: [...current.subtasks, { title: newSubtask.trim(), completed: false }]
    }));
    setNewSubtask("");
  };

  const toggleSubtask = index => {
    setForm(current => {
      const copy = [...current.subtasks];
      copy[index] = { ...copy[index], completed: !copy[index].completed };
      return { ...current, subtasks: copy };
    });
  };

  const removeSubtask = index => {
    setForm(current => ({
      ...current,
      subtasks: current.subtasks.filter((_, i) => i !== index)
    }));
  };

  const addTag = (tagName) => {
    const clean = tagName.trim().replace(/^#/, "").toLowerCase();
    if (clean && !form.tags.includes(clean)) {
      setForm(current => ({ ...current, tags: [...current.tags, clean] }));
    }
    setTagInput("");
  };

  const handleTagKeyDown = e => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const removeTag = tagToRemove => {
    setForm(current => ({
      ...current,
      tags: current.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  const completedSubtasksCount = form.subtasks.filter(s => s.completed).length;
  const subtasksPercent = form.subtasks.length > 0 ? Math.round((completedSubtasksCount / form.subtasks.length) * 100) : 0;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal modal-lg" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">TASK MANAGEMENT</span>
            <h2>{task ? "Edit Task Details" : "Create New Task"}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close (Esc)">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label>
              Task Title *
              <input
                required
                value={form.title}
                onChange={e => update("title", e.target.value)}
                placeholder="e.g. Implement user authentication flow"
                autoFocus
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              Description & Notes
              <textarea
                value={form.description}
                onChange={e => update("description", e.target.value)}
                placeholder="Add acceptance criteria, links, or helpful details..."
                rows={3}
              />
            </label>
          </div>

          {/* Subtasks Section */}
          <div className="form-section">
            <div className="subtasks-header">
              <label className="section-label">
                <CheckSquare size={16} /> Subtasks Checklist
                {form.subtasks.length > 0 && (
                  <span className="subtasks-badge">{completedSubtasksCount}/{form.subtasks.length} ({subtasksPercent}%)</span>
                )}
              </label>
            </div>

            {form.subtasks.length > 0 && (
              <div className="subtask-progress-bar">
                <div className="subtask-progress-fill" style={{ width: `${subtasksPercent}%` }} />
              </div>
            )}

            <div className="subtasks-list">
              {form.subtasks.map((st, idx) => (
                <div key={idx} className="subtask-item">
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => toggleSubtask(idx)}
                    id={`st-${idx}`}
                  />
                  <span className={st.completed ? "subtask-title completed" : "subtask-title"}>
                    {st.title}
                  </span>
                  <button
                    type="button"
                    className="subtask-remove"
                    onClick={() => removeSubtask(idx)}
                    title="Remove subtask"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="subtask-input-row">
              <input
                type="text"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSubtask())}
                placeholder="Add a step (press Enter)..."
              />
              <button type="button" className="btn ghost" onClick={addSubtask}>
                <Plus size={16} /> Add Step
              </button>
            </div>
          </div>

          {/* Tags Section */}
          <div className="form-section">
            <label className="section-label"><Tag size={16} /> Tags</label>
            <div className="tags-container">
              {form.tags.map(t => (
                <span key={t} className="tag-pill">
                  #{t}
                  <button type="button" onClick={() => removeTag(t)}><X size={12} /></button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type tag & press Enter..."
                className="tag-input"
              />
            </div>
            <div className="tag-suggestions">
              <span className="suggestion-label">Suggestions:</span>
              {popularTags.filter(pt => !form.tags.includes(pt)).slice(0, 5).map(pt => (
                <button
                  key={pt}
                  type="button"
                  className="tag-suggestion-btn"
                  onClick={() => addTag(pt)}
                >
                  +{pt}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Attributes */}
          <div className="form-grid-3">
            <label>
              Priority
              <select
                value={form.priority}
                onChange={e => update("priority", e.target.value)}
                className={`priority-select ${form.priority}`}
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </label>

            <label>
              Category
              <input
                list="category-options"
                value={form.category}
                onChange={e => update("category", e.target.value)}
                placeholder="Category name"
              />
              <datalist id="category-options">
                {defaultCategories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={e => update("status", e.target.value)}
              >
                <option value="todo">📋 To Do</option>
                <option value="in-progress">⚡ In Progress</option>
                <option value="completed">✅ Completed</option>
              </select>
            </label>

            <label>
              <Calendar size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
              Due Date
              <input
                type="date"
                value={form.dueDate}
                onChange={e => update("dueDate", e.target.value)}
              />
            </label>

            <label>
              <Clock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
              Est. Time (min)
              <input
                type="number"
                min="0"
                step="5"
                value={form.estimatedMinutes}
                onChange={e => update("estimatedMinutes", e.target.value)}
                placeholder="30"
              />
            </label>

            <div className="checkbox-field">
              <label className="checkbox-toggle">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={e => update("pinned", e.target.checked)}
                />
                <span><Pin size={15} /> Pin to top</span>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary">
              {task ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
