/**
 * Client Routes Module
 * 
 * Handles all client-related API endpoints including authentication, profile management,
 * project management, and team/group assignments.
 * 
 * Routes are organized by functionality:
 * 1. Authentication (signup, login)
 * 2. Client Profile (CRUD operations)
 * 3. Client Projects (list, statistics)
 * 4. Teams/Groups (assigned to client's projects)
 * 
 * @module routes/clientRoutes
 * @requires express
 * @requires jsonwebtoken
 * @requires ../../db
 * @requires ../../firebaseAdmin
 * @requires ../middleware/authMiddleware
 * @requires ../middleware/validateRequest
 */

import express from "express";
import jwt from "jsonwebtoken";
import db from "../../db.js";
import { auth } from "../../firebaseAdmin.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { validateClientSignup, validateClientLogin } from "../middleware/validateRequest.js";

const router = express.Router();

/**
 * Generate JWT Token for Client
 * 
 * Creates a signed JWT token containing client authentication data.
 * Token expires in 7 days.
 * 
 * @function generateJWT
 * @param {string} uid - Firebase user ID
 * @param {string} email - Client email address
 * @param {string} role - User role (should be 'client')
 * @param {number} clientId - Numeric database client ID
 * @returns {string} Signed JWT token
 * 
 * @example
 * const token = generateJWT('firebase-uid-123', 'client@example.com', 'client', 42);
 */
const generateJWT = (uid, email, role, clientId) => {
  return jwt.sign(
    { uid, email, role, clientId },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );
};

// ==================== AUTHENTICATION ====================

/**
 * Client Signup with Firebase
 * 
 * Registers a new client account with Firebase authentication.
 * Creates entries in both users and user_profiles tables.
 * Automatically splits full name into first_name and last_name.
 * 
 * @route POST /clients/signup
 * @group Authentication - Client authentication operations
 * @param {string} email.body.required - Client email address
 * @param {string} idToken.body.required - Firebase ID token
 * @param {string} name.body.required - Client full name
 * @param {string} organization_name.body.required - Organization/company name
 * @param {string} website.body - Organization website URL
 * @returns {object} 201 - Success response with token and client data
 * @returns {object} 400 - Email already registered
 * @returns {object} 401 - Invalid Firebase token
 * @returns {object} 500 - Server error
 * 
 * @example
 * POST /clients/signup
 * {
 *   "email": "john.doe@techcorp.com",
 *   "idToken": "firebase-id-token...",
 *   "name": "John Doe",
 *   "organization_name": "TechCorp Inc.",
 *   "website": "https://techcorp.com"
 * }
 */
router.post("/signup", validateClientSignup, async (req, res) => {
  try {
    const { email, idToken, name, organization_name, website } = req.body;

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

    // Split name into first_name and last_name
    let first_name, last_name;
    if (name) {
      const nameParts = name.trim().split(/\s+/);
      first_name = nameParts[0] || "";
      last_name = nameParts.slice(1).join(" ") || nameParts[0];
    } else {
      first_name = "";
      last_name = "";
    }

    const connection = await db.getConnection();

    try {
      // ✅ NEW SCHEMA: Insert into users table
      const [userResult] = await connection.query(
        "INSERT INTO users (email, firebase_uid, role, email_verified, status) VALUES (?, ?, 'client', 1, 'active')",
        [email, uid]
      );

      const userId = userResult.insertId;

      // ✅ NEW SCHEMA: Insert into user_profiles table
      await connection.query(
        `INSERT INTO user_profiles 
         (user_id, first_name, last_name, full_name, organization_name, website) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, first_name, last_name, name, organization_name, website || null]
      );

      connection.release();

      // Generate JWT token
      const token = generateJWT(uid, email, "client", userId);

      // ✅ BACKWARDS COMPATIBLE RESPONSE
      res.status(201).json({
        success: true,
        message: "Client registered successfully",
        token,
        client: {
          id: userId,                      // Numeric ID
          name: name,                      // Combined name
          first_name,
          last_name,
          email,
          organization_name,
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
 * Client Login with Firebase
 * 
 * Authenticates an existing client using Firebase ID token.
 * Updates last login timestamp and returns JWT token.
 * 
 * @route POST /clients/login
 * @group Authentication - Client authentication operations
 * @param {string} email.body.required - Client email address
 * @param {string} idToken.body.required - Firebase ID token
 * @returns {object} 200 - Success response with token and client data
 * @returns {object} 401 - Invalid credentials or token
 * @returns {object} 500 - Server error
 * 
 * @example
 * POST /clients/login
 * {
 *   "email": "john.doe@techcorp.com",
 *   "idToken": "firebase-id-token..."
 * }
 */
router.post("/login", validateClientLogin, async (req, res) => {
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

    // ✅ NEW SCHEMA: Query users + user_profiles
    const [users] = await db.query(
      `SELECT u.id, u.email, u.role, 
              p.first_name, p.last_name, p.full_name, p.organization_name
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.email = ? AND u.role = 'client'`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Client account not found. Please sign up first.",
      });
    }

    const client = users[0];
    const clientId = client.id;

    // Update last_login_at
    await db.query(
      "UPDATE users SET last_login_at = NOW() WHERE id = ?",
      [clientId]
    );

    // Generate JWT token
    const token = generateJWT(uid, email, "client", clientId);

    // ✅ BACKWARDS COMPATIBLE RESPONSE
    res.json({
      success: true,
      message: "Login successful",
      token,
      client: {
        id: clientId,
        name: client.full_name || `${client.first_name} ${client.last_name}`.trim(),
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        organization_name: client.organization_name,
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

// ==================== CLIENT PROFILE ====================

/**
 * Get Client Profile
 * 
 * Retrieves profile information for a specific client.
 * Clients can view their own profile, admins can view any profile.
 * 
 * @route GET /clients/:client_id
 * @group Clients - Client management operations
 * @security JWT
 * @param {number} client_id.path.required - Client ID
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with client data
 * @returns {object} 400 - Invalid client ID format
 * @returns {object} 403 - Unauthorized access
 * @returns {object} 404 - Client not found
 * @returns {object} 500 - Server error
 * 
 * @example
 * GET /clients/42
 * Authorization: Bearer <token>
 */
router.get("/:client_id", verifyToken, async (req, res) => {
  try {
    const { client_id } = req.params;

    if (isNaN(client_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid client ID format",
      });
    }

    // Authorization check
    if (parseInt(client_id) !== req.user.clientId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    // ✅ NEW SCHEMA: Query users + user_profiles
    const [clients] = await db.query(
      `SELECT u.id, u.email, u.created_at,
              p.first_name, p.last_name, p.full_name, 
              p.organization_name, p.website
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ? AND u.role = 'client'`,
      [parseInt(client_id)]
    );

    if (clients.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    const client = clients[0];

    res.json({
      success: true,
      data: {
        id: client.id,
        name: client.full_name || `${client.first_name} ${client.last_name}`.trim(),
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        organization_name: client.organization_name,
        website: client.website,
        created_at: client.created_at,
      },
    });
  } catch (err) {
    console.error("Error fetching client:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch client profile",
    });
  }
});

/**
 * Update Client Profile
 * 
 * Updates client profile information including name, organization, and website.
 * Supports both legacy (name) and new (first_name, last_name) formats.
 * Only clients can update their own profile, or admins.
 * 
 * @route PUT /clients/:client_id
 * @group Clients - Client management operations
 * @security JWT
 * @param {number} client_id.path.required - Client ID
 * @param {string} name.body - Full name (legacy format)
 * @param {string} first_name.body - First name (new format)
 * @param {string} last_name.body - Last name (new format)
 * @param {string} organization_name.body.required - Organization/company name
 * @param {string} website.body - Organization website URL
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response
 * @returns {object} 400 - Validation error
 * @returns {object} 403 - Unauthorized access
 * @returns {object} 404 - Client not found
 * @returns {object} 500 - Server error
 * 
 * @example
 * PUT /clients/42
 * {
 *   "first_name": "John",
 *   "last_name": "Smith",
 *   "organization_name": "TechCorp International",
 *   "website": "https://techcorp-intl.com"
 * }
 */
router.put("/:client_id", verifyToken, async (req, res) => {
  try {
    const { client_id } = req.params;
    const { name, first_name, last_name, organization_name, website } = req.body;

    if (isNaN(client_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid client ID format",
      });
    }

    // Authorization check
    if (parseInt(client_id) !== req.user.clientId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    // Handle both old (name) and new (first_name, last_name) formats
    let finalFirstName, finalLastName, finalFullName;
    
    if (first_name && last_name) {
      finalFirstName = first_name;
      finalLastName = last_name;
      finalFullName = `${first_name} ${last_name}`;
    } else if (name) {
      const nameParts = name.trim().split(/\s+/);
      finalFirstName = nameParts[0] || "";
      finalLastName = nameParts.slice(1).join(" ") || nameParts[0];
      finalFullName = name;
    } else {
      return res.status(400).json({
        success: false,
        error: "Name information is required",
      });
    }

    if (!organization_name) {
      return res.status(400).json({
        success: false,
        error: "Organization name is required",
      });
    }

    // ✅ NEW SCHEMA: Update user_profiles table
    const [result] = await db.query(
      `UPDATE user_profiles 
       SET first_name = ?, last_name = ?, full_name = ?, 
           organization_name = ?, website = ? 
       WHERE user_id = ?`,
      [finalFirstName, finalLastName, finalFullName, organization_name, website || null, parseInt(client_id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    res.json({
      success: true,
      message: "Client profile updated successfully",
    });
  } catch (err) {
    console.error("Error updating client:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update client profile",
    });
  }
});

/**
 * Delete Client Account
 * 
 * Soft deletes a client account (sets deleted_at timestamp and status to inactive).
 * Only clients can delete their own account, or admins.
 * 
 * @route DELETE /clients/:client_id
 * @group Clients - Client management operations
 * @security JWT
 * @param {number} client_id.path.required - Client ID
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response
 * @returns {object} 400 - Invalid client ID format
 * @returns {object} 403 - Unauthorized access
 * @returns {object} 404 - Client not found
 * @returns {object} 500 - Server error
 * 
 * @example
 * DELETE /clients/42
 * Authorization: Bearer <token>
 */
router.delete("/:client_id", verifyToken, async (req, res) => {
  try {
    const { client_id } = req.params;

    if (isNaN(client_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid client ID format",
      });
    }

    // Authorization check
    if (parseInt(client_id) !== req.user.clientId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    const connection = await db.getConnection();

    try {
      // ✅ NEW SCHEMA: Soft delete using deleted_at
      const [result] = await connection.query(
        "UPDATE users SET deleted_at = NOW(), status = 'inactive' WHERE id = ? AND role = 'client'",
        [parseInt(client_id)]
      );

      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Client not found",
        });
      }

      res.json({
        success: true,
        message: "Client account deleted successfully",
      });
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error deleting client:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete client account",
    });
  }
});

// ==================== CLIENT PROJECTS ====================

/**
 * Get Client Projects
 * 
 * Retrieves all projects owned by a specific client with full details including
 * approval status and instructor feedback.
 * Protected route - clients can only view their own projects.
 * 
 * @route GET /clients/:client_id/projects
 * @group Clients - Client project operations
 * @security JWT
 * @param {number} client_id.path.required - Client ID
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with projects array
 * @returns {object} 400 - Invalid client ID format
 * @returns {object} 403 - Unauthorized access
 * @returns {object} 500 - Server error
 * 
 * @example
 * GET /clients/42/projects
 * Authorization: Bearer <token>
 */
router.get("/:client_id/projects", verifyToken, async (req, res) => {
  try {
    const { client_id } = req.params;

    if (isNaN(client_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid client ID format",
      });
    }

    // Authorization check
    if (parseInt(client_id) !== req.user.clientId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    // ✅ NEW SCHEMA: Query with column aliases for backwards compatibility
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
         instructor_feedback,
         created_at
       FROM projects 
       WHERE owner_id = ? 
       ORDER BY created_at DESC`,
      [parseInt(client_id)]
    );

    res.json({
      success: true,
      data: projects,
    });
  } catch (err) {
    console.error("Error fetching client projects:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
    });
  }
});

/**
 * Get Client Statistics
 * 
 * Retrieves comprehensive statistics for a client including:
 * - Project counts by approval status (pending, approved, rejected)
 * - Student interest metrics (interested students, total preferences)
 * 
 * Protected route - clients can only view their own statistics.
 * 
 * @route GET /clients/:client_id/stats
 * @group Clients - Client analytics operations
 * @security JWT
 * @param {number} client_id.path.required - Client ID
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with statistics
 * @returns {object} 200.data.projects - Project statistics
 * @returns {number} 200.data.projects.total_projects - Total number of projects
 * @returns {number} 200.data.projects.pending_projects - Projects pending approval
 * @returns {number} 200.data.projects.approved_projects - Approved projects
 * @returns {number} 200.data.projects.rejected_projects - Rejected projects
 * @returns {object} 200.data.preferences - Student preference statistics
 * @returns {number} 200.data.preferences.interested_students - Unique students interested
 * @returns {number} 200.data.preferences.total_preferences - Total preference submissions
 * @returns {object} 400 - Invalid client ID format
 * @returns {object} 403 - Unauthorized access
 * @returns {object} 500 - Server error
 * 
 * @example
 * GET /clients/42/stats
 * Authorization: Bearer <token>
 */
router.get("/:client_id/stats", verifyToken, async (req, res) => {
  try {
    const { client_id } = req.params;

    if (isNaN(client_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid client ID format",
      });
    }

    // Authorization check
    if (parseInt(client_id) !== req.user.clientId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_projects,
        SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_projects,
        SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected_projects
       FROM projects 
       WHERE owner_id = ?`,
      [parseInt(client_id)]
    );

    const [prefStats] = await db.query(
      `SELECT COUNT(DISTINCT sp.student_id) as interested_students,
              COUNT(*) as total_preferences
       FROM student_preferences sp
       JOIN projects p ON sp.project_id = p.id
       WHERE p.owner_id = ?`,
      [parseInt(client_id)]
    );

    res.json({
      success: true,
      data: {
        projects: stats[0] || {
          total_projects: 0,
          pending_projects: 0,
          approved_projects: 0,
          rejected_projects: 0,
        },
        preferences: prefStats[0] || {
          interested_students: 0,
          total_preferences: 0,
        },
      },
    });
  } catch (err) {
    console.error("Error fetching client stats:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
});

// ==================== GET TEAMS FOR CLIENT'S PROJECTS ====================

/**
 * Get Client Teams
 * 
 * Retrieves all student groups/teams assigned to the client's projects.
 * Includes group details, project information, and active member lists.
 * Each team includes:
 * - Group metadata (ID, name, number, status)
 * - Associated project details
 * - Complete member roster with roles and contact info
 * 
 * Protected route - clients can only view teams for their own projects.
 * 
 * @route GET /clients/:client_id/teams
 * @group Clients - Client team operations
 * @security JWT
 * @param {number} client_id.path.required - Client ID
 * @param {string} authorization.header.required - Bearer token
 * @returns {object} 200 - Success response with teams array
 * @returns {Array<Object>} 200.data - Array of team objects
 * @returns {number} 200.data[].group_id - Group ID
 * @returns {string} 200.data[].group_name - Group name
 * @returns {number} 200.data[].group_number - Group number
 * @returns {string} 200.data[].group_status - Group status
 * @returns {number} 200.data[].project_id - Associated project ID
 * @returns {string} 200.data[].project_title - Project title
 * @returns {Array<Object>} 200.data[].members - Array of active group members
 * @returns {number} 200.data[].member_count - Total number of members
 * @returns {object} 500 - Server error
 * 
 * @example
 * GET /clients/42/teams
 * Authorization: Bearer <token>
 */
router.get("/:client_id/teams", verifyToken, async (req, res) => {
  try {
    const { client_id } = req.params;

    console.log("📋 Fetching teams for client:", client_id);

    // Get all groups assigned to client's projects with member info
    const [teams] = await db.query(
      `SELECT 
        sg.id as group_id,
        sg.group_name,
        sg.group_number,
        sg.status as group_status,
        sg.created_at as group_created_at,
        p.id as project_id,
        p.title as project_title,
        p.status as project_status,
        p.category,
        p.difficulty_level
      FROM student_groups sg
      INNER JOIN projects p ON sg.project_id = p.id
      WHERE p.owner_id = ?
      ORDER BY p.title, sg.group_number`,
      [client_id]
    );

    console.log("Found teams:", teams.length);

    // Get members for each group
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const [members] = await db.query(
          `SELECT 
            u.id,
            up.first_name,
            up.last_name,
            CONCAT(up.first_name, ' ', up.last_name) as full_name,
            u.email,
            gm.role,
            gm.joined_at
          FROM group_members gm
          INNER JOIN users u ON gm.student_id = u.id
          LEFT JOIN user_profiles up ON u.id = up.user_id
          WHERE gm.group_id = ? AND gm.status = 'active'
          ORDER BY gm.role DESC, up.first_name`,
          [team.group_id]
        );

        return {
          ...team,
          members: members,
          member_count: members.length,
        };
      })
    );

    res.json({
      success: true,
      data: teamsWithMembers,
    });
  } catch (err) {
    console.error("Error fetching client teams:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch teams",
    });
  }
});

export default router;