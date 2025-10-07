import db from "../../db.js";

export const createClient = async (req, res) => {
  try {
    const { name, email, password, organization_name, website } = req.body;

    if (!name || !email || !password || !organization_name) {
      return res.status(400).json({ error: "All required fields must be filled." });
    }

    const [existing] = await db.query("SELECT * FROM clients WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already exists." });
    }

    const [result] = await db.query(
      `INSERT INTO clients (name, email, password, organization_name, website)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, password, organization_name, website]
    );

    res.status(201).json({ message: "Client registered successfully ✅", clientId: result.insertId });
  } catch (err) {
    console.error("Error creating client:", err);
    res.status(500).json({ error: "Server error" });
  }
};
