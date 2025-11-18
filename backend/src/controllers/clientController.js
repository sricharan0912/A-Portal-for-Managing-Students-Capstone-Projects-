import db from "../../db.js";

// ==================== CLIENT PROFILE ====================

// Get all clients (for admin/instructor purposes)
export const getAllClients = async (req, res) => {
  try {
    // ✅ NEW SCHEMA: Query users + user_profiles where role='client'
    const [clients] = await db.query(
      `SELECT u.id, u.email, u.created_at,
              p.first_name, p.last_name, p.full_name, 
              p.organization_name, p.website
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.role = 'client' AND u.deleted_at IS NULL
       ORDER BY u.created_at DESC`
    );

    // Format for backwards compatibility
    const formattedClients = clients.map(client => ({
      id: client.id,
      name: client.full_name || `${client.first_name || ''} ${client.last_name || ''}`.trim(),
      email: client.email,
      organization_name: client.organization_name,
      website: client.website,
      created_at: client.created_at,
    }));

    res.status(200).json(formattedClients);
  } catch (err) {
    console.error("Error fetching clients:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single client by ID
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // ✅ NEW SCHEMA: Query users + user_profiles
    const [clients] = await db.query(
      `SELECT u.id, u.email, u.created_at,
              p.first_name, p.last_name, p.full_name,
              p.organization_name, p.website
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ? AND u.role = 'client' AND u.deleted_at IS NULL`,
      [parseInt(id)]
    );

    if (clients.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    const client = clients[0];

    res.status(200).json({
      id: client.id,
      name: client.full_name || `${client.first_name || ''} ${client.last_name || ''}`.trim(),
      email: client.email,
      organization_name: client.organization_name,
      website: client.website,
    });
  } catch (err) {
    console.error("Error fetching client:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update client profile
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, first_name, last_name, organization_name, website } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
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
        error: "name or (first_name and last_name) are required",
      });
    }

    // Validate required fields
    if (!organization_name) {
      return res.status(400).json({
        error: "organization_name is required",
      });
    }

    // ✅ NEW SCHEMA: Update user_profiles table
    const [result] = await db.query(
      `UPDATE user_profiles 
       SET first_name = ?, last_name = ?, full_name = ?, 
           organization_name = ?, website = ? 
       WHERE user_id = ?`,
      [finalFirstName, finalLastName, finalFullName, organization_name, website || null, parseInt(id)]
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

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    const connection = await db.getConnection();

    try {
      // Get all projects for this client
      const [projects] = await connection.query(
        "SELECT id FROM projects WHERE owner_id = ?",
        [parseInt(id)]
      );

      // Delete all student preferences for these projects
      for (const project of projects) {
        await connection.query(
          "DELETE FROM student_preferences WHERE project_id = ?",
          [project.id]
        );
      }

      // Delete group members for groups of this client's projects
      await connection.query(
        `DELETE FROM group_members 
         WHERE group_id IN (
           SELECT sg.id FROM student_groups sg 
           WHERE sg.project_id IN (SELECT id FROM projects WHERE owner_id = ?)
         )`,
        [parseInt(id)]
      );

      // Delete student groups for this client's projects
      await connection.query(
        `DELETE FROM student_groups 
         WHERE project_id IN (SELECT id FROM projects WHERE owner_id = ?)`,
        [parseInt(id)]
      );

      // Delete all projects for this client
      await connection.query(
        "DELETE FROM projects WHERE owner_id = ?",
        [parseInt(id)]
      );

      // ✅ NEW SCHEMA: Soft delete client (mark as deleted)
      const [result] = await connection.query(
        "UPDATE users SET deleted_at = NOW(), status = 'inactive' WHERE id = ? AND role = 'client'",
        [parseInt(id)]
      );

      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Client not found" });
      }

      res.status(200).json({ message: "Client deleted successfully" });
    } catch (err) {
      connection.release();
      throw err;
    }
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

    if (isNaN(client_id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // ✅ NEW SCHEMA: Column aliases for backwards compatibility
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
       WHERE owner_id = ? 
       ORDER BY posted_date DESC`,
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

    if (isNaN(client_id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // ✅ NEW SCHEMA: Query with owner_id
    const [result] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
       FROM projects 
       WHERE owner_id = ?`,
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

    if (isNaN(client_id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // Validate status
    const validStatuses = ["open", "approved", "rejected", "closed"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // ✅ NEW SCHEMA: Column aliases for backwards compatibility
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
       WHERE owner_id = ? AND status = ?
       ORDER BY posted_date DESC`,
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

    if (isNaN(client_id) || isNaN(project_id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // ✅ NEW SCHEMA: Get project with column aliases
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
       WHERE id = ? AND owner_id = ?`,
      [parseInt(project_id), parseInt(client_id)]
    );

    if (projects.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projects[0];

    // ✅ NEW SCHEMA: Get preferences with user_profiles join
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

    if (isNaN(client_id) || isNaN(project_id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Verify project belongs to client
    const [projectCheck] = await db.query(
      "SELECT id FROM projects WHERE id = ? AND owner_id = ?",
      [parseInt(project_id), parseInt(client_id)]
    );

    if (projectCheck.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // ✅ NEW SCHEMA: Get preferences with user_profiles join
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

    if (isNaN(client_id)) {
      return res.status(400).json({ error: "Invalid client ID format" });
    }

    // ✅ NEW SCHEMA: Get project stats with owner_id
    const [projectStats] = await db.query(
      `SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_projects,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_projects,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_projects
       FROM projects 
       WHERE owner_id = ?`,
      [parseInt(client_id)]
    );

    // Get preference stats
    const [prefStats] = await db.query(
      `SELECT COUNT(DISTINCT sp.student_id) as total_interested_students,
              COUNT(*) as total_preferences
       FROM student_preferences sp
       JOIN projects p ON sp.project_id = p.id
       WHERE p.owner_id = ?`,
      [parseInt(client_id)]
    );

    // Get group stats
    const [groupStats] = await db.query(
      `SELECT COUNT(DISTINCT sg.id) as total_groups,
              COUNT(gm.student_id) as total_assigned_students
       FROM student_groups sg
       LEFT JOIN group_members gm ON sg.id = gm.group_id
       JOIN projects p ON sg.project_id = p.id
       WHERE p.owner_id = ?`,
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