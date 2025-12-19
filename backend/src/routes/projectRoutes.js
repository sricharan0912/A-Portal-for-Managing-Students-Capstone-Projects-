import express from "express";
import db from "../../db.js";
import { verifyToken, verifyRole } from "../middleware/authMiddleware.js";
console.log("âœ… projectRoutes.js is loading");
const router = express.Router();

// ==================== PROJECT LISTING ====================

// Get all available projects
// - PUBLIC/NO AUTH: Returns only 'open' projects (for students to browse)
// - INSTRUCTOR/ADMIN: Returns ALL projects regardless of status
router.get("/", async (req, res) => {
  try {
    // Check if user is authenticated and their role
    const authHeader = req.headers.authorization;
    let userRole = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.default.verify(
          token,
          process.env.JWT_SECRET || "your-secret-key"
        );
        userRole = decoded.role;
      } catch (err) {
        // Token invalid or expired, treat as public
        userRole = null;
      }
    }

    // Build query based on user role
    let query;
    if (userRole === "instructor" || userRole === "admin") {
      // Instructors and admins see ALL projects with client info
      query = `SELECT 
         p.id, 
         p.owner_id as client_id,
         p.title, 
         p.description, 
         p.required_skills as skills_required, 
         p.category, 
         p.max_team_size as team_size, 
         p.start_date, 
         p.end_date, 
         p.difficulty_level as complexity_level, 
         p.deliverables, 
         p.location as project_location, 
         p.industry_category as industry, 
         p.status,
         p.approval_status,
         p.instructor_feedback,
         p.created_at,
         u.email as client_email,
         up.first_name as client_first_name,
         up.last_name as client_last_name,
         up.full_name as client_name,
         up.organization_name as client_organization,
         up.website as client_website
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       ORDER BY p.created_at DESC`;
    } else {
      // Students and public see only approved projects
      query = `SELECT 
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
       ORDER BY created_at DESC`;
    }

    const [projects] = await db.query(query);

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
      error: "Failed to fetch client projects",
    });
  }
});

// Get single project by ID (PUBLIC)
router.get("/:project_id", async (req, res) => {
  try {
    const { project_id } = req.params;

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
         created_at
       FROM projects 
       WHERE id = ?`,
      [project_id]
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
         created_at
       FROM projects 
       WHERE category = ? AND approval_status = 'approved'
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
         created_at
       FROM projects 
       WHERE difficulty_level = ? AND approval_status = 'approved'
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
         created_at
       FROM projects 
       WHERE (title LIKE ? OR description LIKE ? OR required_skills LIKE ?) 
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
    const { 
      title, description, skills_required, category, team_size, 
      start_date, end_date, complexity_level, deliverables, 
      project_location, industry, client_id 
    } = req.body;

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

    // Verify client exists in users table
    const [clientCheck] = await db.query(
      "SELECT id FROM users WHERE id = ? AND role = 'client' AND deleted_at IS NULL",
      [finalClientId]
    );

    if (clientCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    // âœ… CONVERT SKILLS_REQUIRED TO JSON ARRAY
    let skillsJson;
    if (typeof skills_required === 'string') {
      // Split by commas if it's a comma-separated string
      const skillsArray = skills_required.split(',').map(s => s.trim()).filter(s => s);
      skillsJson = JSON.stringify(skillsArray);
    } else if (Array.isArray(skills_required)) {
      skillsJson = JSON.stringify(skills_required);
    } else {
      skillsJson = JSON.stringify([skills_required]);
    }

    // âœ… CONVERT DELIVERABLES TO JSON ARRAY
    let deliverablesJson = null;
    if (deliverables) {
      if (typeof deliverables === 'string') {
        // Split by commas or newlines
        const deliverablesArray = deliverables.split(/[,\n]/).map(d => d.trim()).filter(d => d);
        deliverablesJson = JSON.stringify(deliverablesArray);
      } else if (Array.isArray(deliverables)) {
        deliverablesJson = JSON.stringify(deliverables);
      } else {
        deliverablesJson = JSON.stringify([deliverables]);
      }
    }

    // âœ… GENERATE SLUG FROM TITLE (required unique field)
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now();

    // âœ… NEW SCHEMA: Insert with JSON values and slug
    const [result] = await db.query(
      `INSERT INTO projects 
       (owner_id, title, slug, description, required_skills, category, 
        max_team_size, start_date, end_date, difficulty_level, 
        deliverables, location, industry_category, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
      [
        finalClientId,
        title,
        slug,                         // âœ… Added slug (required)
        description,
        skillsJson,                   // âœ… JSON string
        category || null,
        team_size || null,
        start_date || null,
        end_date || null,
        complexity_level || 'intermediate',  // âœ… Default value
        deliverablesJson,             // âœ… JSON string or null
        project_location || null,
        industry || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        id: result.insertId,
        title,
        description,
        slug,
      },
    });
  } catch (err) {
    console.error("âŒ Error creating project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create project",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

// ==================== PROJECT UPDATE (CLIENT ONLY) ====================

// Update project (PROTECTED - client only, must own project)
router.put("/:project_id", verifyToken, async (req, res) => {
  try {
    const { project_id } = req.params;
    const {
      title, description, skills_required, category, team_size,
      start_date, end_date, complexity_level, deliverables,
      project_location, industry, status, feedback
    } = req.body;

    // Check if user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        error: "Only clients can update projects",
      });
    }

    // Verify project exists and belongs to this client
    const [projectCheck] = await db.query(
      "SELECT owner_id FROM projects WHERE id = ?",
      [project_id]
    );

    if (projectCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (projectCheck[0].owner_id !== req.user.clientId) {
      return res.status(403).json({
        success: false,
        error: "You can only update your own projects",
      });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (title !== undefined) { updates.push("title = ?"); values.push(title); }
    if (description !== undefined) { updates.push("description = ?"); values.push(description); }
    
    // âœ… Convert skills_required to JSON if provided
    if (skills_required !== undefined) {
      let skillsJson;
      if (typeof skills_required === 'string') {
        const skillsArray = skills_required.split(',').map(s => s.trim()).filter(s => s);
        skillsJson = JSON.stringify(skillsArray);
      } else if (Array.isArray(skills_required)) {
        skillsJson = JSON.stringify(skills_required);
      } else {
        skillsJson = JSON.stringify([skills_required]);
      }
      updates.push("required_skills = ?");
      values.push(skillsJson);
    }
    
    if (category !== undefined) { updates.push("category = ?"); values.push(category); }
    if (team_size !== undefined) { updates.push("max_team_size = ?"); values.push(team_size); }
    if (start_date !== undefined) { updates.push("start_date = ?"); values.push(start_date); }
    if (end_date !== undefined) { updates.push("end_date = ?"); values.push(end_date); }
    if (complexity_level !== undefined) { updates.push("difficulty_level = ?"); values.push(complexity_level); }
    
    // âœ… Convert deliverables to JSON if provided
    if (deliverables !== undefined) {
      let deliverablesJson = null;
      if (deliverables) {
        if (typeof deliverables === 'string') {
          const deliverablesArray = deliverables.split(/[,\n]/).map(d => d.trim()).filter(d => d);
          deliverablesJson = JSON.stringify(deliverablesArray);
        } else if (Array.isArray(deliverables)) {
          deliverablesJson = JSON.stringify(deliverables);
        } else {
          deliverablesJson = JSON.stringify([deliverables]);
        }
      }
      updates.push("deliverables = ?");
      values.push(deliverablesJson);
    }
    
    if (project_location !== undefined) { updates.push("location = ?"); values.push(project_location); }
    if (industry !== undefined) { updates.push("industry_category = ?"); values.push(industry); }
    if (status !== undefined) { updates.push("status = ?"); values.push(status); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    values.push(project_id);

    const [result] = await db.query(
      `UPDATE projects SET ${updates.join(", ")} WHERE id = ?`,
      values
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

    // Check if user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        error: "Only clients can delete projects",
      });
    }

    // Verify project exists and belongs to this client
    const [projectCheck] = await db.query(
      "SELECT owner_id FROM projects WHERE id = ?",
      [project_id]
    );

    if (projectCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (projectCheck[0].owner_id !== req.user.clientId) {
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
        [project_id]
      );

      // 2. Delete group members for groups of this project
      await connection.query(
        `DELETE FROM group_members 
         WHERE group_id IN (SELECT id FROM student_groups WHERE project_id = ?)`,
        [project_id]
      );

      // 3. Delete student groups for this project
      await connection.query(
        "DELETE FROM student_groups WHERE project_id = ?",
        [project_id]
      );

      // 4. Delete the project
      const [result] = await connection.query(
        "DELETE FROM projects WHERE id = ?",
        [project_id]
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

    // Check if user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        error: "Only clients can view project details",
      });
    }

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
         created_at
       FROM projects
       WHERE id = ? AND owner_id = ?`,
      [project_id, req.user.clientId]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const project = projects[0];

    const [preferences] = await db.query(
      `SELECT 
         sp.student_id, 
         sp.rank as preference_rank,
         p.first_name, 
         p.last_name, 
         u.email
       FROM student_preferences sp
       JOIN users u ON sp.student_id = u.id
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE sp.project_id = ?
       ORDER BY sp.rank ASC`,
      [project_id]
    );

    // Get assigned groups
    const [groups] = await db.query(
      `SELECT sg.id, sg.group_number, COUNT(gm.student_id) as member_count
       FROM student_groups sg
       LEFT JOIN group_members gm ON sg.id = gm.group_id
       WHERE sg.project_id = ?
       GROUP BY sg.id`,
      [project_id]
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

    // Check if user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        error: "Only clients can view preferences",
      });
    }

    // Verify project exists and belongs to this client
    const [projectCheck] = await db.query(
      "SELECT owner_id FROM projects WHERE id = ?",
      [project_id]
    );

    if (projectCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (projectCheck[0].owner_id !== req.user.clientId) {
      return res.status(403).json({
        success: false,
        error: "You can only view preferences for your own projects",
      });
    }

    const [preferences] = await db.query(
      `SELECT 
         sp.student_id, 
         sp.rank as preference_rank,
         p.first_name, 
         p.last_name, 
         u.email
       FROM student_preferences sp
       JOIN users u ON sp.student_id = u.id
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE sp.project_id = ?
       ORDER BY sp.rank ASC`,
      [project_id]
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

// ==================== INSTRUCTOR APPROVAL ====================

// Approve or reject a project (PROTECTED - instructor only)
router.put("/:project_id/approval", verifyToken, async (req, res) => {
  try {
    const { project_id } = req.params;
    const { approval_status, feedback } = req.body;

    // Check if user is an instructor
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Only instructors can approve or reject projects",
      });
    }

    // Validate approval_status
    if (!approval_status || !["approved", "rejected"].includes(approval_status)) {
      return res.status(400).json({
        success: false,
        error: "approval_status must be 'approved' or 'rejected'",
      });
    }

    // Verify project exists
    const [projectCheck] = await db.query(
      "SELECT id, title FROM projects WHERE id = ?",
      [project_id]
    );

    if (projectCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Update project approval status and feedback
    const updateFields = ["approval_status = ?", "approved_by = ?", "approved_at = NOW()"];
    const updateValues = [approval_status, req.user.instructorId];

    // Add feedback if provided (especially for rejections)
    if (feedback) {
      updateFields.push("instructor_feedback = ?");
      updateValues.push(feedback);
    }

    updateValues.push(project_id);

    await db.query(
      `UPDATE projects SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: `Project ${approval_status} successfully`,
      data: {
        project_id: parseInt(project_id),
        approval_status,
        feedback: feedback || null,
      },
    });
  } catch (err) {
    console.error("Error updating project approval:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update project approval",
    });
  }
});

export default router;