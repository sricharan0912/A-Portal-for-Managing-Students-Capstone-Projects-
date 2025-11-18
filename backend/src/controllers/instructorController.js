import db from "../../db.js";

// ==================== INSTRUCTOR AUTHENTICATION ====================

// Get all instructors (for admin purposes)
export const getAllInstructors = async (req, res) => {
  try {
    // ✅ NEW SCHEMA: Query users + user_profiles where role='instructor'
    const [instructors] = await db.query(
      `SELECT u.id, u.email, u.created_at,
              p.first_name, p.last_name, p.full_name, p.department
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.role = 'instructor' AND u.deleted_at IS NULL
       ORDER BY u.created_at DESC`
    );

    // Format for backwards compatibility
    const formattedInstructors = instructors.map(instructor => ({
      id: instructor.id,
      first_name: instructor.first_name,
      last_name: instructor.last_name,
      email: instructor.email,
      department: instructor.department,
      created_at: instructor.created_at,
    }));

    res.status(200).json(formattedInstructors);
  } catch (err) {
    console.error("Error fetching instructors:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single instructor by ID
export const getInstructorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid instructor ID format" });
    }

    // ✅ NEW SCHEMA: Query users + user_profiles
    const [instructors] = await db.query(
      `SELECT u.id, u.email, u.created_at,
              p.first_name, p.last_name, p.full_name, p.department
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ? AND u.role = 'instructor' AND u.deleted_at IS NULL`,
      [parseInt(id)]
    );

    if (instructors.length === 0) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    const instructor = instructors[0];

    res.status(200).json({
      id: instructor.id,
      first_name: instructor.first_name,
      last_name: instructor.last_name,
      email: instructor.email,
      department: instructor.department,
      created_at: instructor.created_at,
    });
  } catch (err) {
    console.error("Error fetching instructor:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update instructor profile
export const updateInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, department } = req.body;

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
      "SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL",
      [email, parseInt(id)]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const connection = await db.getConnection();

    try {
      // ✅ NEW SCHEMA: Update users table
      await connection.query(
        "UPDATE users SET email = ? WHERE id = ?",
        [email, parseInt(id)]
      );

      // ✅ NEW SCHEMA: Update user_profiles table
      const fullName = `${first_name} ${last_name}`.trim();
      const [result] = await connection.query(
        "UPDATE user_profiles SET first_name = ?, last_name = ?, full_name = ?, department = ? WHERE user_id = ?",
        [first_name, last_name, fullName, department || null, parseInt(id)]
      );

      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Instructor not found" });
      }

      res.status(200).json({ message: "Instructor profile updated successfully" });
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error updating instructor:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete an instructor
export const deleteInstructor = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid instructor ID format" });
    }

    // ✅ NEW SCHEMA: Soft delete instructor (mark as deleted)
    const [result] = await db.query(
      "UPDATE users SET deleted_at = NOW(), status = 'inactive' WHERE id = ? AND role = 'instructor'",
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

    if (isNaN(instructor_id)) {
      return res.status(400).json({ error: "Invalid instructor ID format" });
    }

    // ✅ NEW SCHEMA: Get student statistics (count users with role='student')
    const [studentStats] = await db.query(
      `SELECT COUNT(*) as total_students 
       FROM users 
       WHERE role = 'student' AND deleted_at IS NULL`
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
      `SELECT COUNT(DISTINCT id) as total_groups FROM student_groups`
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

    if (!id) {
      return res.status(400).json({ error: "Invalid project ID format" });
    }

    // ✅ NEW SCHEMA: Query projects with client info from users + user_profiles
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
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projects[0];

    res.status(200).json({
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      created_at: project.created_at,
      client_first_name: project.client_first_name,
      client_last_name: project.client_last_name,
      client_email: project.client_email,
    });
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