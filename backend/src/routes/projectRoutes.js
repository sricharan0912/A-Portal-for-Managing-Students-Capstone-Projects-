import express from "express";
import db from "../../db.js";
import { verifyToken, verifyRole } from "../middleware/authMiddleware.js";
console.log("✅ projectRoutes.js is loading");
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
      // Instructors and admins see ALL projects
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
         feedback,
         created_at
       FROM projects 
       ORDER BY created_at DESC`;
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
       WHERE difficulty_level = ? AND status = 'open'
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
       WHERE status = 'open' 
         AND (title LIKE ? OR description LIKE ? OR required_skills LIKE ?)
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

// ==================== PROJECT CREATE (CLIENT ONLY) ====================

// Create new project (PROTECTED - client only)
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      title, description, skills_required, category, team_size,
      start_date, end_date, complexity_level, deliverables,
      project_location, industry, status
    } = req.body;

    // Check if user is a client
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        error: "Only clients can create projects",
      });
    }

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: "Title and description are required",
      });
    }

    // ✅ Convert skills_required to JSON if provided
    let skillsJson = null;
    if (skills_required) {
      if (typeof skills_required === 'string') {
        const skillsArray = skills_required.split(',').map(s => s.trim()).filter(s => s);
        skillsJson = JSON.stringify(skillsArray);
      } else if (Array.isArray(skills_required)) {
        skillsJson = JSON.stringify(skills_required);
      } else {
        skillsJson = JSON.stringify([skills_required]);
      }
    }

    // ✅ Convert deliverables to JSON if provided
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

    const [result] = await db.query(
      `INSERT INTO projects (
        owner_id, title, description, required_skills, category,
        max_team_size, start_date, end_date, difficulty_level,
        deliverables, location, industry_category, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.clientId,
        title,
        description,
        skillsJson,
        category || null,
        team_size || null,
        start_date || null,
        end_date || null,
        complexity_level || null,
        deliverablesJson,
        project_location || null,
        industry || null,
        status || "open"
      ]
    );

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        id: result.insertId,
        title,
        description,
        skills_required,
        category,
        team_size,
        start_date,
        end_date,
        complexity_level,
        deliverables,
        project_location,
        industry,
        status: status || "open",
        client_id: req.user.clientId,
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create project",
    });
  }
});

// ==================== PROJECT UPDATE (CLIENT OR INSTRUCTOR) ====================

// Update project (PROTECTED - client can update own projects, instructor can update status)
router.put("/:project_id", verifyToken, async (req, res) => {
  try {
    const { project_id } = req.params;
    const {
      title, description, skills_required, category, team_size,
      start_date, end_date, complexity_level, deliverables,
      project_location, industry, status, feedback
    } = req.body;

    const userRole = req.user.role;

    // ✅ Allow both clients and instructors
    if (userRole !== "client" && userRole !== "instructor") {
      return res.status(403).json({
        success: false,
        error: "Only clients and instructors can update projects",
      });
    }

    // Verify project exists
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

    // ✅ Authorization logic based on role
    if (userRole === "client") {
      // Clients can only update their own projects
      if (projectCheck[0].owner_id !== req.user.clientId) {
        return res.status(403).json({
          success: false,
          error: "You can only update your own projects",
        });
      }
    }
    // Instructors can update any project (for approve/reject)

    // Build dynamic update query
    const updates = [];
    const values = [];

    // ✅ For instructors, only allow approval_status updates (and feedback if provided)
    if (userRole === "instructor") {
      if (status !== undefined) {
        // Validate status for instructor (only pending/approved/rejected)
        const validStatuses = ["pending", "approved", "rejected"];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: "Invalid status. Must be: pending, approved, or rejected",
          });
        }
        // Use approval_status column, not status
        updates.push("approval_status = ?");
        values.push(status);
      }
      // Only update feedback if it's a non-empty string
      if (feedback !== undefined && feedback !== null && feedback.trim() !== "") {
        updates.push("feedback = ?");
        values.push(feedback.trim());
      }
    } else {
      // Clients can update all fields
      if (title !== undefined) { updates.push("title = ?"); values.push(title); }
      if (description !== undefined) { updates.push("description = ?"); values.push(description); }
      
      // ✅ Convert skills_required to JSON if provided
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
      
      // ✅ Convert deliverables to JSON if provided
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
    }

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

// Get project details with preferences (PROTECTED - client or instructor)
router.get("/:project_id/details", verifyToken, async (req, res) => {
  try {
    const { project_id } = req.params;

    // ✅ Allow both clients and instructors
    if (req.user.role !== "client" && req.user.role !== "instructor") {
      return res.status(403).json({
        success: false,
        error: "Only clients and instructors can view project details",
      });
    }

    let query;
    let params;

    if (req.user.role === "client") {
      // Clients can only see their own projects
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
         created_at
       FROM projects
       WHERE id = ? AND owner_id = ?`;
      params = [project_id, req.user.clientId];
    } else {
      // Instructors can see any project
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
         created_at
       FROM projects
       WHERE id = ?`;
      params = [project_id];
    }

    const [projects] = await db.query(query, params);

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

// Get preferences for a specific project (PROTECTED - client or instructor)
router.get("/:project_id/preferences", verifyToken, async (req, res) => {
  try {
    const { project_id } = req.params;

    // ✅ Allow both clients and instructors
    if (req.user.role !== "client" && req.user.role !== "instructor") {
      return res.status(403).json({
        success: false,
        error: "Only clients and instructors can view preferences",
      });
    }

    // Verify project exists
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

    // If client, verify they own the project
    if (req.user.role === "client" && projectCheck[0].owner_id !== req.user.clientId) {
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

export default router;