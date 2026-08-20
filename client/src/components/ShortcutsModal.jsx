import { X, Command } from "lucide-react";

export default function ShortcutsModal({ open, onClose }) {
  if (!open) return null;

  const shortcuts = [
    { key: "N", desc: "Create new task modal" },
    { key: "/", desc: "Focus search bar" },
    { key: "1", desc: "Switch to List View" },
    { key: "2", desc: "Switch to Kanban Board" },
    { key: "3", desc: "Switch to Pomodoro Focus" },
    { key: "4", desc: "Switch to Analytics & Streaks" },
    { key: "D", desc: "Toggle Dark / Light theme" },
    { key: "Esc", desc: "Close modals / Clear selection" }
  ];

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title-row">
            <Command size={20} className="text-primary" />
            <div>
              <span className="eyebrow">KEYBOARD NAVIGATION</span>
              <h2>Keyboard Shortcuts</h2>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close">
            <X size={19} />
          </button>
        </div>

        <div className="shortcuts-grid">
          {shortcuts.map(s => (
            <div key={s.key} className="shortcut-row">
              <span className="shortcut-desc">{s.desc}</span>
              <kbd className="shortcut-kbd">{s.key}</kbd>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn primary full" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
