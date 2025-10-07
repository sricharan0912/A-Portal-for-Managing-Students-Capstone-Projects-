import express from "express";
import db from "../../db.js";

const router = express.Router();

// ✅ Create a new project
router.post("/", async (req, res) => {
  const { client_id, title, description, skills_required, category, team_size, status, start_date, end_date } = req.body;

  if (!client_id || !title || !description)
    return res.status(400).json({ error: "Client ID, title, and description are required" });

  try {
    await db.query(
      `INSERT INTO projects 
        (client_id, title, description, skills_required, category, team_size, status, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ]
    );

    res.status(201).json({ message: "Project created successfully ✅" });
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

export default router;
