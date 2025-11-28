import db from "../../db.js";

// ==================== STUDENT AUTHENTICATION ====================

// Get all students (for admin/instructor purposes)
export const getAllStudents = async (req, res) => {
  try {
    // ✅ NEW SCHEMA: Query users + user_profiles where role='student'
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

    res.status(200).json(formattedStudents);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single student by ID
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    // ✅ NEW SCHEMA: Query users + user_profiles
    const [students] = await db.query(
      `SELECT u.id, u.email, u.created_at,
              p.first_name, p.last_name, p.full_name
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ? AND u.role = 'student' AND u.deleted_at IS NULL`,
      [parseInt(id)]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = students[0];

    res.status(200).json({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
    });
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update student profile
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        error: "first_name, last_name, and email are required",
      });
    }

    // Check if email already exists (excluding current student)
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
        "UPDATE user_profiles SET first_name = ?, last_name = ?, full_name = ? WHERE user_id = ?",
        [first_name, last_name, fullName, parseInt(id)]
      );

      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.status(200).json({ message: "Student profile updated successfully" });
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a student
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    const connection = await db.getConnection();

    try {
      // Delete student preferences first (foreign key constraint)
      await connection.query(
        "DELETE FROM student_preferences WHERE student_id = ?",
        [parseInt(id)]
      );

      // Delete student from groups
      await connection.query(
        "DELETE FROM group_members WHERE student_id = ?",
        [parseInt(id)]
      );

      // ✅ NEW SCHEMA: Soft delete student (mark as deleted)
      const [result] = await connection.query(
        "UPDATE users SET deleted_at = NOW(), status = 'inactive' WHERE id = ? AND role = 'student'",
        [parseInt(id)]
      );

      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.status(200).json({ message: "Student deleted successfully" });
    } catch (err) {
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==================== STUDENT PREFERENCES ====================

// Get student's submitted preferences
export const getStudentPreferences = async (req, res) => {
  try {
    const { student_id } = req.params;

    if (isNaN(student_id)) {
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    // ✅ NEW SCHEMA: Query with column aliases for backwards compatibility
    const [preferences] = await db.query(
      `SELECT 
         sp.student_id, 
         sp.project_id, 
         sp.rank as preference_rank,
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
       ORDER BY sp.rank ASC`,
      [parseInt(student_id)]
    );

    res.status(200).json(preferences);
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Submit or update student preferences
export const submitPreferences = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { preferences } = req.body;

    if (isNaN(student_id)) {
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    // Validate preferences
    if (!Array.isArray(preferences) || preferences.length === 0) {
      return res.status(400).json({
        error: "Preferences must be a non-empty array",
      });
    }

    if (preferences.length > 3) {
      return res.status(400).json({
        error: "Maximum 3 preferences allowed",
      });
    }

    // Validate all projects exist
    for (const pref of preferences) {
      if (!pref.project_id || !pref.preference_rank) {
        return res.status(400).json({
          error: "Each preference must have project_id and preference_rank",
        });
      }

      const [project] = await db.query(
        "SELECT id FROM projects WHERE id = ?",
        [pref.project_id]
      );

      if (project.length === 0) {
        return res.status(400).json({
          error: `Project with ID ${pref.project_id} not found`,
        });
      }
    }

    // Delete existing preferences
    await db.query(
      "DELETE FROM student_preferences WHERE student_id = ?",
      [parseInt(student_id)]
    );

    // ✅ NEW SCHEMA: Insert new preferences with 'rank' column
    for (const pref of preferences) {
      await db.query(
        "INSERT INTO student_preferences (student_id, project_id, rank) VALUES (?, ?, ?)",
        [parseInt(student_id), pref.project_id, pref.preference_rank]
      );
    }

    res.status(200).json({ message: "Preferences submitted successfully" });
  } catch (err) {
    console.error("Error submitting preferences:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Clear student preferences
export const clearPreferences = async (req, res) => {
  try {
    const { student_id } = req.params;

    if (isNaN(student_id)) {
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    const [result] = await db.query(
      "DELETE FROM student_preferences WHERE student_id = ?",
      [parseInt(student_id)]
    );

    res.status(200).json({
      message: "Preferences cleared successfully",
      deletedCount: result.affectedRows,
    });
  } catch (err) {
    console.error("Error clearing preferences:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==================== STUDENT GROUP ====================

// Get student's assigned group
export const getStudentGroup = async (req, res) => {
  try {
    const { student_id } = req.params;

    if (isNaN(student_id)) {
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    // ✅ NEW SCHEMA: Query with column aliases for backwards compatibility
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
         p.status,
         p.owner_id as client_id
       FROM group_members gm
       JOIN student_groups sg ON gm.group_id = sg.id
       JOIN projects p ON sg.project_id = p.id
       WHERE gm.student_id = ?`,
      [parseInt(student_id)]
    );

    if (groupData.length === 0) {
      return res.json({ message: "No group assigned yet" });
    }

    res.status(200).json(groupData[0]);
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all group members for a student's group
export const getStudentGroupMembers = async (req, res) => {
  try {
    const { student_id } = req.params;

    if (isNaN(student_id)) {
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    // First, find the student's group
    const [groupData] = await db.query(
      `SELECT gm.group_id FROM group_members gm WHERE gm.student_id = ?`,
      [parseInt(student_id)]
    );

    if (groupData.length === 0) {
      return res.json({ 
        message: "Student not assigned to a group", 
        members: [] 
      });
    }

    const groupId = groupData[0].group_id;

    // ✅ NEW SCHEMA: Get all members with user_profiles join
    const [members] = await db.query(
      `SELECT gm.student_id, p.first_name, p.last_name, u.email 
       FROM group_members gm
       JOIN users u ON gm.student_id = u.id
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE gm.group_id = ?
       ORDER BY p.first_name ASC`,
      [groupId]
    );

    res.status(200).json(members);
  } catch (err) {
    console.error("Error fetching group members:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==================== STUDENT PROJECTS ====================

// Get all available projects (for browsing)
export const getAvailableProjects = async (req, res) => {
  try {
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
         posted_date as created_at
       FROM projects 
       WHERE status = 'open' 
       ORDER BY posted_date DESC`
    );

    res.status(200).json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get projects by category
export const getProjectsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({ error: "Category is required" });
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
         posted_date as created_at
       FROM projects 
       WHERE category = ? AND status = 'open'
       ORDER BY posted_date DESC`,
      [category]
    );

    res.status(200).json(projects);
  } catch (err) {
    console.error("Error fetching projects by category:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get projects by complexity level
export const getProjectsByComplexity = async (req, res) => {
  try {
    const { complexity } = req.params;

    if (!complexity) {
      return res.status(400).json({ error: "Complexity level is required" });
    }

    const validComplexity = ["Beginner", "Intermediate", "Advanced"];
    if (!validComplexity.includes(complexity)) {
      return res.status(400).json({ error: "Invalid complexity level" });
    }

    // ✅ NEW SCHEMA: Use difficulty_level instead of complexity_level
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
         posted_date as created_at
       FROM projects 
       WHERE difficulty_level = ? AND status = 'open'
       ORDER BY posted_date DESC`,
      [complexity]
    );

    res.status(200).json(projects);
  } catch (err) {
    console.error("Error fetching projects by complexity:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Search projects by keyword
export const searchProjects = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: "Search keyword is required" });
    }

    const searchTerm = `%${keyword}%`;

    // ✅ NEW SCHEMA: Search in required_skills instead of skills_required
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
         posted_date as created_at
       FROM projects 
       WHERE (title LIKE ? OR description LIKE ? OR required_skills LIKE ?) 
             AND status = 'open'
       ORDER BY posted_date DESC`,
      [searchTerm, searchTerm, searchTerm]
    );

    res.status(200).json(projects);
  } catch (err) {
    console.error("Error searching projects:", err);
    res.status(500).json({ error: "Server error" });
  }
};