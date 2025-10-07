import express from "express";
import bcrypt from "bcrypt";
import db from "../../db.js";

const router = express.Router();

// ✅ Client Signup
router.post("/signup", async (req, res) => {
  const { name, email, password, organization_name, website } = req.body;

  if (!name || !email || !password || !organization_name)
    return res
      .status(400)
      .json({ error: "Name, Email, Password, and Organization Name are required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO clients (name, email, password, organization_name, website) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, organization_name, website || null]
    );

    res.status(201).json({ message: "Client registered successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error while signing up" });
  }
});

// ✅ Client Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const [rows] = await db.query("SELECT * FROM clients WHERE email = ?", [email]);

    if (rows.length === 0)
      return res.status(404).json({ error: "Client not found" });

    const client = rows[0];
    const isMatch = await bcrypt.compare(password, client.password);

    if (!isMatch)
      return res.status(401).json({ error: "Invalid credentials" });

    res.json({
      message: "Login successful ✅",
      client: {
        id: client.id,
        name: client.name,
        organization_name: client.organization_name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error during login" });
  }
});

export default router;
