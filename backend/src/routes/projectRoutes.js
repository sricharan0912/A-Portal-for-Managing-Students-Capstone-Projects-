import express from "express";
import db from "../../db.js";
import { verifyToken, verifyRole } from "../middleware/authMiddleware.js";
console.log("✅ projectRoutes.js is loading");
const router = express.Router();

// ==================== PROJECT LISTING ====================

// Get all available projects (PUBLIC - for students to browse)
router.get("/", async (req, res) => {
  try {
    const [projects] = await db.query(
      `SELECT id, client_id, title, description, skills_required, category, 
              team_size, start_date, end_date, complexity_level, deliverables, 
              project_location, industry, status, created_at
       FROM projects 
       WHERE status = 'open' 
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

// Get projects by client ID (PROTECTED - client only)
router.get("/client/:client_id", verifyToken, async (req, res) => {
  try {
    const { client_id } = req.params;

    // Validate client_id is numeric
    if (isNaN(client_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid client ID format",
      });
    }

    // Authorization check - only allow clients to view their own projects
    if (req.user.role !== "client" || parseInt(client_id) !== req.user.clientId) {
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
      error: "Failed to fetch client projects",
    });
  }
});

// Get single project by ID (PUBLIC)
router.get("/:project_id", async (req, res) => {
  try {
    const { project_id } = req.params;

    if (isNaN(project_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid project ID format",
      });
    }

    const [projects] = await db.query(
      `SELECT id, client_id, title, description, skills_required, category, 
              team_size, start_date, end_date, complexity_level, deliverables, 
              project_location, industry, status, created_at
       FROM projects 
       WHERE id = ?`,
      [parseInt(project_id)]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    res.json({
      success: true,
      data: projects[0],
    });
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch project",
    });
  }
});

// Get projects by category (PUBLIC)
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        success: false,
        error: "Category is required",
      });
    }

    const [projects] = await db.query(
      `SELECT id, client_id, title, description, skills_required, category, 
              team_size, start_date, end_date, complexity_level, deliverables, 
              project_location, industry, status, created_at
       FROM projects 
       WHERE category = ? AND status = 'open'
       ORDER BY created_at DESC`,
      [category]
    );

    res.json({
      success: true,
      data: projects,
    });
  } catch (err) {
    console.error("Error fetching projects by category:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
    });
  }
});

// Get projects by complexity level (PUBLIC)
router.get("/complexity/:complexity", async (req, res) => {
  try {
    const { complexity } = req.params;

    const validComplexity = ["Beginner", "Intermediate", "Advanced"];
    if (!validComplexity.includes(complexity)) {
      return res.status(400).json({
        success: false,
        error: "Invalid complexity level. Must be: Beginner, Intermediate, or Advanced",
      });
    }

    const [projects] = await db.query(
      `SELECT id, client_id, title, description, skills_required, category, 
              team_size, start_date, end_date, complexity_level, deliverables, 
              project_location, industry, status, created_at
       FROM projects 
       WHERE complexity_level = ? AND status = 'open'
       ORDER BY created_at DESC`,
      [complexity]
    );

    res.json({
      success: true,
      data: projects,
    });
  } catch (err) {
    console.error("Error fetching projects by complexity:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
    });
  }
});

// Search projects by keyword (PUBLIC)
router.get("/search", async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: "Search keyword is required",
      });
    }

    const searchTerm = `%${keyword}%`;

    const [projects] = await db.query(
      `SELECT id, client_id, title, description, skills_required, category, 
              team_size, start_date, end_date, complexity_level, deliverables, 
              project_location, industry, status, created_at
       FROM projects 
       WHERE (title LIKE ? OR description LIKE ? OR skills_required LIKE ?) 
             AND status = 'open'
       ORDER BY created_at DESC`,
      [searchTerm, searchTerm, searchTerm]
    );

    res.json({
      success: true,
      data: projects,
    });
  } catch (err) {
    console.error("Error searching projects:", err);
    res.status(500).json({
      success: false,
      error: "Failed to search projects",
    });
  }
});

// ==================== PROJECT CREATION (CLIENT ONLY) ====================

// Create new project (PROTECTED - client only)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, description, skills_required, category, team_size, 
            start_date, end_date, complexity_level, deliverables, 
            project_location, industry, client_id } = req.body;

    // Check if user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        error: "Only clients can create projects",
      });
    }

    // Validation
    if (!title || !description || !skills_required) {
      return res.status(400).json({
        success: false,
        error: "Title, description, and skills_required are required",
      });
    }

    // Use client_id from request body or from token
    const finalClientId = client_id || req.user.clientId;

    // Insert project
    const [result] = await db.query(
      `INSERT INTO projects 
       (client_id, title, description, skills_required, category, team_size, 
        start_date, end_date, complexity_level, deliverables, project_location, 
        industry, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        finalClientId,
        title,
        description,
        skills_required,
        category || null,
        team_size ? parseInt(team_size) : null,
        start_date || null,
        end_date || null,
        complexity_level || null,
        deliverables || null,
        project_location || null,
        industry || null,
        "open" // Default status
      ]
    );

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        id: result.insertId,
        client_id: finalClientId,
        title,
        description,
        status: "open",
      },
    });
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create project",
    });
  }
});

// ==================== PROJECT UPDATE (CLIENT ONLY) ====================

// Update project (PROTECTED - client only, must own project)
router.put("/:project_id", verifyToken, async (req, res) => {
  try {
    const { project_id } = req.params;
    const { title, description, skills_required, category, team_size,
            start_date, end_date, complexity_level, deliverables,
            project_location, industry, status } = req.body;

    // Validate project_id
    if (isNaN(project_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid project ID format",
      });
    }

    // Check if user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        error: "Only clients can update projects",
      });
    }

    // Verify project exists and belongs to this client
    const [projectCheck] = await db.query(
      "SELECT client_id FROM projects WHERE id = ?",
      [parseInt(project_id)]
    );

    if (projectCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (projectCheck[0].client_id !== req.user.clientId) {
      return res.status(403).json({
        success: false,
        error: "You can only update your own projects",
      });
    }

    // Update project
    const [result] = await db.query(
      `UPDATE projects 
       SET title = ?, description = ?, skills_required = ?, category = ?, 
           team_size = ?, start_date = ?, end_date = ?, complexity_level = ?, 
           deliverables = ?, project_location = ?, industry = ?, status = ?
       WHERE id = ?`,
      [
        title,
        description,
        skills_required,
        category || null,
        team_size ? parseInt(team_size) : null,
        start_date || null,
        end_date || null,
        complexity_level || null,
        deliverables || null,
        project_location || null,
        industry || null,
        status || "open",
        parseInt(project_id)
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    res.json({
      success: true,
      message: "Project updated successfully",
    });
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update project",
    });
  }
});

// ==================== PROJECT DELETE (CLIENT ONLY) ====================

// Delete project (PROTECTED - client only, must own project)
router.delete("/:project_id", verifyToken, async (req, res) => {
  try {
    const { project_id } = req.params;

    // Validate project_id
    if (isNaN(project_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid project ID format",
      });
    }

    // Check if user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        error: "Only clients can delete projects",
      });
    }

    // Verify project exists and belongs to this client
    const [projectCheck] = await db.query(
      "SELECT client_id FROM projects WHERE id = ?",
      [parseInt(project_id)]
    );

    if (projectCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (projectCheck[0].client_id !== req.user.clientId) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own projects",
      });
    }

    // Get database connection for safe deletion
    const connection = await db.getConnection();

    try {
      // Delete in correct order (respecting foreign key constraints)
      
      // 1. Delete student preferences for this project
      await connection.query(
        "DELETE FROM student_preferences WHERE project_id = ?",
        [parseInt(project_id)]
      );

      // 2. Delete group members for groups of this project
      await connection.query(
        `DELETE FROM group_members 
         WHERE group_id IN (SELECT id FROM student_groups WHERE project_id = ?)`,
        [parseInt(project_id)]
      );

      // 3. Delete student groups for this project
      await connection.query(
        "DELETE FROM student_groups WHERE project_id = ?",
        [parseInt(project_id)]
      );

      // 4. Delete the project
      const [result] = await connection.query(
        "DELETE FROM projects WHERE id = ?",
        [parseInt(project_id)]
      );

      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      res.json({
        success: true,
        message: "Project deleted successfully",
      });
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete project",
    });
  }
});

// ==================== PROJECT DETAILS & PREFERENCES ====================

// Get project details with preferences (PROTECTED - client only)
router.get("/:project_id/details", verifyToken, async (req, res) => {
  try {
    const { project_id } = req.params;

    // Validate project_id
    if (isNaN(project_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid project ID format",
      });
    }

    // Check if user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        error: "Only clients can view project details",
      });
    }

    // Get project
    const [projects] = await db.query(
      `SELECT id, client_id, title, description, skills_required, category,
              team_size, start_date, end_date, complexity_level, deliverables,
              project_location, industry, status, created_at
       FROM projects
       WHERE id = ? AND client_id = ?`,
      [parseInt(project_id), req.user.clientId]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const project = projects[0];

    // Get preferences for this project
    const [preferences] = await db.query(
      `SELECT sp.id, sp.student_id, sp.preference_rank, 
              s.first_name, s.last_name, s.email
       FROM student_preferences sp
       JOIN students s ON sp.student_id = s.id
       WHERE sp.project_id = ?
       ORDER BY sp.preference_rank ASC`,
      [parseInt(project_id)]
    );

    // Get assigned groups
    const [groups] = await db.query(
      `SELECT sg.id, sg.group_number, COUNT(gm.student_id) as member_count
       FROM student_groups sg
       LEFT JOIN group_members gm ON sg.id = gm.group_id
       WHERE sg.project_id = ?
       GROUP BY sg.id`,
      [parseInt(project_id)]
    );

    res.json({
      success: true,
      data: {
        project,
        preferences,
        groups,
        stats: {
          preference_count: preferences.length,
          group_count: groups.length,
        },
      },
    });
  } catch (err) {
    console.error("Error fetching project details:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch project details",
    });
  }
});

// Get preferences for a specific project (PROTECTED - client only)
router.get("/:project_id/preferences", verifyToken, async (req, res) => {
  try {
    const { project_id } = req.params;

    // Validate project_id
    if (isNaN(project_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid project ID format",
      });
    }

    // Check if user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        error: "Only clients can view preferences",
      });
    }

    // Verify project exists and belongs to this client
    const [projectCheck] = await db.query(
      "SELECT client_id FROM projects WHERE id = ?",
      [parseInt(project_id)]
    );

    if (projectCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (projectCheck[0].client_id !== req.user.clientId) {
      return res.status(403).json({
        success: false,
        error: "You can only view preferences for your own projects",
      });
    }

    // Get preferences
    const [preferences] = await db.query(
      `SELECT sp.id, sp.student_id, sp.preference_rank, 
              s.first_name, s.last_name, s.email
       FROM student_preferences sp
       JOIN students s ON sp.student_id = s.id
       WHERE sp.project_id = ?
       ORDER BY sp.preference_rank ASC`,
      [parseInt(project_id)]
    );

    res.json({
      success: true,
      data: preferences,
    });
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch preferences",
    });
  }
});

export default router;