import express from "express";
import db from "../../db.js";

const router = express.Router();

// ✅ Create a new project
router.post("/", async (req, res) => {
  const { 
    client_id, 
    title, 
    description, 
    skills_required, 
    category, 
    team_size, 
    status, 
    start_date, 
    end_date,
    complexity_level,
    deliverables,
    project_location,
    industry
  } = req.body;

  if (!client_id || !title || !description)
    return res.status(400).json({ error: "Client ID, title, and description are required" });

  try {
    const [result] = await db.query(
      `INSERT INTO projects 
        (client_id, title, description, skills_required, category, team_size, status, start_date, end_date, complexity_level, deliverables, project_location, industry) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client_id,
        title,
        description,
        skills_required || null,
        category || null,
        team_size || null,
        status || "open",
        start_date || null,
        end_date || null,
        complexity_level || null,
        deliverables || null,
        project_location || null,
        industry || null,
      ]
    );

    res.status(201).json({ 
      message: "Project created successfully ✅",
      id: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error while creating project" });
  }
});

// ✅ Fetch all projects for a client
router.get("/:client_id", async (req, res) => {
  const { client_id } = req.params;

  try {
    const [rows] = await db.query("SELECT * FROM projects WHERE client_id = ?", [client_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// ✅ Delete a project
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  try {
    const [result] = await db.query("DELETE FROM projects WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json({ message: "Project deleted successfully ✅" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Database error while deleting project: " + err.message });
  }
});

// ✅ Update a project
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { 
    title, 
    description, 
    skills_required, 
    category, 
    team_size, 
    status, 
    start_date, 
    end_date,
    complexity_level,
    deliverables,
    project_location,
    industry
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  try {
    await db.query(
      `UPDATE projects SET 
        title = ?, 
        description = ?, 
        skills_required = ?, 
        category = ?, 
        team_size = ?, 
        status = ?, 
        start_date = ?, 
        end_date = ?,
        complexity_level = ?,
        deliverables = ?,
        project_location = ?,
        industry = ?
       WHERE id = ?`,
      [
        title,
        description,
        skills_required || null,
        category || null,
        team_size || null,
        status || "open",
        start_date || null,
        end_date || null,
        complexity_level || null,
        deliverables || null,
        project_location || null,
        industry || null,
        id
      ]
    );

    res.json({ message: "Project updated successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error while updating project" });
  }
});

export default router;