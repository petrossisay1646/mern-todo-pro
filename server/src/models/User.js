import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    dailyGoal: { type: Number, default: 5, min: 1, max: 50 },
    pomodoroLength: { type: Number, default: 25, min: 5, max: 90 },
    avatarColor: { type: String, default: "#635bff" }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
