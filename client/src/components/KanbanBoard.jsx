import { useState } from "react";
import { Plus, Pin, Clock, Calendar, CheckSquare, Pencil, Trash2, ArrowRight, ArrowLeft } from "lucide-react";

export default function KanbanBoard({ todos, onEditTask, onDeleteTask, onToggleTask, onUpdateStatus, onAddNew }) {
  const [draggedId, setDraggedId] = useState(null);

  const columns = [
    { id: "todo", label: "To Do", color: "#635bff", badge: "badge-todo" },
    { id: "in-progress", label: "In Progress", color: "#f59e0b", badge: "badge-in-progress" },
    { id: "completed", label: "Completed", color: "#10b981", badge: "badge-completed" }
  ];

  const getColumnTasks = status => {
    return todos.filter(t => {
      if (status === "completed") return t.completed || t.status === "completed";
      if (status === "in-progress") return !t.completed && t.status === "in-progress";
      return !t.completed && (t.status === "todo" || !t.status);
    });
  };

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = e => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (id) {
      onUpdateStatus(id, targetStatus);
    }
    setDraggedId(null);
  };

  return (
    <div className="kanban-board">
      {columns.map(col => {
        const tasksInCol = getColumnTasks(col.id);
        return (
          <div
            key={col.id}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, col.id)}
          >
            <div className="kanban-column-header">
              <div className="column-title-wrap">
                <span className="column-indicator" style={{ backgroundColor: col.color }} />
                <h3>{col.label}</h3>
                <span className="column-count">{tasksInCol.length}</span>
              </div>
              <button
                className="kanban-add-btn"
                onClick={() => onAddNew({ status: col.id })}
                title={`Add task to ${col.label}`}
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="kanban-cards-list">
              {tasksInCol.length === 0 ? (
                <div className="kanban-empty">
                  <span>No tasks</span>
                </div>
              ) : (
                tasksInCol.map(task => {
                  const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;
                  const totalSubtasks = (task.subtasks || []).length;
                  const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date();

                  return (
                    <article
                      key={task._id}
                      className={`kanban-card ${task.pinned ? "card-pinned" : ""} ${task.completed ? "card-done" : ""}`}
                      draggable
                      onDragStart={e => handleDragStart(e, task._id)}
                    >
                      <div className="card-top">
                        <div className="card-badges">
                          <span className={`priority-tag ${task.priority}`}>
                            {task.priority}
                          </span>
                          <span className="category-tag">{task.category}</span>
                        </div>
                        {task.pinned && <Pin size={14} className="pin-icon" />}
                      </div>

                      <h4 className="card-title" onClick={() => onEditTask(task)}>
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="card-desc">{task.description}</p>
                      )}

                      {/* Subtasks summary */}
                      {totalSubtasks > 0 && (
                        <div className="card-subtasks-summary">
                          <div className="subtasks-icon-row">
                            <CheckSquare size={13} />
                            <span>{completedSubtasks}/{totalSubtasks} steps</span>
                          </div>
                          <div className="mini-progress-bar">
                            <div
                              className="mini-progress-fill"
                              style={{ width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="card-tags">
                          {task.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="tag-pill-mini">#{tag}</span>
                          ))}
                          {task.tags.length > 3 && <span className="tag-more">+{task.tags.length - 3}</span>}
                        </div>
                      )}

                      <div className="card-footer">
                        <div className="card-meta">
                          {task.dueDate && (
                            <span className={isOverdue ? "due-date overdue" : "due-date"}>
                              <Calendar size={12} />
                              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                          {task.estimatedMinutes > 0 && (
                            <span className="est-time">
                              <Clock size={12} /> {task.estimatedMinutes}m
                            </span>
                          )}
                        </div>

                        <div className="card-actions">
                          {col.id !== "todo" && (
                            <button
                              className="stage-shift-btn"
                              title="Move left"
                              onClick={() => onUpdateStatus(task._id, col.id === "completed" ? "in-progress" : "todo")}
                            >
                              <ArrowLeft size={13} />
                            </button>
                          )}
                          {col.id !== "completed" && (
                            <button
                              className="stage-shift-btn"
                              title="Move right"
                              onClick={() => onUpdateStatus(task._id, col.id === "todo" ? "in-progress" : "completed")}
                            >
                              <ArrowRight size={13} />
                            </button>
                          )}
                          <button
                            className="card-action-icon"
                            onClick={() => onEditTask(task)}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="card-action-icon danger"
                            onClick={() => onDeleteTask(task._id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
