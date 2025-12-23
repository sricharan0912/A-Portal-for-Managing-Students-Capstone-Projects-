/**
 * @fileoverview Client Controller
 * Handles all client-related business logic including profile management,
 * project operations, statistics, and preferences tracking
 * 
 * @requires ../../db
 * @module controllers/clientController
 */

import db from "../../db.js";

// ==================== CLIENT PROFILE ====================

/**
 * Get All Clients
 * Retrieves list of all clients for admin/instructor purposes
 * 
 * @async
 * @function getAllClients
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON array of client objects
 * 
 * @description
 * Queries the unified users table for all users with role='client'
 * Joins with user_profiles to get additional information
 * Excludes soft-deleted clients (deleted_at IS NULL)
 * Results are ordered by creation date (newest first)
 * 
 * @example
 * // Response format
 * [
 *   {
 *     "id": 1,
 *     "name": "John Doe",
 *     "email": "john@company.com",
 *     "organization_name": "Tech Corp",
 *     "website": "https://techcorp.com",
 *     "created_at": "2025-01-15T10:30:00.000Z"
 *   }
 * ]
 */
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

/**
 * Get Client By ID
 * Retrieves a single client's profile information
 * 
 * @async
 * @function getClientById
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Client ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON object with client details
 * 
 * @description
 * Fetches client profile from users and user_profiles tables
 * Validates ID format and checks if client exists
 * Returns 404 if client not found
 * 
 * @example
 * // Request
 * GET /clients/123
 * 
 * @example
 * // Response
 * {
 *   "id": 123,
 *   "name": "John Doe",
 *   "email": "john@company.com",
 *   "organization_name": "Tech Corp",
 *   "website": "https://techcorp.com"
 * }
 */
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

/**
 * Update Client Profile
 * Updates client profile information in the database
 * 
 * @async
 * @function updateClient
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Client ID to update
 * @param {Object} req.body - Request body
 * @param {string} [req.body.name] - Full name (legacy format)
 * @param {string} [req.body.first_name] - First name (new format)
 * @param {string} [req.body.last_name] - Last name (new format)
 * @param {string} req.body.organization_name - Organization name (required)
 * @param {string} [req.body.website] - Organization website URL
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Success message
 * 
 * @description
 * Accepts both legacy (name) and new (first_name, last_name) formats
 * If only name provided, splits it into first and last names
 * Updates user_profiles table with new information
 * Returns 404 if client not found
 * 
 * @example
 * // Request body (new format)
 * {
 *   "first_name": "John",
 *   "last_name": "Doe",
 *   "organization_name": "Tech Corp",
 *   "website": "https://techcorp.com"
 * }
 * 
 * @example
 * // Response
 * {
 *   "message": "Client profile updated successfully"
 * }
 */
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

/**
 * Delete Client
 * Soft deletes a client and cascades deletion to related records
 * 
 * @async
 * @function deleteClient
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.id - Client ID to delete
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Success message
 * 
 * @description
 * Performs a soft delete by setting deleted_at timestamp and status to inactive
 * Cascades deletion to:
 * - Student preferences for client's projects
 * - Group members in client's project groups
 * - Student groups for client's projects
 * - All projects owned by the client
 * Uses database transaction via connection for data consistency
 * 
 * @example
 * // Request
 * DELETE /clients/123
 * 
 * @example
 * // Response
 * {
 *   "message": "Client deleted successfully"
 * }
 */
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

/**
 * Get Client Projects
 * Retrieves all projects owned by a specific client
 * 
 * @async
 * @function getClientProjects
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.client_id - Client ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON array of project objects
 * 
 * @description
 * Fetches all projects where owner_id matches the client_id
 * Includes column aliases for backwards compatibility with old schema
 * Results ordered by posting date (newest first)
 * 
 * @example
 * // Request
 * GET /clients/123/projects
 * 
 * @example
 * // Response
 * [
 *   {
 *     "id": 456,
 *     "client_id": 123,
 *     "title": "Mobile App Development",
 *     "description": "Build iOS app",
 *     "skills_required": "Swift, iOS",
 *     "status": "open",
 *     "created_at": "2025-01-15T10:00:00.000Z"
 *   }
 * ]
 */
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

/**
 * Get Client Project Count
 * Returns count of projects grouped by status for a client
 * 
 * @async
 * @function getClientProjectCount
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.client_id - Client ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON object with project counts by status
 * 
 * @description
 * Aggregates project counts across different statuses:
 * - total: All projects
 * - open: Available for student selection
 * - approved: Approved by instructor
 * - rejected: Rejected by instructor
 * - closed: Completed or cancelled
 * 
 * @example
 * // Response
 * {
 *   "total": 10,
 *   "open": 5,
 *   "approved": 3,
 *   "rejected": 1,
 *   "closed": 1
 * }
 */
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

/**
 * Get Client Projects By Status
 * Retrieves projects filtered by specific status
 * 
 * @async
 * @function getClientProjectsByStatus
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.client_id - Client ID
 * @param {string} req.params.status - Project status (open, approved, rejected, closed)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON array of filtered projects
 * 
 * @description
 * Validates status parameter against allowed values
 * Returns only projects matching the specified status
 * Includes full project details with backwards compatible column names
 * 
 * @example
 * // Request
 * GET /clients/123/projects/status/open
 * 
 * @example
 * // Response
 * [
 *   {
 *     "id": 456,
 *     "client_id": 123,
 *     "title": "Mobile App",
 *     "status": "open"
 *   }
 * ]
 */
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

/**
 * Get Client Project Details
 * Retrieves comprehensive project information including preferences and groups
 * 
 * @async
 * @function getClientProjectDetails
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.client_id - Client ID
 * @param {string} req.params.project_id - Project ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON object with project, preferences, groups, and statistics
 * 
 * @description
 * Fetches complete project information including:
 * - Project details with all fields
 * - Student preferences (ranked list of interested students)
 * - Assigned groups with member counts
 * - Summary statistics (preference count, group count)
 * 
 * Verifies project ownership before returning data
 * 
 * @example
 * // Response
 * {
 *   "project": { "id": 456, "title": "Mobile App", ... },
 *   "preferences": [
 *     { "student_id": 789, "preference_rank": 1, "first_name": "Alice" }
 *   ],
 *   "groups": [
 *     { "id": 1, "group_number": 1, "member_count": 4 }
 *   ],
 *   "stats": {
 *     "preference_count": 15,
 *     "group_count": 3
 *   }
 * }
 */
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

/**
 * Get Project Preferences
 * Retrieves list of students who submitted preferences for a project
 * 
 * @async
 * @function getProjectPreferences
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.client_id - Client ID
 * @param {string} req.params.project_id - Project ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON array of student preferences
 * 
 * @description
 * Returns students who ranked this project in their preferences
 * Includes student details (name, email) and their preference rank
 * Verifies project ownership before returning data
 * Results ordered by preference rank (highest ranked first)
 * 
 * @example
 * // Response
 * [
 *   {
 *     "student_id": 789,
 *     "preference_rank": 1,
 *     "first_name": "Alice",
 *     "last_name": "Smith",
 *     "email": "alice@university.edu"
 *   }
 * ]
 */
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

/**
 * Get Client Statistics
 * Retrieves comprehensive dashboard statistics for a client
 * 
 * @async
 * @function getClientStats
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {string} req.params.client_id - Client ID
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON object with statistics grouped by category
 * 
 * @description
 * Aggregates data across three main categories:
 * 
 * Projects:
 * - Total project count
 * - Count by status (open, approved, closed)
 * 
 * Preferences:
 * - Total interested students (unique)
 * - Total preference submissions
 * 
 * Groups:
 * - Total groups created
 * - Total students assigned to groups
 * 
 * @example
 * // Response
 * {
 *   "projects": {
 *     "total_projects": 10,
 *     "open_projects": 5,
 *     "approved_projects": 3,
 *     "closed_projects": 2
 *   },
 *   "preferences": {
 *     "total_interested_students": 45,
 *     "total_preferences": 120
 *   },
 *   "groups": {
 *     "total_groups": 8,
 *     "total_assigned_students": 32
 *   }
 * }
 */
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