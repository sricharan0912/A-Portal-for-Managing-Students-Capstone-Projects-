import db from "../../db.js";

// ==================== STUDENT AUTHENTICATION ====================

// Get all students (for admin/instructor purposes)
export const getAllStudents = async (req, res) => {
  try {
    const [students] = await db.query(
      "SELECT id, first_name, last_name, email, created_at FROM students ORDER BY created_at DESC"
    );
    res.status(200).json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single student by ID
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify id is numeric
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    const [students] = await db.query(
      "SELECT id, first_name, last_name, email FROM students WHERE id = ?",
      [parseInt(id)]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.status(200).json(students[0]);
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

    // Verify id is numeric
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
      "SELECT id FROM students WHERE email = ? AND id != ?",
      [email, parseInt(id)]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const [result] = await db.query(
      "UPDATE students SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
      [first_name, last_name, email, parseInt(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.status(200).json({ message: "Student profile updated successfully" });
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a student
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify id is numeric
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    // Delete student preferences first (foreign key constraint)
    await db.query("DELETE FROM student_preferences WHERE student_id = ?", [
      parseInt(id),
    ]);

    // Delete student from groups
    await db.query("DELETE FROM group_members WHERE student_id = ?", [
      parseInt(id),
    ]);

    // Delete student
    const [result] = await db.query(
      "DELETE FROM students WHERE id = ?",
      [parseInt(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.status(200).json({ message: "Student deleted successfully" });
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

    // Verify student_id is numeric
    if (isNaN(student_id)) {
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    const [preferences] = await db.query(
      `SELECT sp.id, sp.student_id, sp.project_id, sp.preference_rank, 
              p.title, p.description, p.category, p.complexity_level, 
              p.skills_required, p.team_size, p.start_date, p.end_date,
              p.project_location, p.deliverables, p.industry
       FROM student_preferences sp
       JOIN projects p ON sp.project_id = p.id
       WHERE sp.student_id = ?
       ORDER BY sp.preference_rank ASC`,
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

    // Verify student_id is numeric
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
    await db.query("DELETE FROM student_preferences WHERE student_id = ?", [
      parseInt(student_id),
    ]);

    // Insert new preferences
    for (const pref of preferences) {
      await db.query(
        "INSERT INTO student_preferences (student_id, project_id, preference_rank) VALUES (?, ?, ?)",
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

    // Verify student_id is numeric
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

    // Verify student_id is numeric
    if (isNaN(student_id)) {
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    const [groupData] = await db.query(
      `SELECT sg.id, sg.group_number, sg.project_id,
              p.id as project_id, p.title, p.description, p.category,
              p.skills_required, p.complexity_level, p.team_size,
              p.start_date, p.end_date, p.project_location, 
              p.deliverables, p.industry, p.status, p.client_id
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

    // Verify student_id is numeric
    if (isNaN(student_id)) {
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    // First, find the student's group
    const [groupData] = await db.query(
      `SELECT gm.group_id FROM group_members gm WHERE gm.student_id = ?`,
      [parseInt(student_id)]
    );

    if (groupData.length === 0) {
      return res.json({ message: "Student not assigned to a group", members: [] });
    }

    const groupId = groupData[0].group_id;

    // Get all members in the group
    const [members] = await db.query(
      `SELECT gm.student_id, s.first_name, s.last_name, s.email 
       FROM group_members gm
       JOIN students s ON gm.student_id = s.id
       WHERE gm.group_id = ?
       ORDER BY s.first_name ASC`,
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
    const [projects] = await db.query(
      `SELECT id, client_id, title, description, skills_required, category, 
              team_size, start_date, end_date, complexity_level, deliverables, 
              project_location, industry, status, created_at
       FROM projects 
       WHERE status = 'open' 
       ORDER BY created_at DESC`
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

    const [projects] = await db.query(
      `SELECT id, client_id, title, description, skills_required, category, 
              team_size, start_date, end_date, complexity_level, deliverables, 
              project_location, industry, status, created_at
       FROM projects 
       WHERE category = ? AND status = 'open'
       ORDER BY created_at DESC`,
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

    const [projects] = await db.query(
      `SELECT id, client_id, title, description, skills_required, category, 
              team_size, start_date, end_date, complexity_level, deliverables, 
              project_location, industry, status, created_at
       FROM projects 
       WHERE complexity_level = ? AND status = 'open'
       ORDER BY created_at DESC`,
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

    res.status(200).json(projects);
  } catch (err) {
    console.error("Error searching projects:", err);
    res.status(500).json({ error: "Server error" });
  }
};