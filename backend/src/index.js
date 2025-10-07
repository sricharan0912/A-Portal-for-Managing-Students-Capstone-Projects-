import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "../db.js";
import clientRoutes from "./routes/clientRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ✅ Register routes
app.use("/clients", clientRoutes);
app.use("/projects", projectRoutes);

app.get("/", (req, res) => res.send("✅ Backend is running"));

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
