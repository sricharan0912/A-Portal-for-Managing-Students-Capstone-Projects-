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
router.post("/signup", validateInstructorSignup, async (req, res) => {
  try {
    const { email, first_name, last_name, idToken } = req.body;

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

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
    const connection = await db.getConnection();

    try {
      const [userResult] = await connection.query(
        "INSERT INTO users (email, firebase_uid, role, email_verified, status) VALUES (?, ?, 'instructor', 1, 'active')",
        [email, uid]
      );

      const userId = userResult.insertId;
      const fullName = `${first_name} ${last_name}`.trim();
      await connection.query(
        `INSERT INTO user_profiles 
         (user_id, first_name, last_name, full_name, department) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, first_name, last_name, fullName, null]
      );

      connection.release();

      const token = generateJWT(uid, email, "instructor", userId);

      res.status(201).json({
        success: true,
        message: "Instructor registered successfully",
        token,
        instructor: {
          id: userId,
          first_name,
          last_name,
          email,
        },
      });
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Signup error:", err);

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

    const [instructors] = await db.query(
      `SELECT u.id, u.email, u.role,
              p.first_name, p.last_name, p.full_name, p.department
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.email = ? AND u.role = 'instructor' AND u.deleted_at IS NULL`,
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

    await db.query(
      "UPDATE users SET last_login_at = NOW() WHERE id = ?",
      [instructorId]
    );

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
        department: instructor.department,
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

// ==================== SETTINGS ====================

// Get all settings (PROTECTED - instructors only)
router.get("/settings/all", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    const [settings] = await db.query(
      `SELECT setting_key, setting_value, description, updated_at 
       FROM app_settings`
    );

    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.setting_key] = {
        value: s.setting_value,
        description: s.description,
        updated_at: s.updated_at,
      };
    });

    res.json({
      success: true,
      data: settingsObj,
    });
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch settings",
    });
  }
});

// Get preference deadline (PUBLIC - students need this)
router.get("/settings/preference-deadline", async (req, res) => {
  try {
    const [settings] = await db.query(
      `SELECT setting_value FROM app_settings WHERE setting_key = 'preference_deadline'`
    );

    res.json({
      success: true,
      data: {
        deadline: settings.length > 0 ? settings[0].setting_value : null,
      },
    });
  } catch (err) {
    console.error("Error fetching deadline:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch deadline",
    });
  }
});

// Update a setting (PROTECTED - instructors only)
router.put("/settings/:key", verifyToken, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    const allowedSettings = ["preference_deadline"];
    if (!allowedSettings.includes(key)) {
      return res.status(400).json({
        success: false,
        error: "Invalid setting key",
      });
    }

    if (key === "preference_deadline" && value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Invalid date format",
        });
      }
    }

    const [result] = await db.query(
      `UPDATE app_settings 
       SET setting_value = ?, updated_by = ?
       WHERE setting_key = ?`,
      [value || null, req.user.instructorId, key]
    );

    if (result.affectedRows === 0) {
      await db.query(
        `INSERT INTO app_settings (setting_key, setting_value, updated_by) 
         VALUES (?, ?, ?)`,
        [key, value || null, req.user.instructorId]
      );
    }

    res.json({
      success: true,
      message: "Setting updated successfully",
    });
  } catch (err) {
    console.error("Error updating setting:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update setting",
    });
  }
});

// ==================== INSTRUCTOR PROFILE ====================

// Get instructor profile (PROTECTED)
router.get("/:instructor_id", verifyToken, async (req, res) => {
  try {
    const { instructor_id } = req.params;

    if (isNaN(instructor_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid instructor ID format",
      });
    }

    if (parseInt(instructor_id) !== req.user.instructorId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    const [instructors] = await db.query(
      `SELECT u.id, u.email, u.created_at,
              p.first_name, p.last_name, p.full_name, p.department
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ? AND u.role = 'instructor' AND u.deleted_at IS NULL`,
      [parseInt(instructor_id)]
    );

    if (instructors.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Instructor not found",
      });
    }

    const instructor = instructors[0];

    res.json({
      success: true,
      data: {
        id: instructor.id,
        first_name: instructor.first_name,
        last_name: instructor.last_name,
        email: instructor.email,
        department: instructor.department,
        created_at: instructor.created_at,
      },
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
    const { first_name, last_name, email, department } = req.body;

    if (isNaN(instructor_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid instructor ID format",
      });
    }

    if (parseInt(instructor_id) !== req.user.instructorId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        error: "First name, last name, and email are required",
      });
    }

    const [existingEmail] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL",
      [email, parseInt(instructor_id)]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Email already in use",
      });
    }

    const connection = await db.getConnection();

    try {
      await connection.query(
        "UPDATE users SET email = ? WHERE id = ?",
        [email, parseInt(instructor_id)]
      );

      const fullName = `${first_name} ${last_name}`.trim();
      const [result] = await connection.query(
        "UPDATE user_profiles SET first_name = ?, last_name = ?, full_name = ?, department = ? WHERE user_id = ?",
        [first_name, last_name, fullName, department || null, parseInt(instructor_id)]
      );

      connection.release();

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
      connection.release();
      throw err;
    }
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

    if (isNaN(instructor_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid instructor ID format",
      });
    }

    if (parseInt(instructor_id) !== req.user.instructorId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    const [result] = await db.query(
      "UPDATE users SET deleted_at = NOW(), status = 'inactive' WHERE id = ? AND role = 'instructor'",
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

    if (isNaN(instructor_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid instructor ID format",
      });
    }

    if (parseInt(instructor_id) !== req.user.instructorId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    const [studentStats] = await db.query(
      `SELECT COUNT(*) as total_students 
       FROM users 
       WHERE role = 'student' AND deleted_at IS NULL`
    );

    const [projectStats] = await db.query(
      `SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_projects,
        SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_projects,
        SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected_projects
       FROM projects`
    );

    const [groupStats] = await db.query(
      `SELECT COUNT(DISTINCT id) as total_groups FROM student_groups`
    );

    res.json({
      success: true,
      data: {
        students: studentStats[0] || { total_students: 0 },
        projects: projectStats[0] || {
          total_projects: 0,
          pending_projects: 0,
          approved_projects: 0,
          rejected_projects: 0,
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

// ==================== INSTRUCTOR PROJECT DETAILS ====================

// Get a single project by ID (for instructor "View Details")
router.get("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [projects] = await db.query(
      `SELECT 
         p.id,
         p.title,
         p.description,
         p.status,
         p.posted_date as created_at,
         up.first_name AS client_first_name,
         up.last_name AS client_last_name,
         u.email AS client_email
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE p.id = ?`,
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const project = projects[0];

    res.json({
      success: true,
      data: {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        created_at: project.created_at,
        client_first_name: project.client_first_name,
        client_last_name: project.client_last_name,
        client_email: project.client_email,
      },
    });
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch project",
    });
  }
});

export default router;