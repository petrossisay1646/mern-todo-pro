import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    category: { type: String, trim: true, maxlength: 40, default: "General" },
    dueDate: { type: Date, default: null }
  },
  { timestamps: true }
);

todoSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Todo", todoSchema);
