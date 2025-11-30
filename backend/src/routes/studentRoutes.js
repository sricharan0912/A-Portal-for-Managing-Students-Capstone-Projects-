import express from "express";
import jwt from "jsonwebtoken";
import db from "../../db.js";
import { auth } from "../../firebaseAdmin.js";
import { verifyToken, verifyRole } from "../middleware/authMiddleware.js";
import { validateStudentSignup, validateStudentLogin } from "../middleware/validateRequest.js";

const router = express.Router();

const generateJWT = (uid, email, role, studentId) => {
  return jwt.sign(
    { uid, email, role, studentId },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );
};

// ==================== AUTHENTICATION ====================

// Student Signup with Firebase
router.post("/signup", validateStudentSignup, async (req, res) => {
  try {
    const { email, idToken, first_name, last_name } = req.body;

    // Check if email already exists
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

    // Verify Firebase ID token
    let uid;
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      uid = decodedToken.uid;
    } catch (err) {
      console.error("Firebase token verification failed:", err);
      return res.status(401).json({
        success: false,
        error: "Invalid or expired Firebase token",
      });
    }

    const connection = await db.getConnection();

    try {
      // âœ… NEW SCHEMA: Insert into users table
      const [userResult] = await connection.query(
        "INSERT INTO users (email, firebase_uid, role, email_verified, status) VALUES (?, ?, 'student', 1, 'active')",
        [email, uid]
      );

      const userId = userResult.insertId;

      // âœ… NEW SCHEMA: Insert into user_profiles table
      const fullName = `${first_name} ${last_name}`.trim();
      await connection.query(
        `INSERT INTO user_profiles 
         (user_id, first_name, last_name, full_name) 
         VALUES (?, ?, ?, ?)`,
        [userId, first_name, last_name, fullName]
      );

      connection.release();

      // Generate JWT token
      const token = generateJWT(uid, email, "student", userId);

      // âœ… BACKWARDS COMPATIBLE RESPONSE
      res.status(201).json({
        success: true,
        message: "Student registered successfully",
        token,
        student: {
          id: userId,           // Numeric ID
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

// Student Login with Firebase
router.post("/login", validateStudentLogin, async (req, res) => {
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

    // âœ… NEW SCHEMA: Query users + user_profiles
    const [students] = await db.query(
      `SELECT u.id, u.email, u.role,
              p.first_name, p.last_name, p.full_name
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.email = ? AND u.role = 'student' AND u.deleted_at IS NULL`,
      [email]
    );

    if (students.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Student account not found. Please sign up first.",
      });
    }

    const student = students[0];
    const studentId = student.id;

    // Update last_login_at
    await db.query(
      "UPDATE users SET last_login_at = NOW() WHERE id = ?",
      [studentId]
    );

    // Generate JWT token
    const token = generateJWT(uid, email, "student", studentId);

    // âœ… BACKWARDS COMPATIBLE RESPONSE
    res.json({
      success: true,
      message: "Login successful",
      token,
      student: {
        id: studentId,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
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

// ==================== STATIC ROUTES (MUST BE BEFORE PARAMETERIZED ROUTES) ====================

// âœ… Get all students (for instructor/admin to view all students)
// IMPORTANT: This MUST come before /:student_id routes
router.get("/", verifyToken, verifyRole(["instructor", "admin"]), async (req, res) => {
  try {
    // âœ… NEW SCHEMA: Query users + user_profiles
    const [students] = await db.query(
      `SELECT u.id, u.email, u.created_at,
              p.first_name, p.last_name, p.full_name
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.role = 'student' AND u.deleted_at IS NULL
       ORDER BY u.created_at DESC`
    );

    // Format for backwards compatibility
    const formattedStudents = students.map(student => ({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      created_at: student.created_at,
    }));

    res.json({
      success: true,
      data: formattedStudents,
    });
  } catch (err) {
    console.error("Error fetching all students:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch students",
    });
  }
});

// Get all available projects for students to browse (PUBLIC)
// IMPORTANT: This MUST come before /:student_id routes
router.get("/projects", async (req, res) => {
  try {
    // ✅ Query projects that have been approved by instructor
    const [projects] = await db.query(
      `SELECT 
         id,
         owner_id as client_id,
         title,
         description,
         required_skills as skills_required,
         category,
         max_team_size as team_size,
         start_date,
         end_date,
         difficulty_level as complexity_level,
         deliverables,
         location as project_location,
         industry_category as industry,
         status,
         approval_status,
         created_at
       FROM projects 
       WHERE approval_status = 'approved' 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: projects,
    });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
    });
  }
});

// ==================== PARAMETERIZED ROUTES (AFTER STATIC ROUTES) ====================

// ==================== STUDENT PROFILE ====================

// Get student profile (PROTECTED)
router.get("/:student_id", verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (isNaN(student_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID format",
      });
    }

    // Allow students to view their own profile, or instructors/admins to view any profile
    if (
      parseInt(student_id) !== req.user.studentId && 
      req.user.role !== "instructor" && 
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    // âœ… NEW SCHEMA: Query users + user_profiles
    const [students] = await db.query(
      `SELECT u.id, u.email, u.created_at,
              p.first_name, p.last_name, p.full_name
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ? AND u.role = 'student' AND u.deleted_at IS NULL`,
      [parseInt(student_id)]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Student not found",
      });
    }

    const student = students[0];

    res.json({
      success: true,
      data: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        created_at: student.created_at,
      },
    });
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch student profile",
    });
  }
});

// Update student profile (PROTECTED)
router.put("/:student_id", verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;
    const { first_name, last_name, email } = req.body;

    if (isNaN(student_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID format",
      });
    }

    // Only students can update their own profile, or admins
    if (parseInt(student_id) !== req.user.studentId && req.user.role !== "admin") {
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

    // Check if email already exists (excluding current student)
    const [existingEmail] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL",
      [email, parseInt(student_id)]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Email already in use",
      });
    }

    const connection = await db.getConnection();

    try {
      // âœ… NEW SCHEMA: Update users table
      await connection.query(
        "UPDATE users SET email = ? WHERE id = ?",
        [email, parseInt(student_id)]
      );

      // âœ… NEW SCHEMA: Update user_profiles table
      const fullName = `${first_name} ${last_name}`.trim();
      const [result] = await connection.query(
        "UPDATE user_profiles SET first_name = ?, last_name = ?, full_name = ? WHERE user_id = ?",
        [first_name, last_name, fullName, parseInt(student_id)]
      );

      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Student not found",
        });
      }

      res.json({
        success: true,
        message: "Student profile updated successfully",
      });
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update student profile",
    });
  }
});

// Delete student account (PROTECTED)
router.delete("/:student_id", verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (isNaN(student_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID format",
      });
    }

    // Only students can delete their own account, or admins
    if (parseInt(student_id) !== req.user.studentId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    // âœ… NEW SCHEMA: Soft delete using deleted_at
    const [result] = await db.query(
      "UPDATE users SET deleted_at = NOW(), status = 'inactive' WHERE id = ? AND role = 'student'",
      [parseInt(student_id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Student account deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete student account",
    });
  }
});

// ==================== STUDENT PREFERENCES ====================

// Get student's submitted preferences (PROTECTED)
router.get("/:student_id/preferences", verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (isNaN(student_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID format",
      });
    }

    // Allow students to view their own preferences, or instructors/admins
    if (
      parseInt(student_id) !== req.user.studentId && 
      req.user.role !== "instructor" && 
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    // ✅ Query with correct column name: preference_rank
    const [preferences] = await db.query(
      `SELECT 
         sp.student_id, 
         sp.project_id, 
         sp.preference_rank,
         sp.updated_at,
         p.title, 
         p.description, 
         p.category, 
         p.difficulty_level as complexity_level,
         p.required_skills as skills_required,
         p.max_team_size as team_size,
         p.start_date, 
         p.end_date,
         p.location as project_location,
         p.deliverables, 
         p.industry_category as industry
       FROM student_preferences sp
       JOIN projects p ON sp.project_id = p.id
       WHERE sp.student_id = ?
       ORDER BY sp.preference_rank ASC`,
      [parseInt(student_id)]
    );

    // Get the most recent updated_at timestamp
    const lastUpdated = preferences.length > 0 
      ? preferences.reduce((latest, pref) => 
          pref.updated_at > latest ? pref.updated_at : latest, 
          preferences[0].updated_at
        )
      : null;

    // Get deadline from database
    const [deadlineResult] = await db.query(
      `SELECT setting_value FROM app_settings WHERE setting_key = 'preference_deadline'`
    );
    const deadline = deadlineResult.length > 0 ? deadlineResult[0].setting_value : null;

    res.json({
      success: true,
      data: preferences,
      lastUpdated,
      deadline,
    });
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch preferences",
    });
  }
});

// Submit or update student preferences (PROTECTED)
router.post("/:student_id/preferences", verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;
    const { preferences } = req.body;

    if (isNaN(student_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID format",
      });
    }

    // Only students can submit their own preferences
    if (parseInt(student_id) !== req.user.studentId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    // Check deadline from database
    const [deadlineResult] = await db.query(
      `SELECT setting_value FROM app_settings WHERE setting_key = 'preference_deadline'`
    );
    const deadline = deadlineResult.length > 0 ? deadlineResult[0].setting_value : null;
    
    if (deadline) {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      if (now > deadlineDate) {
        return res.status(400).json({
          success: false,
          error: "The deadline for submitting preferences has passed",
        });
      }
    }

    if (!Array.isArray(preferences) || preferences.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Preferences must be a non-empty array",
      });
    }

    if (preferences.length > 3) {
      return res.status(400).json({
        success: false,
        error: "Maximum 3 preferences allowed",
      });
    }

    for (const pref of preferences) {
      if (!pref.project_id || !pref.preference_rank) {
        return res.status(400).json({
          success: false,
          error: "Each preference must have project_id and preference_rank",
        });
      }
    }

    // Validate all projects exist
    for (const pref of preferences) {
      const [project] = await db.query(
        "SELECT id FROM projects WHERE id = ?",
        [pref.project_id]
      );

      if (project.length === 0) {
        return res.status(400).json({
          success: false,
          error: `Project with ID ${pref.project_id} not found`,
        });
      }
    }

    const connection = await db.getConnection();

    try {
      // Delete existing preferences
      await connection.query(
        "DELETE FROM student_preferences WHERE student_id = ?",
        [parseInt(student_id)]
      );

      // ✅ Insert with correct column name: preference_rank
      for (const pref of preferences) {
        await connection.query(
          "INSERT INTO student_preferences (student_id, project_id, preference_rank) VALUES (?, ?, ?)",
          [parseInt(student_id), pref.project_id, pref.preference_rank]
        );
      }

      connection.release();

      res.json({
        success: true,
        message: "Preferences submitted successfully",
        data: {
          student_id: parseInt(student_id),
          preferences_count: preferences.length,
        },
      });
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error submitting preferences:", err);
    res.status(500).json({
      success: false,
      error: "Failed to save preferences",
    });
  }
});

// Clear student preferences (PROTECTED)
router.delete("/:student_id/preferences", verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (isNaN(student_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID format",
      });
    }

    // Only students can clear their own preferences
    if (parseInt(student_id) !== req.user.studentId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    const [result] = await db.query(
      "DELETE FROM student_preferences WHERE student_id = ?",
      [parseInt(student_id)]
    );

    res.json({
      success: true,
      message: "Preferences cleared successfully",
      data: {
        deleted_count: result.affectedRows,
      },
    });
  } catch (err) {
    console.error("Error clearing preferences:", err);
    res.status(500).json({
      success: false,
      error: "Failed to clear preferences",
    });
  }
});

// ==================== GROUP ====================

// Get student's assigned group (PROTECTED)
router.get("/:student_id/group", verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (isNaN(student_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID format",
      });
    }

    // Allow students to view their own group, or instructors/admins
    if (
      parseInt(student_id) !== req.user.studentId && 
      req.user.role !== "instructor" && 
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    // âœ… NEW SCHEMA: Query with column aliases for backwards compatibility
    const [groupData] = await db.query(
      `SELECT 
         sg.id, 
         sg.group_number, 
         sg.project_id,
         p.id as project_id, 
         p.title, 
         p.description, 
         p.category,
         p.required_skills as skills_required,
         p.difficulty_level as complexity_level,
         p.max_team_size as team_size,
         p.start_date, 
         p.end_date, 
         p.location as project_location,
         p.deliverables, 
         p.industry_category as industry,
         p.status
       FROM group_members gm
       JOIN student_groups sg ON gm.group_id = sg.id
       JOIN projects p ON sg.project_id = p.id
       WHERE gm.student_id = ?`,
      [parseInt(student_id)]
    );

    if (groupData.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: "No group assigned yet",
      });
    }

    res.json({
      success: true,
      data: groupData[0],
    });
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch group",
    });
  }
});

// Get all group members for a student's group (PROTECTED)
router.get("/:student_id/group/members", verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (isNaN(student_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid student ID format",
      });
    }

    // Allow students to view their own group members, or instructors/admins
    if (
      parseInt(student_id) !== req.user.studentId && 
      req.user.role !== "instructor" && 
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    const [groupData] = await db.query(
      `SELECT gm.group_id FROM group_members gm WHERE gm.student_id = ?`,
      [parseInt(student_id)]
    );

    if (groupData.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "Student not assigned to a group",
      });
    }

    const groupId = groupData[0].group_id;

    // âœ… NEW SCHEMA: Query users + user_profiles for group members
    const [members] = await db.query(
      `SELECT gm.student_id, p.first_name, p.last_name, u.email 
       FROM group_members gm
       JOIN users u ON gm.student_id = u.id
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE gm.group_id = ?
       ORDER BY p.first_name ASC`,
      [groupId]
    );

    res.json({
      success: true,
      data: members,
    });
  } catch (err) {
    console.error("Error fetching group members:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch group members",
    });
  }
});

export default router; 
