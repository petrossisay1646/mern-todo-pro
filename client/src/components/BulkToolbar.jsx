import { CheckCircle2, Trash2, X, Tag, AlertTriangle } from "lucide-react";

export default function BulkToolbar({
  selectedCount,
  onClear,
  onBulkComplete,
  onBulkDelete,
  onBulkPriority
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-toolbar-floating">
      <div className="bulk-left">
        <span className="bulk-badge">{selectedCount}</span>
        <strong>{selectedCount} task{selectedCount > 1 ? "s" : ""} selected</strong>
      </div>

      <div className="bulk-actions">
        <button className="btn btn-sm ghost" onClick={() => onBulkComplete(true)}>
          <CheckCircle2 size={16} /> Mark Completed
        </button>
        <button className="btn btn-sm ghost" onClick={() => onBulkComplete(false)}>
          Undo Completion
        </button>

        <select
          className="bulk-priority-select"
          defaultValue=""
          onChange={e => {
            if (e.target.value) {
              onBulkPriority(e.target.value);
              e.target.value = "";
            }
          }}
        >
          <option value="" disabled>Set Priority...</option>
          <option value="urgent">🔴 Urgent</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        <button className="btn btn-sm danger-bulk" onClick={onBulkDelete}>
          <Trash2 size={16} /> Delete Selected
        </button>

        <button className="bulk-close-btn" onClick={onClear} title="Clear selection (Esc)">
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
