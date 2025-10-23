import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ==================== CONFIGURATION ====================

// Load environment variables from .env file
dotenv.config();

// VALIDATE ENVIRONMENT VARIABLES FIRST (before anything else)
import { validateEnvironment, printEnvironmentSummary } from "./config/validateEnv.js";
validateEnvironment(); // This will crash if any required vars are missing

// ==================== DATABASE IMPORT ====================

import db from "../db.js";

// ==================== MIDDLEWARE IMPORTS ====================

import { 
  requestIdMiddleware, 
  requestLoggingMiddleware, 
  errorHandler 
} from "./middleware/errorHandler.js";

// ==================== ROUTE IMPORTS ====================

import clientRoutes from "./routes/clientRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

// ==================== EXPRESS APP SETUP ====================

const app = express();

// ==================== MIDDLEWARE ORDER (IMPORTANT!) ====================

// 1. Request ID middleware (FIRST - generates unique ID for each request)
app.use(requestIdMiddleware);

// 2. Request logging middleware (logs all incoming requests)
app.use(requestLoggingMiddleware);

// 3. CORS middleware (with security)
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
}));

// 4. Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// 5. Body parser middleware (parse JSON requests)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ==================== HEALTH CHECK ENDPOINT ====================

// Health check (doesn't need authentication)
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Health check for load balancers
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
  });
});

// ==================== ROUTES ====================

// Project routes
app.use("/projects", projectRoutes);

// Client routes
app.use("/clients", clientRoutes);

// Student routes
app.use("/students", studentRoutes);

// Instructor routes
app.use("/instructors", instructorRoutes);



// ==================== EMAIL VALIDATION ENDPOINT ====================

/**
 * Check if email is available (prevents duplicate registrations)
 * GET /check-email?email=user@example.com
 * 
 * Returns 200 if email is available
 * Returns 409 if email already exists in any table
 */
app.get("/check-email", async (req, res) => {
  try {
    const { email } = req.query;

    console.log("Check email request for:", email);

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "Email parameter is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check students table
    const [students] = await db.query(
      "SELECT id FROM students WHERE LOWER(email) = ?",
      [normalizedEmail]
    );

    if (students.length > 0) {
      console.log("Email found in students table");
      return res.status(409).json({
        success: false,
        error: "Email already registered as a student",
      });
    }

    // Check clients table
    const [clients] = await db.query(
      "SELECT id FROM clients WHERE LOWER(email) = ?",
      [normalizedEmail]
    );

    if (clients.length > 0) {
      console.log("Email found in clients table");
      return res.status(409).json({
        success: false,
        error: "Email already registered as a client",
      });
    }

    // Check instructors table
    const [instructors] = await db.query(
      "SELECT id FROM instructors WHERE LOWER(email) = ?",
      [normalizedEmail]
    );

    if (instructors.length > 0) {
      console.log("Email found in instructors table");
      return res.status(409).json({
        success: false,
        error: "Email already registered as an instructor",
      });
    }

    // Email is available
    console.log("Email is available");
    res.status(200).json({
      success: true,
      message: "Email is available",
      available: true,
    });

  } catch (err) {
    console.error("Error checking email:", err);
    res.status(500).json({
      success: false,
      error: "Failed to check email availability",
    });
  }
});

// ==================== 404 HANDLER ====================

// If no route matches, return 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    code: "NOT_FOUND",
    path: req.path,
    method: req.method,
  });
});

// ==================== ERROR HANDLER (MUST BE LAST) ====================

// Global error handler (catches all errors from routes)
// MUST be after all other middleware and routes
app.use(errorHandler);

// ==================== SERVER STARTUP ====================

const PORT = process.env.PORT || 5050;
const NODE_ENV = process.env.NODE_ENV || "development";

const server = app.listen(PORT, () => {
  console.log("\n" + "=".repeat(50));
  console.log("🚀 Capstone Hub Backend Server");
  console.log("=".repeat(50));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
  console.log("=".repeat(50) + "\n");

  // Print environment summary in development
  if (NODE_ENV === "development") {
    printEnvironmentSummary();
  }
});

// ==================== GRACEFUL SHUTDOWN ====================

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n📞 SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n📞 SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;