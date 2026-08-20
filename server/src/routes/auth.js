import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: "Email is already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      dailyGoal: 5,
      pomodoroLength: 25,
      avatarColor: "#635bff"
    });

    res.status(201).json({
      token: signToken(user._id.toString()),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dailyGoal: user.dailyGoal,
        pomodoroLength: user.pomodoroLength,
        avatarColor: user.avatarColor
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      token: signToken(user._id.toString()),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dailyGoal: user.dailyGoal || 5,
        pomodoroLength: user.pomodoroLength || 25,
        avatarColor: user.avatarColor || "#635bff"
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.put("/profile", protect, async (req, res) => {
  try {
    const { name, dailyGoal, pomodoroLength, avatarColor } = req.body;
    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (dailyGoal && Number(dailyGoal) > 0) updates.dailyGoal = Number(dailyGoal);
    if (pomodoroLength && Number(pomodoroLength) > 0) updates.pomodoroLength = Number(pomodoroLength);
    if (avatarColor) updates.avatarColor = avatarColor;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user, message: "Profile updated successfully" });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(400).json({ message: "Could not update profile" });
  }
});

router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ message: "Could not update password" });
  }
});

export default router;
