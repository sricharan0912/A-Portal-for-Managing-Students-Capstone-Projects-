/**
 * Instructor Routes Module
 * 
 * Handles all instructor-related API endpoints including authentication, profile management,
 * course settings, student management, group formation, and dashboard statistics.
 * 
 * Routes are organized by functionality:
 * 1. Authentication (signup, login)
 * 2. Settings Management (preference deadline, course configuration)
 * 3. Student Management (add students, view all students)
 * 4. Group Formation (auto-assign, preview, manual management)
 * 5. Instructor Profile (CRUD operations)
 * 6. Dashboard Statistics
 * 
 * IMPORTANT: Group-related routes MUST be defined BEFORE /:instructor_id routes
 * to prevent Express from treating "groups" as an instructor ID parameter.
 * 
 * @module routes/instructorRoutes
 * @requires express
 * @requires jsonwebtoken
 * @requires ../../db
 * @requires ../../firebaseAdmin
 * @requires ../middleware/authMiddleware
 * @requires ../middleware/validateRequest
 * @requires ./groupAlgorithmRoutes
 */

import express from "express";
import jwt from "jsonwebtoken";
import db from "../../db.js";
import { auth } from "../../firebaseAdmin.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { validateInstructorSignup, validateInstructorLogin } from "../middleware/validateRequest.js";
import { runGroupFormationAlgorithm } from "./groupAlgorithmRoutes.js";

const router = express.Router();

/**
 * Generate JWT Token for Instructor
 * 
 * Creates a signed JWT token containing instructor authentication data.
 * Token expires in 7 days.
 * 
 * @function generateJWT
 * @param {string} uid - Firebase user ID
 * @param {string} email - Instructor email address
 * @param {string} role - User role (should be 'instructor')
 * @param {number} instructorId - Numeric database instructor ID
 * @returns {string} Signed JWT token
 * 
 * @example
 * const token = generateJWT('firebase-uid-123', 'prof@university.edu', 'instructor', 42);
 */
const generateJWT = (uid, email, role, instructorId) => {
  return jwt.sign(
    { uid, email, role, instructorId },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );
};

/**
 * Generate Temporary Password
 * 
 * Creates a random temporary password for student accounts.
 * Uses alphanumeric characters excluding ambiguous ones (0, O, I, l).
 * 
 * @function generateTempPassword
 * @param {number} length - Password length (default: 10)
 * @returns {string} Random temporary password
 * 
 * @example
 * const tempPass = generateTempPassword(12);
 * // Returns something like: "aB3xK9mPqR2w"
 */
function generateTempPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ==================== AUTHENTICATION ====================

/**
 * Instructor Signup with Firebase
 * 
 * Registers a new instructor account with Firebase authentication.
 * Creates entries in both users and user_profiles tables.
 * 
 * @route POST /instructors/signup
 * @group Authentication - Instructor authentication operations
 * @param {string} email.body.required - Instructor email address
 * @param {string} first_name.body.required - Instructor first name
 * @param {string} last_name.body.required - Instructor last name
 * @param {string} idToken.body.required - Firebase ID token
 * @returns {object} 201 - Success response with token and instructor data
 * @returns {object} 400 - Email already registered
 * @returns {object} 401 - Invalid Firebase token
 * @returns {object} 500 - Server error
 * 
 * @example
 * POST /instructors/signup
 * {
 *   "email": "prof.smith@university.edu",
 *   "first_name": "Jane",
 *   "last_name": "Smith",
 *   "idToken": "firebase-id-token..."
 * }
 */
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

/**
 * Instructor Login with Firebase
 * 
 * Authenticates an existing instructor using Firebase ID token.
 * Updates last login timestamp and returns JWT token.
 * 
 * @route POST /instructors/login
 * @group Authentication - Instructor authentication operations
 * @param {string} email.body.required - Instructor email address
 * @param {string} idToken.body.required - Firebase ID token
 * @returns {object} 200 - Success response with token and instructor data
 * @returns {object} 401 - Invalid credentials or token
 * @returns {object} 500 - Server error
 * 
 * @example
 * POST /instructors/login
 * {
 *   "email": "prof.smith@university.edu",
 *   "idToken": "firebase-id-token..."
 * }
 */
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

/**
 * Get All Settings
 * 
 * Retrieves all application settings from the app_settings table.
 * Protected route - only instructors and admins can access.
 * 
 * @route GET /instructors/settings/all
 * @group Settings - Course configuration operations
 * @security JWT
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with settings object
 * @returns {object} 403 - Unauthorized access
 * @returns {object} 500 - Server error
 * 
 * @example
 * GET /instructors/settings/all
 * Authorization: Bearer <token>
 */
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

/**
 * Get Preference Deadline
 * 
 * Retrieves the student preference submission deadline.
 * Public route - students need this to check if they can still submit preferences.
 * 
 * @route GET /instructors/settings/preference-deadline
 * @group Settings - Course configuration operations
 * @returns {object} 200 - Success response with deadline value
 * @returns {object} 500 - Server error
 * 
 * @example
 * GET /instructors/settings/preference-deadline
 * Response: { "success": true, "data": { "deadline": "2025-01-15T23:59:59Z" } }
 */
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

/**
 * Update Setting
 * 
 * Updates a specific application setting.
 * Protected route - only instructors and admins can modify settings.
 * Currently supports: preference_deadline
 * 
 * @route PUT /instructors/settings/:key
 * @group Settings - Course configuration operations
 * @security JWT
 * @param {string} key.path.required - Setting key (e.g., "preference_deadline")
 * @param {string} value.body.required - New setting value
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response
 * @returns {object} 400 - Invalid setting key or value format
 * @returns {object} 403 - Unauthorized access
 * @returns {object} 500 - Server error
 * 
 * @example
 * PUT /instructors/settings/preference_deadline
 * {
 *   "value": "2025-01-15T23:59:59Z"
 * }
 */
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

// ==================== ADD STUDENT (INSTRUCTOR) ====================

/**
 * Add Student with Temporary Password
 * 
 * Allows instructors to manually add students to the system.
 * Creates a Firebase account with a temporary password and database entries.
 * Protected route - only instructors and admins can add students.
 * 
 * @route POST /instructors/add-student
 * @group Student Management - Student administration operations
 * @security JWT
 * @param {string} first_name.body.required - Student first name
 * @param {string} last_name.body.required - Student last name
 * @param {string} email.body.required - Student email address
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 201 - Success response with student data and temporary password
 * @returns {object} 400 - Validation error or email already exists
 * @returns {object} 403 - Access denied (not instructor)
 * @returns {object} 500 - Server error
 * 
 * @example
 * POST /instructors/add-student
 * {
 *   "first_name": "John",
 *   "last_name": "Doe",
 *   "email": "john.doe@university.edu"
 * }
 * Response includes tempPassword that should be shared with the student
 */
router.post("/add-student", verifyToken, async (req, res) => {
  try {
    // Verify instructor role
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Instructor role required.",
      });
    }

    const { first_name, last_name, email } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        error: "First name, last name, and email are required",
      });
    }

    // Check if email already exists in database
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: "A user with this email already exists",
      });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword(10);

    // Create Firebase user with temporary password
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        email: email.trim().toLowerCase(),
        password: tempPassword,
        displayName: `${first_name} ${last_name}`.trim(),
        emailVerified: false,
      });
    } catch (firebaseErr) {
      console.error("Firebase user creation failed:", firebaseErr);
      
      // Handle specific Firebase errors
      if (firebaseErr.code === 'auth/email-already-exists') {
        return res.status(400).json({
          success: false,
          error: "This email is already registered in Firebase. The student may need to reset their password.",
        });
      }
      
      return res.status(500).json({
        success: false,
        error: "Failed to create Firebase account: " + firebaseErr.message,
      });
    }

    const connection = await db.getConnection();

    try {
      // Insert into users table
      const [userResult] = await connection.query(
        `INSERT INTO users (email, firebase_uid, role, email_verified, status, created_at) 
         VALUES (?, ?, 'student', 0, 'active', NOW())`,
        [email.trim().toLowerCase(), firebaseUser.uid]
      );

      const userId = userResult.insertId;

      // Insert into user_profiles table
      const fullName = `${first_name} ${last_name}`.trim();
      await connection.query(
        `INSERT INTO user_profiles 
         (user_id, first_name, last_name, full_name) 
         VALUES (?, ?, ?, ?)`,
        [userId, first_name.trim(), last_name.trim(), fullName]
      );

      connection.release();

      console.log(`✅ Student added by instructor: ${email}`);

      res.status(201).json({
        success: true,
        message: "Student added successfully",
        tempPassword: tempPassword,
        student: {
          id: userId,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email.trim().toLowerCase(),
        },
      });

    } catch (dbErr) {
      connection.release();
      
      // If database insert fails, try to delete the Firebase user we created
      try {
        await auth.deleteUser(firebaseUser.uid);
      } catch (deleteErr) {
        console.error("Failed to cleanup Firebase user:", deleteErr);
      }
      
      throw dbErr;
    }

  } catch (err) {
    console.error("Error adding student:", err);
    
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        error: "This email is already registered",
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Failed to add student: " + err.message,
    });
  }
});

// ==================== GROUP FORMATION ====================
// NOTE: These routes MUST be defined BEFORE /:instructor_id routes
// to prevent Express from treating "groups" as an instructor ID

/**
 * Get Unassigned Students
 * 
 * Retrieves all students who are not currently assigned to any group.
 * Protected route - only instructors and admins can access.
 * 
 * @route GET /instructors/unassigned-students
 * @group Group Formation - Group management operations
 * @security JWT
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with unassigned students array
 * @returns {object} 403 - Access denied
 * @returns {object} 500 - Server error
 * 
 * @example
 * GET /instructors/unassigned-students
 * Authorization: Bearer <token>
 */
router.get("/unassigned-students", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Instructor role required.",
      });
    }

    // Get all students who are NOT in any group
    const [unassignedStudents] = await db.query(`
      SELECT 
        u.id,
        u.email,
        up.first_name,
        up.last_name,
        up.full_name,
        CASE 
          WHEN up.full_name IS NOT NULL AND up.full_name != '' THEN up.full_name
          WHEN up.first_name IS NOT NULL OR up.last_name IS NOT NULL THEN TRIM(CONCAT(COALESCE(up.first_name, ''), ' ', COALESCE(up.last_name, '')))
          ELSE u.email
        END as name
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.role = 'student' 
        AND u.deleted_at IS NULL
        AND u.id NOT IN (SELECT student_id FROM group_members)
      ORDER BY up.first_name ASC
    `);

    res.json({
      success: true,
      data: unassignedStudents,
    });
  } catch (err) {
    console.error("Error fetching unassigned students:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch unassigned students",
    });
  }
});

/**
 * Get All Students with Group Status
 * 
 * Retrieves all students with their current group assignment status.
 * Used for manual group creation and management.
 * Protected route - only instructors and admins can access.
 * 
 * @route GET /instructors/all-students
 * @group Student Management - Student administration operations
 * @security JWT
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with students array including group_id
 * @returns {object} 403 - Access denied
 * @returns {object} 500 - Server error
 * 
 * @example
 * GET /instructors/all-students
 * Authorization: Bearer <token>
 */
router.get("/all-students", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Instructor role required.",
      });
    }

    // Get all students with their group assignment (if any)
    const [students] = await db.query(`
      SELECT 
        u.id,
        u.email,
        up.first_name,
        up.last_name,
        up.full_name,
        CASE 
          WHEN up.full_name IS NOT NULL AND up.full_name != '' THEN up.full_name
          WHEN up.first_name IS NOT NULL OR up.last_name IS NOT NULL THEN TRIM(CONCAT(COALESCE(up.first_name, ''), ' ', COALESCE(up.last_name, '')))
          ELSE u.email
        END as name,
        gm.group_id
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN group_members gm ON u.id = gm.student_id
      WHERE u.role = 'student' 
        AND u.deleted_at IS NULL
      ORDER BY up.first_name ASC
    `);

    res.json({
      success: true,
      data: students,
    });
  } catch (err) {
    console.error("Error fetching all students:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch students",
    });
  }
});

/**
 * Get All Groups
 * 
 * Retrieves all student groups with their members and project assignments.
 * Includes preference rank information for each member.
 * Protected route - only instructors and admins can access.
 * 
 * @route GET /instructors/groups
 * @group Group Formation - Group management operations
 * @security JWT
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with groups array
 * @returns {object} 403 - Access denied
 * @returns {object} 500 - Server error
 * 
 * @example
 * GET /instructors/groups
 * Authorization: Bearer <token>
 */
router.get("/groups", verifyToken, async (req, res) => {
  try {
    // Verify instructor role
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Instructor role required.",
      });
    }

    // Fetch all groups with project info
    const [groups] = await db.query(`
      SELECT 
        sg.id,
        sg.group_name as name,
        sg.project_id,
        sg.status,
        sg.created_at,
        p.title as project_title,
        p.category as project_category
      FROM student_groups sg
      LEFT JOIN projects p ON sg.project_id = p.id
      ORDER BY sg.created_at DESC
    `);

    // Fetch members for each group
    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const [members] = await db.query(`
          SELECT 
            gm.student_id,
            up.full_name as student_name,
            u.email as student_email,
            sp.preference_rank
          FROM group_members gm
          JOIN users u ON gm.student_id = u.id
          LEFT JOIN user_profiles up ON u.id = up.user_id
          LEFT JOIN student_preferences sp ON sp.student_id = gm.student_id AND sp.project_id = ?
          WHERE gm.group_id = ?
        `, [group.project_id, group.id]);

        return {
          ...group,
          members,
          member_count: members.length
        };
      })
    );

    res.json({
      success: true,
      data: groupsWithMembers,
    });
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch groups",
    });
  }
});

/**
 * Auto-Assign Groups (Run Algorithm)
 * 
 * Executes the group formation algorithm to automatically assign students to projects.
 * Clears existing groups and creates new assignments based on student preferences.
 * Uses the greedy optimization algorithm from groupFormationAlgorithm module.
 * Protected route - only instructors and admins can execute.
 * 
 * @route POST /instructors/auto-assign-groups
 * @group Group Formation - Group management operations
 * @security JWT
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with algorithm results and statistics
 * @returns {object} 400 - No approved projects or validation error
 * @returns {object} 403 - Access denied
 * @returns {object} 500 - Server error
 * 
 * @example
 * POST /instructors/auto-assign-groups
 * Authorization: Bearer <token>
 */
router.post("/auto-assign-groups", verifyToken, async (req, res) => {
  try {
    // Verify instructor role
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Instructor role required.",
      });
    }

    // 1. Fetch all students with their preferences
    const [studentsData] = await db.query(`
      SELECT 
        u.id,
        up.full_name as name,
        u.email
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      WHERE u.role = 'student'
    `);

    // Fetch preferences for each student
    const students = await Promise.all(
      studentsData.map(async (student) => {
        const [prefs] = await db.query(`
          SELECT project_id, preference_rank
          FROM student_preferences
          WHERE student_id = ?
          ORDER BY preference_rank ASC
        `, [student.id]);

        return {
          id: student.id,
          name: student.name || student.email,
          preferences: prefs.map(p => p.project_id)
        };
      })
    );

    // 2. Fetch all approved projects
    const [projects] = await db.query(`
      SELECT 
        id,
        title,
        max_team_size
      FROM projects
      WHERE approval_status = 'approved'
    `);

    if (projects.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No approved projects available for assignment",
      });
    }

    // 3. Run the algorithm
    const result = runGroupFormationAlgorithm(students, projects);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // 4. Clear existing groups (optional - could make this configurable)
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Clear existing group members and groups
      await connection.query("DELETE FROM group_members");
      await connection.query("DELETE FROM student_groups");

      // 5. Create new groups in database
      for (const group of result.groups) {
        // Create the group
        const [groupResult] = await connection.query(
          `INSERT INTO student_groups (group_name, project_id, status, created_at)
           VALUES (?, ?, 'active', NOW())`,
          [`Group - ${group.project_title}`, group.project_id]
        );

        const groupId = groupResult.insertId;

        // Add members to the group
        for (const member of group.members) {
          await connection.query(
            `INSERT INTO group_members (group_id, student_id, joined_at)
             VALUES (?, ?, NOW())`,
            [groupId, member.id]
          );
        }
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: "Groups formed successfully",
        data: result,
      });

    } catch (dbError) {
      await connection.rollback();
      connection.release();
      throw dbError;
    }

  } catch (err) {
    console.error("Error in auto-assign groups:", err);
    res.status(500).json({
      success: false,
      error: "Failed to run group formation: " + err.message,
    });
  }
});

/**
 * Preview Group Formation
 * 
 * Runs the group formation algorithm without saving results to the database.
 * Allows instructors to preview assignments before committing.
 * Protected route - only instructors and admins can execute.
 * 
 * @route POST /instructors/preview-groups
 * @group Group Formation - Group management operations
 * @security JWT
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with preview results and statistics
 * @returns {object} 400 - No approved projects available
 * @returns {object} 403 - Access denied
 * @returns {object} 500 - Server error
 * 
 * @example
 * POST /instructors/preview-groups
 * Authorization: Bearer <token>
 */
router.post("/preview-groups", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Instructor role required.",
      });
    }

    // 1. Fetch all students with their preferences
    const [studentsData] = await db.query(`
      SELECT 
        u.id,
        up.full_name as name,
        u.email
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      WHERE u.role = 'student' AND u.deleted_at IS NULL
    `);

    // Fetch preferences for each student
    const students = await Promise.all(
      studentsData.map(async (student) => {
        const [prefs] = await db.query(`
          SELECT project_id, preference_rank
          FROM student_preferences
          WHERE student_id = ?
          ORDER BY preference_rank ASC
        `, [student.id]);

        return {
          id: student.id,
          name: student.name || student.email,
          preferences: prefs.map(p => p.project_id)
        };
      })
    );

    // 2. Fetch all approved projects
    const [projects] = await db.query(`
      SELECT 
        id,
        title,
        max_team_size
      FROM projects
      WHERE approval_status = 'approved'
    `);

    if (projects.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No approved projects available for assignment",
      });
    }

    // 3. Run the algorithm (preview only - don't save)
    const result = runGroupFormationAlgorithm(students, projects);

    res.json({
      success: true,
      preview: true,
      data: result,
    });

  } catch (err) {
    console.error("Error in preview groups:", err);
    res.status(500).json({
      success: false,
      error: "Failed to preview group formation: " + err.message,
    });
  }
});

/**
 * Clear All Groups
 * 
 * Deletes all student groups and group memberships from the database.
 * Uses transaction to ensure data integrity.
 * Protected route - only instructors and admins can execute.
 * 
 * @route DELETE /instructors/groups
 * @group Group Formation - Group management operations
 * @security JWT
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response
 * @returns {object} 403 - Access denied
 * @returns {object} 500 - Server error
 * 
 * @example
 * DELETE /instructors/groups
 * Authorization: Bearer <token>
 */
router.delete("/groups", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Instructor role required.",
      });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query("DELETE FROM group_members");
      await connection.query("DELETE FROM student_groups");
      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: "All groups cleared successfully",
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error clearing groups:", err);
    res.status(500).json({
      success: false,
      error: "Failed to clear groups",
    });
  }
});

/**
 * Get Specific Group by ID
 * 
 * Retrieves detailed information for a specific group including members,
 * project details, and student preference ranks.
 * Protected route - only instructors and admins can access.
 * 
 * @route GET /instructors/groups/:group_id
 * @group Group Formation - Group management operations
 * @security JWT
 * @param {number} group_id.path.required - Group ID
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with group details and members
 * @returns {object} 403 - Access denied
 * @returns {object} 404 - Group not found
 * @returns {object} 500 - Server error
 * 
 * @example
 * GET /instructors/groups/5
 * Authorization: Bearer <token>
 */
router.get("/groups/:group_id", verifyToken, async (req, res) => {
  try {
    const { group_id } = req.params;

    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Instructor role required.",
      });
    }

    const [groups] = await db.query(`
      SELECT 
        sg.id,
        sg.group_name as name,
        sg.project_id,
        sg.status,
        sg.created_at,
        p.title as project_title,
        p.description as project_description,
        p.category as project_category
      FROM student_groups sg
      LEFT JOIN projects p ON sg.project_id = p.id
      WHERE sg.id = ?
    `, [group_id]);

    if (groups.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    const group = groups[0];

    // Fetch members
    const [members] = await db.query(`
      SELECT 
        gm.student_id,
        up.full_name as student_name,
        u.email as student_email,
        sp.preference_rank,
        gm.joined_at
      FROM group_members gm
      JOIN users u ON gm.student_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN student_preferences sp ON sp.student_id = gm.student_id AND sp.project_id = ?
      WHERE gm.group_id = ?
    `, [group.project_id, group_id]);

    res.json({
      success: true,
      data: {
        ...group,
        members,
        member_count: members.length
      },
    });
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch group",
    });
  }
});

// ==================== INSTRUCTOR PROFILE ====================

/**
 * Remove Student from Group
 * 
 * Removes a specific student from a group.
 * Protected route - only instructors and admins can execute.
 * 
 * @route DELETE /instructors/groups/:group_id/members/:student_id
 * @group Group Formation - Group management operations
 * @security JWT
 * @param {number} group_id.path.required - Group ID
 * @param {number} student_id.path.required - Student ID
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with remaining member count
 * @returns {object} 400 - Invalid ID format
 * @returns {object} 403 - Access denied
 * @returns {object} 404 - Student not in group
 * @returns {object} 500 - Server error
 * 
 * @example
 * DELETE /instructors/groups/5/members/42
 * Authorization: Bearer <token>
 */
router.delete("/groups/:group_id/members/:student_id", verifyToken, async (req, res) => {
  try {
    const { group_id, student_id } = req.params;

    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Instructor role required.",
      });
    }

    if (isNaN(group_id) || isNaN(student_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid group ID or student ID format",
      });
    }

    // Check if the student is in the group
    const [membership] = await db.query(
      "SELECT * FROM group_members WHERE group_id = ? AND student_id = ?",
      [parseInt(group_id), parseInt(student_id)]
    );

    if (membership.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Student is not a member of this group",
      });
    }

    // Remove the student from the group
    await db.query(
      "DELETE FROM group_members WHERE group_id = ? AND student_id = ?",
      [parseInt(group_id), parseInt(student_id)]
    );

    // Check remaining members count
    const [remainingMembers] = await db.query(
      "SELECT COUNT(*) as count FROM group_members WHERE group_id = ?",
      [parseInt(group_id)]
    );

    console.log(`✅ Student ${student_id} removed from group ${group_id}`);

    res.json({
      success: true,
      message: "Student removed from group successfully",
      data: {
        group_id: parseInt(group_id),
        student_id: parseInt(student_id),
        remaining_members: remainingMembers[0].count,
      },
    });
  } catch (err) {
    console.error("Error removing student from group:", err);
    res.status(500).json({
      success: false,
      error: "Failed to remove student from group",
    });
  }
});

/**
 * Add Student to Group
 * 
 * Manually adds a student to a specific group.
 * Validates that student exists and is not already in another group.
 * Protected route - only instructors and admins can execute.
 * 
 * @route POST /instructors/groups/:group_id/members
 * @group Group Formation - Group management operations
 * @security JWT
 * @param {number} group_id.path.required - Group ID
 * @param {number} student_id.body.required - Student ID to add
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 201 - Success response
 * @returns {object} 400 - Invalid ID format or student already in a group
 * @returns {object} 403 - Access denied
 * @returns {object} 404 - Student or group not found
 * @returns {object} 500 - Server error
 * 
 * @example
 * POST /instructors/groups/5/members
 * {
 *   "student_id": 42
 * }
 */
router.post("/groups/:group_id/members", verifyToken, async (req, res) => {
  try {
    const { group_id } = req.params;
    const { student_id } = req.body;

    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Instructor role required.",
      });
    }

    if (isNaN(group_id) || isNaN(student_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid group ID or student ID format",
      });
    }

    // Check if student exists
    const [student] = await db.query(
      "SELECT id FROM users WHERE id = ? AND role = 'student' AND deleted_at IS NULL",
      [parseInt(student_id)]
    );

    if (student.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Student not found",
      });
    }

    // Check if group exists
    const [group] = await db.query(
      "SELECT id FROM student_groups WHERE id = ?",
      [parseInt(group_id)]
    );

    if (group.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Check if student is already in a group
    const [existingMembership] = await db.query(
      "SELECT group_id FROM group_members WHERE student_id = ?",
      [parseInt(student_id)]
    );

    if (existingMembership.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Student is already assigned to a group. Remove them first before adding to a new group.",
      });
    }

    // Add student to group
    await db.query(
      "INSERT INTO group_members (group_id, student_id, joined_at) VALUES (?, ?, NOW())",
      [parseInt(group_id), parseInt(student_id)]
    );

    console.log(`✅ Student ${student_id} added to group ${group_id}`);

    res.status(201).json({
      success: true,
      message: "Student added to group successfully",
      data: {
        group_id: parseInt(group_id),
        student_id: parseInt(student_id),
      },
    });
  } catch (err) {
    console.error("Error adding student to group:", err);
    res.status(500).json({
      success: false,
      error: "Failed to add student to group",
    });
  }
});

/**
 * Get Instructor Profile
 * 
 * Retrieves profile information for a specific instructor.
 * Instructors can view their own profile, admins can view any profile.
 * 
 * @route GET /instructors/:instructor_id
 * @group Instructors - Instructor management operations
 * @security JWT
 * @param {number} instructor_id.path.required - Instructor ID
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with instructor data
 * @returns {object} 400 - Invalid instructor ID format
 * @returns {object} 403 - Unauthorized access
 * @returns {object} 404 - Instructor not found
 * @returns {object} 500 - Server error
 * 
 * @example
 * GET /instructors/42
 * Authorization: Bearer <token>
 */
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

/**
 * Update Instructor Profile
 * 
 * Updates instructor profile information including name, email, and department.
 * Only instructors can update their own profile, or admins.
 * 
 * @route PUT /instructors/:instructor_id
 * @group Instructors - Instructor management operations
 * @security JWT
 * @param {number} instructor_id.path.required - Instructor ID
 * @param {string} first_name.body.required - Updated first name
 * @param {string} last_name.body.required - Updated last name
 * @param {string} email.body.required - Updated email address
 * @param {string} department.body - Updated department
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response
 * @returns {object} 400 - Validation error or email already in use
 * @returns {object} 403 - Unauthorized access
 * @returns {object} 404 - Instructor not found
 * @returns {object} 500 - Server error
 * 
 * @example
 * PUT /instructors/42
 * {
 *   "first_name": "Jane",
 *   "last_name": "Smith",
 *   "email": "jane.smith@university.edu",
 *   "department": "Computer Science"
 * }
 */
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

/**
 * Delete Instructor Account
 * 
 * Soft deletes an instructor account (sets deleted_at timestamp and status to inactive).
 * Only instructors can delete their own account, or admins.
 * 
 * @route DELETE /instructors/:instructor_id
 * @group Instructors - Instructor management operations
 * @security JWT
 * @param {number} instructor_id.path.required - Instructor ID
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response
 * @returns {object} 400 - Invalid instructor ID format
 * @returns {object} 403 - Unauthorized access
 * @returns {object} 404 - Instructor not found
 * @returns {object} 500 - Server error
 * 
 * @example
 * DELETE /instructors/42
 * Authorization: Bearer <token>
 */
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

/**
 * Get Instructor Dashboard Statistics
 * 
 * Retrieves comprehensive statistics for the instructor dashboard including:
 * - Total student count
 * - Project counts by approval status
 * - Total group count
 * 
 * Protected route - instructors can view their own stats, admins can view any.
 * 
 * @route GET /instructors/:instructor_id/stats
 * @group Instructors - Instructor dashboard operations
 * @security JWT
 * @param {number} instructor_id.path.required - Instructor ID
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with dashboard statistics
 * @returns {object} 200.data.students - Student statistics
 * @returns {number} 200.data.students.total_students - Total active students
 * @returns {object} 200.data.projects - Project statistics
 * @returns {number} 200.data.projects.total_projects - Total projects
 * @returns {number} 200.data.projects.pending_projects - Projects pending approval
 * @returns {number} 200.data.projects.approved_projects - Approved projects
 * @returns {number} 200.data.projects.rejected_projects - Rejected projects
 * @returns {object} 200.data.groups - Group statistics
 * @returns {number} 200.data.groups.total_groups - Total active groups
 * @returns {object} 400 - Invalid instructor ID format
 * @returns {object} 403 - Unauthorized access
 * @returns {object} 500 - Server error
 * 
 * @example
 * GET /instructors/42/stats
 * Authorization: Bearer <token>
 */
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

/**
 * Get Project by ID
 * 
 * Retrieves detailed information for a specific project including client details.
 * Used by instructors to view project details.
 * 
 * @route GET /instructors/projects/:id
 * @group Projects - Project viewing operations
 * @param {number} id.path.required - Project ID
 * @returns {object} 200 - Success response with project data and client info
 * @returns {object} 404 - Project not found
 * @returns {object} 500 - Server error
 * 
 * @example
 * GET /instructors/projects/42
 */
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