import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type || "info"}`}>
          <div className="toast-icon">
            {toast.type === "success" && <CheckCircle2 size={18} />}
            {toast.type === "error" && <AlertCircle size={18} />}
            {(!toast.type || toast.type === "info") && <Info size={18} />}
          </div>
          <div className="toast-content">
            {toast.title && <strong>{toast.title}</strong>}
            <span>{toast.message}</span>
          </div>
          <button className="toast-close" onClick={() => onDismiss(toast.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
