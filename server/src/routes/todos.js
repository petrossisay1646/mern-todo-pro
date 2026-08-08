import express from "express";
import Todo from "../models/Todo.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

function cleanTodoBody(body) {
  return {
    title: body.title?.trim(),
    description: body.description?.trim() || "",
    priority: ["low", "medium", "high"].includes(body.priority) ? body.priority : "medium",
    category: body.category?.trim() || "General",
    dueDate: body.dueDate || null,
    completed: Boolean(body.completed)
  };
}

router.get("/stats/summary", async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.userId }).lean();
    const now = new Date();

    const stats = {
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      active: todos.filter(t => !t.completed).length,
      overdue: todos.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < now).length,
      highPriority: todos.filter(t => !t.completed && t.priority === "high").length
    };

    const categories = {};
    todos.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + 1;
    });

    res.json({ ...stats, categories });
  } catch {
    res.status(500).json({ message: "Failed to load statistics" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { search = "", status = "all", priority = "all", category = "all" } = req.query;
    const query = { user: req.userId };

    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } }
      ];
    }
    if (status === "completed") query.completed = true;
    if (status === "active") query.completed = false;
    if (priority !== "all") query.priority = priority;
    if (category !== "all") query.category = category;

    const todos = await Todo.find(query).sort({ completed: 1, dueDate: 1, createdAt: -1 });
    res.json(todos);
  } catch {
    res.status(500).json({ message: "Failed to load tasks" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = cleanTodoBody(req.body);
    if (!data.title) return res.status(400).json({ message: "Task title is required" });

    const todo = await Todo.create({ ...data, user: req.userId });
    res.status(201).json(todo);
  } catch {
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
  } catch {
    res.status(400).json({ message: "Could not update task" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!todo) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch {
    res.status(400).json({ message: "Could not delete task" });
  }
});

export default router;
