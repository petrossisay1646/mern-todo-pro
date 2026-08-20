import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, CheckCircle2, Flame, Volume2, VolumeX, Target } from "lucide-react";

export default function PomodoroTimer({ tasks, onToggleTask, defaultWorkMinutes = 25 }) {
  const [mode, setMode] = useState("work"); // 'work' | 'shortBreak' | 'longBreak'
  const [timeLeft, setTimeLeft] = useState(defaultWorkMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [completedSessions, setCompletedSessions] = useState(() => {
    return parseInt(localStorage.getItem("todo_pomodoros_today") || "0", 10);
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerRef = useRef(null);
  const audioContextRef = useRef(null);

  const modeDurations = {
    work: defaultWorkMinutes * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  useEffect(() => {
    setTimeLeft(modeDurations[mode]);
    setIsRunning(false);
  }, [mode, defaultWorkMinutes]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, mode]);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45); // C6

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    } catch {}
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    playChime();

    if (mode === "work") {
      const newCount = completedSessions + 1;
      setCompletedSessions(newCount);
      localStorage.setItem("todo_pomodoros_today", newCount.toString());

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🍅 Focus Session Complete!", {
          body: "Great job! Take a well-deserved break.",
          icon: "/favicon.ico"
        });
      }

      // Recommend break
      setMode(newCount % 4 === 0 ? "longBreak" : "shortBreak");
    } else {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⚡ Break Finished!", {
          body: "Ready to focus again?",
          icon: "/favicon.ico"
        });
      }
      setMode("work");
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(modeDurations[mode]);
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDuration = modeDurations[mode];
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  const activeTask = tasks.find(t => t._id === selectedTaskId);
  const activeTasksList = tasks.filter(t => !t.completed);

  return (
    <div className="pomodoro-container">
      <div className="pomodoro-card">
        <div className="pomodoro-header">
          <div className="pomodoro-tabs">
            <button
              className={`pomo-tab ${mode === "work" ? "active" : ""}`}
              onClick={() => setMode("work")}
            >
              🍅 Focus ({defaultWorkMinutes}m)
            </button>
            <button
              className={`pomo-tab ${mode === "shortBreak" ? "active" : ""}`}
              onClick={() => setMode("shortBreak")}
            >
              ☕ Short Break (5m)
            </button>
            <button
              className={`pomo-tab ${mode === "longBreak" ? "active" : ""}`}
              onClick={() => setMode("longBreak")}
            >
              🌿 Long Break (15m)
            </button>
          </div>

          <button
            className="sound-toggle-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>

        {/* Circular / Big Timer Display */}
        <div className="timer-display-wrap">
          <div className="timer-circle">
            <svg className="timer-svg" viewBox="0 0 100 100">
              <circle className="timer-bg-circle" cx="50" cy="50" r="45" />
              <circle
                className="timer-progress-circle"
                cx="50"
                cy="50"
                r="45"
                strokeDasharray="282.7"
                strokeDashoffset={282.7 - (282.7 * progressPercent) / 100}
              />
            </svg>
            <div className="timer-text">
              <span className="timer-digits">{formatTime(timeLeft)}</span>
              <span className="timer-mode-label">
                {mode === "work" ? "FOCUS TIME" : mode === "shortBreak" ? "SHORT BREAK" : "LONG BREAK"}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="timer-controls">
          <button className={`btn-timer-primary ${isRunning ? "running" : ""}`} onClick={toggleTimer}>
            {isRunning ? <Pause size={24} /> : <Play size={24} />}
            <span>{isRunning ? "PAUSE" : "START"}</span>
          </button>
          <button className="btn-timer-reset" onClick={resetTimer} title="Reset Timer">
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Focus Task Binding */}
        <div className="focus-task-section">
          <label className="focus-task-label">
            <Target size={16} /> Link a task to this focus session:
          </label>
          <select
            className="focus-task-select"
            value={selectedTaskId}
            onChange={e => setSelectedTaskId(e.target.value)}
          >
            <option value="">-- Choose task to focus on --</option>
            {activeTasksList.map(task => (
              <option key={task._id} value={task._id}>
                {task.title} {task.priority === "urgent" || task.priority === "high" ? "🔥" : ""}
              </option>
            ))}
          </select>

          {activeTask && (
            <div className="focused-task-card">
              <div className="focused-task-info">
                <strong>{activeTask.title}</strong>
                <span className="badge">{activeTask.category}</span>
              </div>
              <button
                className="btn btn-sm primary"
                onClick={() => {
                  onToggleTask(activeTask);
                  setSelectedTaskId("");
                }}
              >
                <CheckCircle2 size={16} /> Complete Task
              </button>
            </div>
          )}
        </div>

        {/* Stats footer */}
        <div className="pomodoro-footer">
          <div className="session-count">
            <Flame size={18} className="flame-icon" />
            <span>Today's Focus Sessions: <strong>{completedSessions}</strong></span>
          </div>
          <button
            className="reset-stats-link"
            onClick={() => {
              setCompletedSessions(0);
              localStorage.setItem("todo_pomodoros_today", "0");
            }}
          >
            Reset Count
          </button>
        </div>
      </div>
    </div>
  );
}
