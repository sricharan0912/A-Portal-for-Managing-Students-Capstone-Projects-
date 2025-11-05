import db from "../../db.js";

// ==================== INSTRUCTOR AUTHENTICATION ====================

// Get all instructors (for admin purposes)
export const getAllInstructors = async (req, res) => {
  try {
    const [instructors] = await db.query(
      "SELECT id, first_name, last_name, email, created_at FROM instructors ORDER BY created_at DESC"
    );
    res.status(200).json(instructors);
  } catch (err) {
    console.error("Error fetching instructors:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single instructor by ID
export const getInstructorById = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify id is numeric
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid instructor ID format" });
    }

    const [instructors] = await db.query(
      "SELECT id, first_name, last_name, email, created_at FROM instructors WHERE id = ?",
      [parseInt(id)]
    );

    if (instructors.length === 0) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    res.status(200).json(instructors[0]);
  } catch (err) {
    console.error("Error fetching instructor:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update instructor profile
export const updateInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email } = req.body;

    // Verify id is numeric
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid instructor ID format" });
    }

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        error: "first_name, last_name, and email are required",
      });
    }

    // Check if email already exists (excluding current instructor)
    const [existingEmail] = await db.query(
      "SELECT id FROM instructors WHERE email = ? AND id != ?",
      [email, parseInt(id)]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const [result] = await db.query(
      "UPDATE instructors SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
      [first_name, last_name, email, parseInt(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    res.status(200).json({ message: "Instructor profile updated successfully" });
  } catch (err) {
    console.error("Error updating instructor:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete an instructor
export const deleteInstructor = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify id is numeric
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid instructor ID format" });
    }

    // Delete instructor
    const [result] = await db.query(
      "DELETE FROM instructors WHERE id = ?",
      [parseInt(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    res.status(200).json({ message: "Instructor deleted successfully" });
  } catch (err) {
    console.error("Error deleting instructor:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==================== INSTRUCTOR DASHBOARD ====================

// Get instructor dashboard statistics
export const getInstructorStats = async (req, res) => {
  try {
    const { instructor_id } = req.params;

    // Verify instructor_id is numeric
    if (isNaN(instructor_id)) {
      return res.status(400).json({ error: "Invalid instructor ID format" });
    }

    // Get student statistics
    const [studentStats] = await db.query(
      `SELECT COUNT(*) as total_students
       FROM students`
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
      `SELECT COUNT(DISTINCT id) as total_groups
       FROM student_groups`
    );

    res.status(200).json({
      students: studentStats[0] || { total_students: 0 },
      projects: projectStats[0] || {
        total_projects: 0,
        open_projects: 0,
        approved_projects: 0,
        closed_projects: 0,
      },
      groups: groupStats[0] || { total_groups: 0 },
    });
  } catch (err) {
    console.error("Error fetching instructor stats:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==================== INSTRUCTOR PROJECT DETAILS ====================

// Get a single project by ID (for instructor "View Details")
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid project ID format" });
    }

    const [projects] = await db.query(
      `SELECT 
         p.id,
         p.title,
         p.description,
         p.status,
         p.created_at,
         c.first_name AS client_first_name,
         c.last_name AS client_last_name,
         c.email AS client_email
       FROM projects p
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE p.id = ?`,
      [parseInt(id)]
    );

    if (projects.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(200).json(projects[0]);
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ error: "Server error" });
  }
};


export default {
  getAllInstructors,
  getInstructorById,
  updateInstructor,
  deleteInstructor,
  getInstructorStats,
  getProjectById,
};