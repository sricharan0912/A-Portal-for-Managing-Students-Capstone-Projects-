/**
 * @fileoverview Main entry point for Capstone Hub Backend Server
 * Sets up Express app with middleware, routes, and error handling
 * Validates environment variables and establishes database connection
 * 
 * @requires express
 * @requires cors
 * @requires dotenv
 * @requires ./config/validateEnv
 * @requires ../db
 * @requires ./middleware/errorHandler
 * @requires ./routes/clientRoutes
 * @requires ./routes/studentRoutes
 * @requires ./routes/instructorRoutes
 * @requires ./routes/projectRoutes
 * @requires ./routes/evaluationRoutes
 */

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
import evaluationRoutes from "./routes/evaluationRoutes.js";

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

/**
 * Root Health Check Endpoint
 * GET /
 * 
 * Returns server status and timestamp
 * Does not require authentication
 * 
 * @name GET/
 * @function
 * @memberof module:index
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success status, message, and timestamp
 * 
 * @example
 * // Response
 * {
 *   "success": true,
 *   "message": "Backend is running",
 *   "timestamp": "2025-12-20T12:00:00.000Z"
 * }
 */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Health Check Endpoint for Load Balancers
 * GET /health
 * 
 * Lightweight health check endpoint for monitoring systems
 * Does not require authentication
 * 
 * @name GET/health
 * @function
 * @memberof module:index
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success status
 * 
 * @example
 * // Response
 * {
 *   "success": true,
 *   "status": "healthy"
 * }
 */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
  });
});

// ==================== EMAIL VALIDATION ENDPOINT ====================

/**
 * Check Email Availability Endpoint
 * GET /check-email
 * 
 * Validates if an email address is available for registration
 * Checks against unified users table to prevent duplicate registrations
 * Does not require authentication
 * 
 * @name GET/check-email
 * @function
 * @memberof module:index
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.email - Email address to check
 * @param {Object} res - Express response object
 * @returns {Object} JSON response indicating email availability
 * 
 * @example
 * // Request
 * GET /check-email?email=user@example.com
 * 
 * @example
 * // Response - Email available
 * {
 *   "success": true,
 *   "message": "Email is available",
 *   "available": true
 * }
 * 
 * @example
 * // Response - Email taken
 * {
 *   "success": false,
 *   "error": "Email already registered as a student"
 * }
 */
app.get("/check-email", async (req, res) => {
  try {
    const { email } = req.query;

    console.log("✅ Check email request for:", email);

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "Email parameter is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ✅ NEW UNIFIED SCHEMA: Check users table (all user types in one table)
    const [users] = await db.query(
      "SELECT id, role FROM users WHERE LOWER(email) = ? AND deleted_at IS NULL",
      [normalizedEmail]
    );

    if (users.length > 0) {
      const userRole = users[0].role;
      console.log(`❌ Email found in users table as ${userRole}`);
      return res.status(409).json({
        success: false,
        error: `Email already registered as a ${userRole}`,
      });
    }

    // Email is available
    console.log("✅ Email is available");
    res.status(200).json({
      success: true,
      message: "Email is available",
      available: true,
    });

  } catch (err) {
    console.error("❌ Error checking email:", err);
    res.status(500).json({
      success: false,
      error: "Failed to check email availability",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

// ==================== ROUTES ====================

/**
 * Project Routes
 * Handles all project-related endpoints
 * Base path: /projects
 * @see module:routes/projectRoutes
 */
app.use("/projects", projectRoutes);

/**
 * Client Routes
 * Handles all client-related endpoints
 * Base path: /clients
 * @see module:routes/clientRoutes
 */
app.use("/clients", clientRoutes);

/**
 * Student Routes
 * Handles all student-related endpoints
 * Base path: /students
 * @see module:routes/studentRoutes
 */
app.use("/students", studentRoutes);

/**
 * Instructor Routes
 * Handles all instructor-related endpoints
 * Base path: /instructors
 * @see module:routes/instructorRoutes
 */
app.use("/instructors", instructorRoutes);

/**
 * Evaluation Routes
 * Handles all evaluation-related endpoints
 * Base path: /evaluations
 * @see module:routes/evaluationRoutes
 */
app.use("/evaluations", evaluationRoutes);

// ==================== 404 HANDLER ====================

/**
 * 404 Not Found Handler
 * Catches all requests that don't match any defined routes
 * Returns standardized error response
 * 
 * @name 404Handler
 * @function
 * @memberof module:index
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON error response with 404 status
 * 
 * @example
 * // Response
 * {
 *   "success": false,
 *   "error": "Endpoint not found",
 *   "code": "NOT_FOUND",
 *   "path": "/invalid/path",
 *   "method": "GET"
 * }
 */
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

/**
 * Global Error Handler
 * Catches all errors thrown in routes and middleware
 * MUST be registered after all other middleware and routes
 * @see module:middleware/errorHandler
 */
app.use(errorHandler);

// ==================== SERVER STARTUP ====================

const PORT = process.env.PORT || 5050;
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Start Express Server
 * Listens on configured PORT and logs startup information
 * Displays environment summary in development mode
 * 
 * @constant {Server} server - Express server instance
 */
const server = app.listen(PORT, () => {
  console.log("\n" + "=".repeat(50));
  console.log("🚀 Capstone Hub Backend Server");
  console.log("=".repeat(50));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
  console.log("=".repeat(50) + "\n");

  // Print environment summary in development
  if (NODE_ENV === "development") {
    printEnvironmentSummary();
  }
});

// ==================== GRACEFUL SHUTDOWN ====================

/**
 * SIGTERM Signal Handler
 * Handles graceful shutdown when SIGTERM signal is received
 * Closes server and exits process cleanly
 * 
 * @listens process#SIGTERM
 */
process.on("SIGTERM", () => {
  console.log("\n🔴 SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

/**
 * SIGINT Signal Handler
 * Handles graceful shutdown when SIGINT signal is received (Ctrl+C)
 * Closes server and exits process cleanly
 * 
 * @listens process#SIGINT
 */
process.on("SIGINT", () => {
  console.log("\n🔴 SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

/**
 * Uncaught Exception Handler
 * Catches any uncaught exceptions and logs them
 * Exits process with error code
 * 
 * @listens process#uncaughtException
 * @param {Error} err - The uncaught exception
 */
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

/**
 * Unhandled Promise Rejection Handler
 * Catches any unhandled promise rejections and logs them
 * Exits process with error code
 * 
 * @listens process#unhandledRejection
 * @param {*} reason - Rejection reason
 * @param {Promise} promise - The rejected promise
 */
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;