import express from "express";
import jwt from "jsonwebtoken";
import db from "../../db.js";
import { auth } from "../../firebaseAdmin.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { validateClientSignup, validateClientLogin } from "../middleware/validateRequest.js";

const router = express.Router();

const generateJWT = (uid, email, role, clientId) => {
  return jwt.sign(
    { uid, email, role, clientId },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );
};

// ==================== AUTHENTICATION ====================

// Client Signup with Firebase
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
      // âœ… NEW SCHEMA: Insert into users table
      const [userResult] = await connection.query(
        "INSERT INTO users (email, firebase_uid, role, email_verified, status) VALUES (?, ?, 'client', 1, 'active')",
        [email, uid]
      );

      const userId = userResult.insertId;

      // âœ… NEW SCHEMA: Insert into user_profiles table
      await connection.query(
        `INSERT INTO user_profiles 
         (user_id, first_name, last_name, full_name, organization_name, website) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, first_name, last_name, name, organization_name, website || null]
      );

      connection.release();

      // Generate JWT token
      const token = generateJWT(uid, email, "client", userId);

      // âœ… BACKWARDS COMPATIBLE RESPONSE
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

// Client Login with Firebase
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

    // âœ… NEW SCHEMA: Query users + user_profiles
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

    // âœ… BACKWARDS COMPATIBLE RESPONSE
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

// Get client profile (PROTECTED)
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

    // âœ… NEW SCHEMA: Query users + user_profiles
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

// Update client profile (PROTECTED)
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

    // âœ… NEW SCHEMA: Update user_profiles table
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

// Delete client account (PROTECTED)
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
      // âœ… NEW SCHEMA: Soft delete using deleted_at
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

// Get all projects for a specific client (PROTECTED)
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

// Get project statistics for a client (PROTECTED)
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
 * GET /clients/:client_id/teams
 * Get all student groups/teams assigned to this client's projects
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