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

// Security & Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts/styles for development/Vite assets
}));

app.use(cors({
  origin: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map(v => v.trim())
    : true,
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "mern-todo-pro-api",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

// Production Static Serving
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

async function connectDB() {
  const isDev = process.env.NODE_ENV !== "production";
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "mern_todo_pro_development_jwt_secret_key_2025";
    if (isDev) {
      console.warn("⚠️  JWT_SECRET not provided in .env, using default development key.");
    }
  }

  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log(" Connected to MongoDB via MONGO_URI");
      return;
    } catch (err) {
      console.error("❌ Failed to connect to MONGO_URI:", err.message);
      if (!isDev) throw err;
      console.log("🔄 Falling back to in-memory MongoDB for local development...");
    }
  }

  // Local development memory server fallback
  try {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(" In-memory MongoDB started successfully for local development.");
    console.log(` MongoDB Memory URI: ${uri}`);
  } catch (err) {
    console.error("❌ Could not start in-memory MongoDB:", err.message);
    throw new Error("MongoDB connection failed. Please set MONGO_URI in .env");
  }
}

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 MERN Todo Pro API running on port ${PORT}`);
      console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Fatal startup error:", error.message);
    process.exit(1);
  }
}

start();
