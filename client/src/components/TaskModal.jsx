import { useEffect, useState } from "react";
import { X } from "lucide-react";

const empty = { title: "", description: "", priority: "medium", category: "General", dueDate: "", completed: false };

export default function TaskModal({ open, onClose, onSave, task }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        category: task.category || "General",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
        completed: task.completed || false
      });
    } else setForm(empty);
  }, [task, open]);

  if (!open) return null;

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">TASK MANAGEMENT</span>
            <h2>{task ? "Edit task" : "Create a task"}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={19} /></button>
        </div>

        <label>Title<input value={form.title} onChange={e => update("title", e.target.value)} placeholder="e.g. Build portfolio section" autoFocus /></label>
        <label>Description<textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Add useful details..." rows="3" /></label>

        <div className="form-grid">
          <label>Priority
            <select value={form.priority} onChange={e => update("priority", e.target.value)}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </label>
          <label>Category<input value={form.category} onChange={e => update("category", e.target.value)} placeholder="Development" /></label>
          <label>Due date<input type="date" value={form.dueDate} onChange={e => update("dueDate", e.target.value)} /></label>
          {task && <label className="checkbox-row"><input type="checkbox" checked={form.completed} onChange={e => update("completed", e.target.checked)} /> Completed</label>}
        </div>

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => onSave(form)}>{task ? "Save changes" : "Create task"}</button>
        </div>
      </div>
    </div>
  );
}
