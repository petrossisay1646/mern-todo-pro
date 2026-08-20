import { useState, useRef } from "react";
import { X, User, Lock, Download, Upload, Target, Clock, ShieldCheck, Check } from "lucide-react";
import api from "../api";

const avatarColors = ["#635bff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function SettingsModal({ open, onClose, user, onUpdateUser, onDataChanged }) {
  const [tab, setTab] = useState("profile"); // 'profile' | 'security' | 'backup'
  const [name, setName] = useState(user?.name || "");
  const [dailyGoal, setDailyGoal] = useState(user?.dailyGoal || 5);
  const [pomodoroLength, setPomodoroLength] = useState(user?.pomodoroLength || 25);
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "#635bff");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState({ text: "", type: "" });
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  if (!open) return null;

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleProfileSubmit = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      await onUpdateUser({ name, dailyGoal, pomodoroLength, avatarColor });
      showMsg("Profile and preferences saved successfully!");
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordSubmit = async e => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return showMsg("New passwords do not match", "error");
    }
    if (newPassword.length < 6) {
      return showMsg("Password must be at least 6 characters", "error");
    }

    setBusy(true);
    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
      showMsg("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showMsg(err.response?.data?.message || "Could not change password", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await api.get("/todos/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `todo-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMsg("Tasks exported successfully!");
    } catch {
      showMsg("Export failed", "error");
    }
  };

  const handleImport = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async event => {
        try {
          const parsed = JSON.parse(event.target?.result);
          const { data } = await api.post("/todos/import", parsed);
          showMsg(data.message || "Import completed!");
          onDataChanged();
        } catch {
          showMsg("Invalid JSON file format", "error");
        }
      };
      reader.readAsText(file);
    } catch {
      showMsg("Import failed", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal modal-lg" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">WORKSPACE PREFERENCES</span>
            <h2>Settings & Profile</h2>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close">
            <X size={19} />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="settings-tabs">
          <button
            className={`settings-tab-btn ${tab === "profile" ? "active" : ""}`}
            onClick={() => setTab("profile")}
          >
            <User size={16} /> Profile & Goals
          </button>
          <button
            className={`settings-tab-btn ${tab === "security" ? "active" : ""}`}
            onClick={() => setTab("security")}
          >
            <Lock size={16} /> Security
          </button>
          <button
            className={`settings-tab-btn ${tab === "backup" ? "active" : ""}`}
            onClick={() => setTab("backup")}
          >
            <Download size={16} /> Data Backup
          </button>
        </div>

        {message.text && (
          <div className={message.type === "error" ? "error" : "success-banner"}>
            {message.text}
          </div>
        )}

        {/* Profile Tab */}
        {tab === "profile" && (
          <form onSubmit={handleProfileSubmit} className="settings-form">
            <div className="avatar-preview-row">
              <div className="avatar-lg" style={{ backgroundColor: avatarColor }}>
                {name.slice(0, 1).toUpperCase() || "U"}
              </div>
              <div>
                <strong>Choose Avatar Color Theme</strong>
                <div className="color-palette">
                  {avatarColors.map(col => (
                    <button
                      key={col}
                      type="button"
                      className={`color-dot ${avatarColor === col ? "selected" : ""}`}
                      style={{ backgroundColor: col }}
                      onClick={() => setAvatarColor(col)}
                    >
                      {avatarColor === col && <Check size={14} color="#fff" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>
                Full Name
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your display name"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                Email Address
                <input value={user?.email || ""} disabled className="input-disabled" />
              </label>
            </div>

            <div className="form-grid">
              <label>
                <Target size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />
                Daily Task Target (Goal)
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={dailyGoal}
                  onChange={e => setDailyGoal(Number(e.target.value))}
                />
              </label>

              <label>
                <Clock size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />
                Pomodoro Focus Duration (Minutes)
                <input
                  type="number"
                  min="5"
                  max="90"
                  step="5"
                  value={pomodoroLength}
                  onChange={e => setPomodoroLength(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={onClose}>Close</button>
              <button type="submit" className="btn primary" disabled={busy}>
                {busy ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </form>
        )}

        {/* Security Tab */}
        {tab === "security" && (
          <form onSubmit={handlePasswordSubmit} className="settings-form">
            <div className="form-group">
              <label>
                Current Password
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                New Password (min. 6 characters)
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                Confirm New Password
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={onClose}>Close</button>
              <button type="submit" className="btn primary" disabled={busy}>
                {busy ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}

        {/* Backup & Restore Tab */}
        {tab === "backup" && (
          <div className="backup-section">
            <div className="backup-card">
              <div className="backup-icon"><Download size={24} /></div>
              <div className="backup-info">
                <h4>Export Tasks JSON</h4>
                <p className="muted">Download a complete backup of all your tasks, subtasks, categories, and tags.</p>
                <button className="btn ghost" onClick={handleExport}>
                  <Download size={16} /> Export JSON File
                </button>
              </div>
            </div>

            <div className="backup-card">
              <div className="backup-icon"><Upload size={24} /></div>
              <div className="backup-info">
                <h4>Import Tasks JSON</h4>
                <p className="muted">Restore or import tasks from a previously saved JSON backup file.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={handleImport}
                />
                <button className="btn ghost" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} /> Select JSON File to Import
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
