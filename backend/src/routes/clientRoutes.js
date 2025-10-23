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

    // Check if email already exists in database
    const [existing] = await db.query(
      "SELECT id FROM clients WHERE email = ?",
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

    // Create client in database
    const [result] = await db.query(
      "INSERT INTO clients (name, email, organization_name, website, firebase_uid) VALUES (?, ?, ?, ?, ?)",
      [name, email, organization_name, website || null, uid]
    );

    const clientId = result.insertId;

    // Generate JWT token
    const token = generateJWT(uid, email, "client", clientId);

    res.status(201).json({
      success: true,
      message: "Client registered successfully",
      token,
      client: {
        id: clientId,
        name,
        email,
        organization_name,
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

    // Get client from database
    const [clients] = await db.query(
      "SELECT id, name, email, organization_name FROM clients WHERE email = ?",
      [email]
    );

    if (clients.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Client account not found. Please sign up first.",
      });
    }

    const client = clients[0];
    const clientId = client.id;

    // Generate JWT token
    const token = generateJWT(uid, email, "client", clientId);

    res.json({
      success: true,
      message: "Login successful",
      token,
      client: {
        id: clientId,
        name: client.name,
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

    // Validate client_id is numeric
    if (isNaN(client_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid client ID format",
      });
    }

    // Authorization check - client can only access their own profile or admin
    if (parseInt(client_id) !== req.user.clientId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access",
      });
    }

    const [clients] = await db.query(
      "SELECT id, name, email, organization_name, website, created_at FROM clients WHERE id = ?",
      [parseInt(client_id)]
    );

    if (clients.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    res.json({
      success: true,
      data: clients[0],
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
    const { name, organization_name, website } = req.body;

    // Validate client_id is numeric
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

    // Validation
    if (!name || !organization_name) {
      return res.status(400).json({
        success: false,
        error: "Name and organization name are required",
      });
    }

    const [result] = await db.query(
      "UPDATE clients SET name = ?, organization_name = ?, website = ? WHERE id = ?",
      [name, organization_name, website || null, parseInt(client_id)]
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

    // Validate client_id is numeric
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

    // Get database connection for transaction
    const connection = await db.getConnection();

    try {
      // Delete in correct order (respecting foreign key constraints)
      
      // 1. Delete student preferences for all projects of this client
      await connection.query(
        `DELETE FROM student_preferences 
         WHERE project_id IN (SELECT id FROM projects WHERE client_id = ?)`,
        [parseInt(client_id)]
      );

      // 2. Delete group members for groups of this client's projects
      await connection.query(
        `DELETE FROM group_members 
         WHERE group_id IN (
           SELECT sg.id FROM student_groups sg 
           WHERE sg.project_id IN (SELECT id FROM projects WHERE client_id = ?)
         )`,
        [parseInt(client_id)]
      );

      // 3. Delete student groups for this client's projects
      await connection.query(
        `DELETE FROM student_groups 
         WHERE project_id IN (SELECT id FROM projects WHERE client_id = ?)`,
        [parseInt(client_id)]
      );

      // 4. Delete all projects for this client
      await connection.query(
        "DELETE FROM projects WHERE client_id = ?",
        [parseInt(client_id)]
      );

      // 5. Delete the client
      const [result] = await connection.query(
        "DELETE FROM clients WHERE id = ?",
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

    // Validate client_id is numeric
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

    const [projects] = await db.query(
      `SELECT id, client_id, title, description, skills_required, category, 
              team_size, start_date, end_date, complexity_level, deliverables, 
              project_location, industry, status, created_at
       FROM projects 
       WHERE client_id = ? 
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

    // Validate client_id is numeric
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

    // Get project statistics
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_projects,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_projects,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_projects
       FROM projects 
       WHERE client_id = ?`,
      [parseInt(client_id)]
    );

    // Get preference statistics
    const [prefStats] = await db.query(
      `SELECT COUNT(DISTINCT sp.student_id) as interested_students,
              COUNT(*) as total_preferences
       FROM student_preferences sp
       JOIN projects p ON sp.project_id = p.id
       WHERE p.client_id = ?`,
      [parseInt(client_id)]
    );

    res.json({
      success: true,
      data: {
        projects: stats[0] || {
          total_projects: 0,
          open_projects: 0,
          approved_projects: 0,
          closed_projects: 0,
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

export default router;