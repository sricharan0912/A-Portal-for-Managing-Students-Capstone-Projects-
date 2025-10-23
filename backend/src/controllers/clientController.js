import db from "../../db.js";

// ==================== CLIENT PROFILE ====================

// Get all clients (for admin/instructor purposes)
export const getAllClients = async (req, res) => {
  try {
    const [clients] = await db.query(
      "SELECT id, name, email, organization_name, website, created_at FROM clients ORDER BY created_at DESC"
    );
    res.status(200).json(clients);
  } catch (err) {
    console.error("Error fetching clients:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single client by ID
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify id is numeric
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    const [clients] = await db.query(
      "SELECT id, name, email, organization_name, website FROM clients WHERE id = ?",
      [parseInt(id)]
    );

    if (clients.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.status(200).json(clients[0]);
  } catch (err) {
    console.error("Error fetching client:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update client profile
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, organization_name, website } = req.body;

    // Verify id is numeric
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // Validate required fields
    if (!name || !organization_name) {
      return res.status(400).json({
        error: "name and organization_name are required",
      });
    }

    const [result] = await db.query(
      "UPDATE clients SET name = ?, organization_name = ?, website = ? WHERE id = ?",
      [name, organization_name, website || null, parseInt(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.status(200).json({ message: "Client profile updated successfully" });
  } catch (err) {
    console.error("Error updating client:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a client
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify id is numeric
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // Get all projects for this client
    const [projects] = await db.query(
      "SELECT id FROM projects WHERE client_id = ?",
      [parseInt(id)]
    );

    // Delete all student preferences for these projects
    for (const project of projects) {
      await db.query(
        "DELETE FROM student_preferences WHERE project_id = ?",
        [project.id]
      );
    }

    // Delete all projects for this client
    await db.query("DELETE FROM projects WHERE client_id = ?", [parseInt(id)]);

    // Delete client
    const [result] = await db.query(
      "DELETE FROM clients WHERE id = ?",
      [parseInt(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.status(200).json({ message: "Client deleted successfully" });
  } catch (err) {
    console.error("Error deleting client:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==================== CLIENT PROJECTS ====================

// Get all projects for a specific client
export const getClientProjects = async (req, res) => {
  try {
    const { client_id } = req.params;

    // Verify client_id is numeric
    if (isNaN(client_id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
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

    res.status(200).json(projects);
  } catch (err) {
    console.error("Error fetching client projects:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get project count for a client
export const getClientProjectCount = async (req, res) => {
  try {
    const { client_id } = req.params;

    // Verify client_id is numeric
    if (isNaN(client_id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    const [result] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
       FROM projects 
       WHERE client_id = ?`,
      [parseInt(client_id)]
    );

    res.status(200).json(result[0] || {
      total: 0,
      open: 0,
      approved: 0,
      rejected: 0,
      closed: 0,
    });
  } catch (err) {
    console.error("Error fetching project count:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get projects by status for a client
export const getClientProjectsByStatus = async (req, res) => {
  try {
    const { client_id, status } = req.params;

    // Verify client_id is numeric
    if (isNaN(client_id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // Validate status
    const validStatuses = ["open", "approved", "rejected", "closed"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const [projects] = await db.query(
      `SELECT id, client_id, title, description, skills_required, category, 
              team_size, start_date, end_date, complexity_level, deliverables, 
              project_location, industry, status, created_at
       FROM projects 
       WHERE client_id = ? AND status = ?
       ORDER BY created_at DESC`,
      [parseInt(client_id), status.toLowerCase()]
    );

    res.status(200).json(projects);
  } catch (err) {
    console.error("Error fetching projects by status:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==================== CLIENT PROJECT DETAILS ====================

// Get single project with preferences and team info
export const getClientProjectDetails = async (req, res) => {
  try {
    const { client_id, project_id } = req.params;

    // Verify IDs are numeric
    if (isNaN(client_id) || isNaN(project_id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Get project
    const [projects] = await db.query(
      `SELECT id, client_id, title, description, skills_required, category, 
              team_size, start_date, end_date, complexity_level, deliverables, 
              project_location, industry, status, created_at
       FROM projects 
       WHERE id = ? AND client_id = ?`,
      [parseInt(project_id), parseInt(client_id)]
    );

    if (projects.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projects[0];

    // Get preferences for this project
    const [preferences] = await db.query(
      `SELECT sp.id, sp.student_id, sp.preference_rank, s.first_name, s.last_name, s.email
       FROM student_preferences sp
       JOIN students s ON sp.student_id = s.id
       WHERE sp.project_id = ?
       ORDER BY sp.preference_rank ASC`,
      [parseInt(project_id)]
    );

    // Get assigned groups for this project
    const [groups] = await db.query(
      `SELECT sg.id, sg.group_number, COUNT(gm.student_id) as member_count
       FROM student_groups sg
       LEFT JOIN group_members gm ON sg.id = gm.group_id
       WHERE sg.project_id = ?
       GROUP BY sg.id`,
      [parseInt(project_id)]
    );

    res.status(200).json({
      project,
      preferences,
      groups,
      stats: {
        preference_count: preferences.length,
        group_count: groups.length,
      },
    });
  } catch (err) {
    console.error("Error fetching project details:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get students who submitted preferences for a project
export const getProjectPreferences = async (req, res) => {
  try {
    const { client_id, project_id } = req.params;

    // Verify IDs are numeric
    if (isNaN(client_id) || isNaN(project_id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Verify project belongs to client
    const [projectCheck] = await db.query(
      "SELECT id FROM projects WHERE id = ? AND client_id = ?",
      [parseInt(project_id), parseInt(client_id)]
    );

    if (projectCheck.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Get preferences
    const [preferences] = await db.query(
      `SELECT sp.id, sp.student_id, sp.preference_rank, s.first_name, s.last_name, s.email
       FROM student_preferences sp
       JOIN students s ON sp.student_id = s.id
       WHERE sp.project_id = ?
       ORDER BY sp.preference_rank ASC`,
      [parseInt(project_id)]
    );

    res.status(200).json(preferences);
  } catch (err) {
    console.error("Error fetching project preferences:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==================== CLIENT STATISTICS ====================

// Get client dashboard statistics
export const getClientStats = async (req, res) => {
  try {
    const { client_id } = req.params;

    // Verify client_id is numeric
    if (isNaN(client_id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // Get project stats
    const [projectStats] = await db.query(
      `SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_projects,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_projects,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_projects
       FROM projects 
       WHERE client_id = ?`,
      [parseInt(client_id)]
    );

    // Get preference stats
    const [prefStats] = await db.query(
      `SELECT COUNT(DISTINCT sp.student_id) as total_interested_students,
              COUNT(*) as total_preferences
       FROM student_preferences sp
       JOIN projects p ON sp.project_id = p.id
       WHERE p.client_id = ?`,
      [parseInt(client_id)]
    );

    // Get group stats
    const [groupStats] = await db.query(
      `SELECT COUNT(DISTINCT sg.id) as total_groups,
              COUNT(gm.student_id) as total_assigned_students
       FROM student_groups sg
       LEFT JOIN group_members gm ON sg.id = gm.group_id
       JOIN projects p ON sg.project_id = p.id
       WHERE p.client_id = ?`,
      [parseInt(client_id)]
    );

    res.status(200).json({
      projects: projectStats[0] || {
        total_projects: 0,
        open_projects: 0,
        approved_projects: 0,
        closed_projects: 0,
      },
      preferences: prefStats[0] || {
        total_interested_students: 0,
        total_preferences: 0,
      },
      groups: groupStats[0] || {
        total_groups: 0,
        total_assigned_students: 0,
      },
    });
  } catch (err) {
    console.error("Error fetching client stats:", err);
    res.status(500).json({ error: "Server error" });
  }
};