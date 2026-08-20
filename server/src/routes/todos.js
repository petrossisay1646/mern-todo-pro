import express from "express";
import Todo from "../models/Todo.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

function cleanTodoBody(body) {
  const allowedPriorities = ["low", "medium", "high", "urgent"];
  const allowedStatuses = ["todo", "in-progress", "completed"];

  let completed = Boolean(body.completed);
  let status = body.status;
  if (!allowedStatuses.includes(status)) {
    status = completed ? "completed" : "todo";
  } else {
    completed = status === "completed";
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.map(t => String(t).trim()).filter(Boolean).slice(0, 10)
    : typeof body.tags === "string"
    ? body.tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 10)
    : [];

  const subtasks = Array.isArray(body.subtasks)
    ? body.subtasks.map(st => ({
        title: String(st.title || "").trim(),
        completed: Boolean(st.completed)
      })).filter(st => st.title)
    : [];

  return {
    title: body.title?.trim(),
    description: body.description?.trim() || "",
    status,
    completed,
    priority: allowedPriorities.includes(body.priority) ? body.priority : "medium",
    category: body.category?.trim() || "General",
    tags,
    subtasks,
    pinned: Boolean(body.pinned),
    estimatedMinutes: Math.max(0, parseInt(body.estimatedMinutes, 10) || 0),
    actualMinutes: Math.max(0, parseInt(body.actualMinutes, 10) || 0),
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    completedAt: completed ? (body.completedAt ? new Date(body.completedAt) : new Date()) : null
  };
}

router.get("/stats/summary", async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.userId }).lean();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = todos.filter(t => !t.completed).length;
    const inProgress = todos.filter(t => t.status === "in-progress").length;
    const overdue = todos.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < startOfToday).length;
    const highPriority = todos.filter(t => !t.completed && (t.priority === "high" || t.priority === "urgent")).length;
    const urgentPriority = todos.filter(t => !t.completed && t.priority === "urgent").length;

    // Categories breakdown
    const categories = {};
    const tagsMap = {};
    let totalEstimated = 0;
    let totalActual = 0;

    todos.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + 1;
      if (Array.isArray(t.tags)) {
        t.tags.forEach(tag => {
          tagsMap[tag] = (tagsMap[tag] || 0) + 1;
        });
      }
      totalEstimated += t.estimatedMinutes || 0;
      totalActual += t.actualMinutes || 0;
    });

    // 7-day completion activity
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = d.toISOString().slice(0, 10);

      const count = todos.filter(t => {
        if (!t.completed || !t.completedAt) return false;
        const compDate = new Date(t.completedAt);
        return compDate >= dayStart && compDate <= dayEnd;
      }).length;

      last7Days.push({ label: dayLabel, date: dateStr, count });
    }

    // Streak calculation: consecutive past days with >= 1 completion
    let streak = 0;
    let checkDate = new Date(startOfToday);
    const todayCompleted = todos.some(t => {
      if (!t.completed || !t.completedAt) return false;
      return new Date(t.completedAt) >= startOfToday;
    });
    if (todayCompleted) streak = 1;

    for (let i = 1; i <= 30; i++) {
      const pastDay = new Date(startOfToday);
      pastDay.setDate(pastDay.getDate() - i);
      const pastDayEnd = new Date(pastDay.getFullYear(), pastDay.getMonth(), pastDay.getDate(), 23, 59, 59, 999);
      const hasCompleted = todos.some(t => {
        if (!t.completed || !t.completedAt) return false;
        const compDate = new Date(t.completedAt);
        return compDate >= pastDay && compDate <= pastDayEnd;
      });
      if (hasCompleted) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      total,
      completed,
      active,
      inProgress,
      overdue,
      highPriority,
      urgentPriority,
      categories,
      tags: tagsMap,
      last7Days,
      streak,
      totalEstimated,
      totalActual
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Failed to load statistics" });
  }
});

router.get("/export", async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.userId }).lean();
    res.setHeader("Content-Disposition", "attachment; filename=todos-backup.json");
    res.setHeader("Content-Type", "application/json");
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: "Export failed" });
  }
});

router.post("/import", async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Valid JSON array of tasks is required" });
    }

    const docsToInsert = items.map(item => {
      const cleaned = cleanTodoBody(item);
      return {
        ...cleaned,
        user: req.userId
      };
    }).filter(d => d.title);

    if (docsToInsert.length === 0) {
      return res.status(400).json({ message: "No valid tasks found in import data" });
    }

    const inserted = await Todo.insertMany(docsToInsert);
    res.status(201).json({ message: `Successfully imported ${inserted.length} tasks`, count: inserted.length });
  } catch (err) {
    console.error("Import error:", err);
    res.status(500).json({ message: "Import failed" });
  }
});

router.post("/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Task IDs array is required" });
    }
    const result = await Todo.deleteMany({ _id: { $in: ids }, user: req.userId });
    res.json({ message: `Deleted ${result.deletedCount} tasks`, count: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: "Bulk delete failed" });
  }
});

router.post("/bulk-update", async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !updates) {
      return res.status(400).json({ message: "Valid IDs array and updates object required" });
    }

    const sanitized = {};
    if (typeof updates.completed === "boolean") {
      sanitized.completed = updates.completed;
      sanitized.status = updates.completed ? "completed" : "todo";
      sanitized.completedAt = updates.completed ? new Date() : null;
    }
    if (updates.status && ["todo", "in-progress", "completed"].includes(updates.status)) {
      sanitized.status = updates.status;
      sanitized.completed = updates.status === "completed";
      sanitized.completedAt = updates.status === "completed" ? new Date() : null;
    }
    if (updates.priority && ["low", "medium", "high", "urgent"].includes(updates.priority)) {
      sanitized.priority = updates.priority;
    }
    if (updates.category && typeof updates.category === "string") {
      sanitized.category = updates.category.trim();
    }

    const result = await Todo.updateMany({ _id: { $in: ids }, user: req.userId }, { $set: sanitized });
    res.json({ message: `Updated ${result.modifiedCount} tasks`, count: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: "Bulk update failed" });
  }
});

router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      priority = "all",
      category = "all",
      tag = "all",
      dueFilter = "all",
      sortBy = "smart"
    } = req.query;

    const query = { user: req.userId };

    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { tags: { $regex: search.trim(), $options: "i" } }
      ];
    }

    if (status === "completed") {
      query.completed = true;
    } else if (status === "active") {
      query.completed = false;
    } else if (status === "todo") {
      query.status = "todo";
    } else if (status === "in-progress") {
      query.status = "in-progress";
    }

    if (priority !== "all") query.priority = priority;
    if (category !== "all") query.category = category;
    if (tag !== "all") query.tags = tag;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    if (dueFilter === "today") {
      query.dueDate = { $gte: startOfToday, $lte: endOfToday };
    } else if (dueFilter === "week") {
      query.dueDate = { $gte: startOfToday, $lte: endOfWeek };
    } else if (dueFilter === "overdue") {
      query.completed = false;
      query.dueDate = { $lt: startOfToday, $ne: null };
    }

    let sortOption = {};
    if (sortBy === "dueDate") {
      sortOption = { dueDate: 1, pinned: -1, createdAt: -1 };
    } else if (sortBy === "priority") {
      
      // Urgent / high first
      sortOption = { priority: 1, dueDate: 1 };
    } else if (sortBy === "title") {
      sortOption = { title: 1 };
    } else if (sortBy === "createdAt") {
      sortOption = { createdAt: -1 };
    } else {

      // Default smart sort: pinned first, uncompleted first, due dates first, newest first
      sortOption = { pinned: -1, completed: 1, dueDate: 1, createdAt: -1 };
    }

    const todos = await Todo.find(query).sort(sortOption);
    res.json(todos);
  } catch (err) {
    console.error("Fetch todos error:", err);
    res.status(500).json({ message: "Failed to load tasks" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = cleanTodoBody(req.body);
    if (!data.title) return res.status(400).json({ message: "Task title is required" });

    const todo = await Todo.create({ ...data, user: req.userId });
    res.status(201).json(todo);
  } catch (err) {
    console.error("Create todo error:", err);
    res.status(400).json({ message: "Invalid task data" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updates = cleanTodoBody(req.body);
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!todo) return res.status(404).json({ message: "Task not found" });
    res.json(todo);
  } catch (err) {
    res.status(400).json({ message: "Could not update task" });
  }
});

router.patch("/:id/toggle", async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.userId });
    if (!todo) return res.status(404).json({ message: "Task not found" });

    todo.completed = !todo.completed;
    todo.status = todo.completed ? "completed" : "todo";
    todo.completedAt = todo.completed ? new Date() : null;
    await todo.save();

    res.json(todo);
  } catch (err) {
    res.status(400).json({ message: "Could not toggle task status" });
  }
});

router.patch("/:id/subtasks", async (req, res) => {
  try {
    const { subtaskId, completed, subtasks } = req.body;
    const todo = await Todo.findOne({ _id: req.params.id, user: req.userId });
    if (!todo) return res.status(404).json({ message: "Task not found" });

    if (Array.isArray(subtasks)) {
      todo.subtasks = subtasks;
    } else if (subtaskId) {
      const st = todo.subtasks.id(subtaskId);
      if (st) {
        st.completed = typeof completed === "boolean" ? completed : !st.completed;
      }
    }

    await todo.save();
    res.json(todo);
  } catch (err) {
    res.status(400).json({ message: "Could not update subtask" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!todo) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(400).json({ message: "Could not delete task" });
  }
});

export default router;
