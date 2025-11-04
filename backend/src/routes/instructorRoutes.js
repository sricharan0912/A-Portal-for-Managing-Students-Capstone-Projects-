import express from "express";
import jwt from "jsonwebtoken";
import db from "../../db.js";
import { auth } from "../../firebaseAdmin.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { validateInstructorSignup, validateInstructorLogin } from "../middleware/validateRequest.js";

const router = express.Router();

const generateJWT = (uid, email, role, instructorId) => {
  return jwt.sign(
    { uid, email, role, instructorId },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );
};

// ==================== AUTHENTICATION ====================

// Instructor Signup with Firebase
// IMPORTANT: Frontend creates Firebase user first, backend only verifies token
router.post("/signup", validateInstructorSignup, async (req, res) => {
  try {
    const { email, first_name, last_name, idToken } = req.body;

    // Check if email already exists in database
    const [existing] = await db.query(
      "SELECT id FROM instructors WHERE email = ?",
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    // Verify the Firebase ID token that frontend sent
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (err) {
      console.error("Firebase token verification failed:", err);
      return res.status(401).json({
        success: false,
        error: "Invalid or expired Firebase token",
      });
    }

    const uid = decodedToken.uid;

    // Create instructor in database
    const [result] = await db.query(
      "INSERT INTO instructors (first_name, last_name, email, firebase_uid) VALUES (?, ?, ?, ?)",
      [first_name, last_name, email, uid]
    );

    const instructorId = result.insertId;

    // Generate JWT token
    const token = generateJWT(uid, email, "instructor", instructorId);

    res.status(201).json({
      success: true,
      message: "Instructor registered successfully",
      token,
      instructor: {
        id: instructorId,
        first_name,
        last_name,
        email,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);

    // Handle database duplicate entry error
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    res.status(500).json({
      success: false,
      error: err.message || "Registration failed",
    });
  }
});

// Instructor Login with Firebase
router.post("/login", validateInstructorLogin, async (req, res) => {
  try {
    const { email, idToken } = req.body;

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (err) {
      console.error("Firebase token verification failed:", err);
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
    }

    const uid = decodedToken.uid;

    // Get instructor from database
    const [instructors] = await db.query(
      "SELECT id, first_name, last_name, email FROM instructors WHERE email = ?",
      [email]
    );

    if (instructors.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Instructor account not found. Please sign up first.",
      });
    }

    const instructor = instructors[0];
    const instructorId = instructor.id;

    // Generate JWT token
    const token = generateJWT(uid, email, "instructor", instructorId);

    res.json({
      success: true,
      message: "Login successful",
      token,
      instructor: {
        id: instructorId,
        first_name: instructor.first_name,
        last_name: instructor.last_name,
        email: instructor.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    res.status(401).json({
      success: false,
      error: "Authentication failed",
    });
  }
});

// ==================== INSTRUCTOR PROFILE ====================

// Get instructor profile (PROTECTED)
router.get("/:instructor_id", verifyToken, async (req, res) => {
  try {
    const { instructor_id } = req.params;

    // Validate instructor_id is numeric
    if (isNaN(instructor_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid instructor ID format",
      });
    }

    // Authorization check - instructor can only access their own profile or admin
    if (parseInt(instructor_id) !== req.user.instructorId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    const [instructors] = await db.query(
      "SELECT id, first_name, last_name, email, created_at FROM instructors WHERE id = ?",
      [parseInt(instructor_id)]
    );

    if (instructors.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Instructor not found",
      });
    }

    res.json({
      success: true,
      data: instructors[0],
    });
  } catch (err) {
    console.error("Error fetching instructor:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch instructor profile",
    });
  }
});

// Update instructor profile (PROTECTED)
router.put("/:instructor_id", verifyToken, async (req, res) => {
  try {
    const { instructor_id } = req.params;
    const { first_name, last_name, email } = req.body;

    // Validate instructor_id is numeric
    if (isNaN(instructor_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid instructor ID format",
      });
    }

    // Authorization check
    if (parseInt(instructor_id) !== req.user.instructorId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    // Validation
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        error: "First name, last name, and email are required",
      });
    }

    // Check if email already exists (excluding current instructor)
    const [existingEmail] = await db.query(
      "SELECT id FROM instructors WHERE email = ? AND id != ?",
      [email, parseInt(instructor_id)]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Email already in use",
      });
    }

    const [result] = await db.query(
      "UPDATE instructors SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
      [first_name, last_name, email, parseInt(instructor_id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Instructor not found",
      });
    }

    res.json({
      success: true,
      message: "Instructor profile updated successfully",
    });
  } catch (err) {
    console.error("Error updating instructor:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update instructor profile",
    });
  }
});

// Delete instructor account (PROTECTED)
router.delete("/:instructor_id", verifyToken, async (req, res) => {
  try {
    const { instructor_id } = req.params;

    // Validate instructor_id is numeric
    if (isNaN(instructor_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid instructor ID format",
      });
    }

    // Authorization check
    if (parseInt(instructor_id) !== req.user.instructorId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    // Delete the instructor
    const [result] = await db.query(
      "DELETE FROM instructors WHERE id = ?",
      [parseInt(instructor_id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Instructor not found",
      });
    }

    res.json({
      success: true,
      message: "Instructor account deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting instructor:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete instructor account",
    });
  }
});

// ==================== INSTRUCTOR DASHBOARD ====================

// Get instructor dashboard statistics (PROTECTED)
router.get("/:instructor_id/stats", verifyToken, async (req, res) => {
  try {
    const { instructor_id } = req.params;

    // Validate instructor_id is numeric
    if (isNaN(instructor_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid instructor ID format",
      });
    }

    // Authorization check
    if (parseInt(instructor_id) !== req.user.instructorId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    // Get student statistics
    const [studentStats] = await db.query(
      `SELECT COUNT(*) as total_students FROM students`
    );

    // Get project statistics
    const [projectStats] = await db.query(
      `SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_projects,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_projects,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_projects
       FROM projects`
    );

    // Get group statistics
    const [groupStats] = await db.query(
      `SELECT COUNT(DISTINCT id) as total_groups FROM student_groups`
    );

    res.json({
      success: true,
      data: {
        students: studentStats[0] || { total_students: 0 },
        projects: projectStats[0] || {
          total_projects: 0,
          open_projects: 0,
          approved_projects: 0,
          closed_projects: 0,
        },
        groups: groupStats[0] || { total_groups: 0 },
      },
    });
  } catch (err) {
    console.error("Error fetching instructor stats:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
});

import { getProjectById } from "../controllers/instructorController.js";

router.get("/projects/:id", getProjectById);

export default router;