import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  completed: { type: Boolean, default: false }
});

const todoSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    completed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["todo", "in-progress", "completed"],
      default: "todo"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    category: { type: String, trim: true, maxlength: 40, default: "General" },
    tags: [{ type: String, trim: true, maxlength: 30 }],
    pinned: { type: Boolean, default: false },
    estimatedMinutes: { type: Number, default: 0, min: 0 },
    actualMinutes: { type: Number, default: 0, min: 0 },
    subtasks: [subtaskSchema],
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

todoSchema.index({ user: 1, pinned: -1, completed: 1, dueDate: 1, createdAt: -1 });

export default mongoose.model("Todo", todoSchema);
