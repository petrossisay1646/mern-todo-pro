import { CheckCircle2, Flame, Target, Clock, TrendingUp, AlertTriangle, PieChart } from "lucide-react";

export default function AnalyticsView({ stats, user, todos }) {
  const dailyGoal = user?.dailyGoal || 5;

  // Calculate today's completed count
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const completedToday = todos.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    return new Date(t.completedAt) >= startOfToday;
  }).length;

  const goalPercent = Math.min(100, Math.round((completedToday / dailyGoal) * 100));

  // Overall completion rate
  const totalTasks = stats?.total || 0;
  const completedTasks = stats?.completed || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Weekly stats
  const last7Days = stats?.last7Days || [];
  const maxDayCount = Math.max(1, ...last7Days.map(d => d.count));

  // Priority count
  const urgentCount = todos.filter(t => t.priority === "urgent" && !t.completed).length;
  const highCount = todos.filter(t => t.priority === "high" && !t.completed).length;
  const medCount = todos.filter(t => t.priority === "medium" && !t.completed).length;
  const lowCount = todos.filter(t => t.priority === "low" && !t.completed).length;

  // Estimated vs actual
  const totalEstHours = ((stats?.totalEstimated || 0) / 60).toFixed(1);

  return (
    <div className="analytics-view">
      {/* Top Banner & Highlights */}
      <div className="analytics-hero-grid">
        {/* Daily Goal Card */}
        <div className="analytics-card goal-card">
          <div className="card-header-row">
            <span className="card-badge">DAILY TARGET</span>
            <Target size={20} className="text-primary" />
          </div>
          <div className="goal-body">
            <div className="goal-ring-wrap">
              <svg className="goal-svg" viewBox="0 0 36 36">
                <path
                  className="goal-bg-path"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="goal-fill-path"
                  strokeDasharray={`${goalPercent}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="goal-center-text">
                <strong>{goalPercent}%</strong>
              </div>
            </div>
            <div className="goal-info">
              <h3>{completedToday} of {dailyGoal} Completed</h3>
              <p className="muted">
                {completedToday >= dailyGoal
                  ? "🎉 Goal reached! Fantastic productivity today!"
                  : `${dailyGoal - completedToday} more task${dailyGoal - completedToday > 1 ? "s" : ""} to hit your daily goal.`}
              </p>
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="analytics-card streak-card">
          <div className="card-header-row">
            <span className="card-badge streak-badge">PRODUCTIVITY STREAK</span>
            <Flame size={20} className="text-orange" />
          </div>
          <div className="streak-body">
            <div className="streak-number">
              <span>🔥</span>
              <strong>{stats?.streak || 0}</strong>
              <small>Day{(stats?.streak || 0) !== 1 ? "s" : ""}</small>
            </div>
            <p className="muted">
              {(stats?.streak || 0) > 0
                ? "You are building a great momentum! Keep checking off tasks daily."
                : "Complete at least one task today to start your streak!"}
            </p>
          </div>
        </div>

        {/* Overall Completion Rate */}
        <div className="analytics-card rate-card">
          <div className="card-header-row">
            <span className="card-badge">COMPLETION RATE</span>
            <TrendingUp size={20} className="text-green" />
          </div>
          <div className="rate-body">
            <div className="rate-stat">
              <strong>{completionRate}%</strong>
              <span>({completedTasks}/{totalTasks} tasks)</span>
            </div>
            <div className="rate-progress-bar">
              <div className="rate-progress-fill" style={{ width: `${completionRate}%` }} />
            </div>
            <p className="muted">
              Estimated workload: <strong>{totalEstHours} hours</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Activity Chart */}
      <div className="analytics-card chart-card">
        <div className="chart-header">
          <div>
            <h3>7-Day Task Completion Trend</h3>
            <p className="muted">Number of tasks finished over the last 7 days</p>
          </div>
          <span className="chart-total-pill">
            <CheckCircle2 size={15} />
            {last7Days.reduce((acc, d) => acc + d.count, 0)} completed this week
          </span>
        </div>

        <div className="bar-chart-container">
          {last7Days.map((item, idx) => {
            const heightPercent = maxDayCount > 0 ? (item.count / maxDayCount) * 100 : 0;
            const isToday = idx === last7Days.length - 1;

            return (
              <div key={item.date} className={`bar-column ${isToday ? "today" : ""}`}>
                <div className="bar-count-tip">{item.count}</div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ height: `${Math.max(6, heightPercent)}%` }}
                  />
                </div>
                <span className="bar-label">{item.label}</span>
                {isToday && <span className="today-dot" title="Today" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="breakdown-grid">
        {/* Priority Breakdown */}
        <div className="analytics-card">
          <div className="card-head-simple">
            <AlertTriangle size={18} />
            <h3>Active Tasks by Priority</h3>
          </div>
          <div className="priority-list">
            <div className="priority-row">
              <div className="prio-label"><span className="dot dot-urgent" /> Urgent</div>
              <div className="prio-bar-wrap">
                <div className="prio-bar bar-urgent" style={{ width: `${(urgentCount / (stats?.active || 1)) * 100}%` }} />
              </div>
              <strong className="prio-num">{urgentCount}</strong>
            </div>

            <div className="priority-row">
              <div className="prio-label"><span className="dot dot-high" /> High</div>
              <div className="prio-bar-wrap">
                <div className="prio-bar bar-high" style={{ width: `${(highCount / (stats?.active || 1)) * 100}%` }} />
              </div>
              <strong className="prio-num">{highCount}</strong>
            </div>

            <div className="priority-row">
              <div className="prio-label"><span className="dot dot-medium" /> Medium</div>
              <div className="prio-bar-wrap">
                <div className="prio-bar bar-med" style={{ width: `${(medCount / (stats?.active || 1)) * 100}%` }} />
              </div>
              <strong className="prio-num">{medCount}</strong>
            </div>

            <div className="priority-row">
              <div className="prio-label"><span className="dot dot-low" /> Low</div>
              <div className="prio-bar-wrap">
                <div className="prio-bar bar-low" style={{ width: `${(lowCount / (stats?.active || 1)) * 100}%` }} />
              </div>
              <strong className="prio-num">{lowCount}</strong>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="analytics-card">
          <div className="card-head-simple">
            <PieChart size={18} />
            <h3>Tasks by Category</h3>
          </div>
          <div className="category-stats-list">
            {Object.keys(stats?.categories || {}).length === 0 ? (
              <p className="muted" style={{ padding: "15px 0" }}>No categorized tasks yet.</p>
            ) : (
              Object.entries(stats?.categories || {}).map(([cat, count]) => {
                const percent = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                return (
                  <div key={cat} className="category-stat-item">
                    <div className="cat-info-row">
                      <span className="cat-name">{cat}</span>
                      <span className="cat-count">{count} tasks ({percent}%)</span>
                    </div>
                    <div className="cat-bar-track">
                      <div className="cat-bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
