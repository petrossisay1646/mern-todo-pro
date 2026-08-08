import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.js";
import todoRoutes from "./routes/todos.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL?.split(",").map(v => v.trim()) || true
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "mern-todo-pro" }));
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("/{*splat}", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

async function start() {
  try {
    if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
      throw new Error("MONGO_URI and JWT_SECRET must be configured");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`API running on port ${PORT}`));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

start();
