import express from "express";
import db from "../../db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==================== GET ALL EVALUATIONS ====================

// Get all evaluations (filtered by role)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { role, instructorId, studentId, clientId } = req.user;
    let query = "";
    let params = [];

    if (role === "instructor" || role === "admin") {
      // Instructors see all evaluations
      query = `
        SELECT 
          e.*,
          sg.group_name,
          p.title as project_title,
          p.owner_id as client_id
        FROM evaluations e
        LEFT JOIN student_groups sg ON e.group_id = sg.id
        LEFT JOIN projects p ON e.project_id = p.id
        ORDER BY e.scheduled_date DESC, e.scheduled_time DESC
      `;
    } else if (role === "student") {
      // Students see evaluations for their groups OR global evaluations (no group_id)
      query = `
        SELECT 
          e.*,
          sg.group_name,
          p.title as project_title
        FROM evaluations e
        LEFT JOIN student_groups sg ON e.group_id = sg.id
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE e.group_id IN (
          SELECT group_id FROM group_members WHERE student_id = ? AND status = 'active'
        )
        OR e.group_id IS NULL
        ORDER BY e.scheduled_date DESC, e.scheduled_time DESC
      `;
      params = [studentId];
    } else if (role === "client") {
      // Clients see evaluations for their projects OR global evaluations (no project_id)
      query = `
        SELECT 
          e.*,
          sg.group_name,
          p.title as project_title
        FROM evaluations e
        LEFT JOIN student_groups sg ON e.group_id = sg.id
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE p.owner_id = ?
        OR e.project_id IS NULL
        ORDER BY e.scheduled_date DESC, e.scheduled_time DESC
      `;
      params = [clientId];
    } else {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const [evaluations] = await db.query(query, params);

    res.json({
      success: true,
      data: evaluations,
    });
  } catch (err) {
    console.error("Error fetching evaluations:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch evaluations",
    });
  }
});

// ==================== GET SINGLE EVALUATION ====================

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [evaluations] = await db.query(`
      SELECT 
        e.*,
        sg.group_name,
        p.title as project_title,
        p.owner_id as client_id
      FROM evaluations e
      LEFT JOIN student_groups sg ON e.group_id = sg.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.id = ?
    `, [id]);

    if (evaluations.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Evaluation not found",
      });
    }

    // Get group members if group_id exists
    let members = [];
    if (evaluations[0].group_id) {
      const [memberRows] = await db.query(`
        SELECT 
          gm.student_id,
          u.email,
          up.full_name as name
        FROM group_members gm
        JOIN users u ON gm.student_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE gm.group_id = ? AND gm.status = 'active'
      `, [evaluations[0].group_id]);
      members = memberRows;
    }

    res.json({
      success: true,
      data: {
        ...evaluations[0],
        members,
      },
    });
  } catch (err) {
    console.error("Error fetching evaluation:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch evaluation",
    });
  }
});

// ==================== CREATE EVALUATION (Instructor Only) ====================

router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Only instructors can create evaluations",
      });
    }

    const {
      title,
      description,
      evaluation_type,
      group_id,
      project_id,
      scheduled_date,
      scheduled_time,
      due_date,
      location,
      meeting_link,
      evaluator_name,
      notes,
    } = req.body;

    if (!title || !scheduled_date) {
      return res.status(400).json({
        success: false,
        error: "Title and scheduled date are required",
      });
    }

    const [result] = await db.query(`
      INSERT INTO evaluations (
        title, description, evaluation_type, group_id, project_id,
        scheduled_date, scheduled_time, due_date, location, meeting_link,
        evaluator_name, notes, status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, NOW())
    `, [
      title,
      description || null,
      evaluation_type || 'sprint',
      group_id || null,
      project_id || null,
      scheduled_date,
      scheduled_time || null,
      due_date || null,
      location || null,
      meeting_link || null,
      evaluator_name || null,
      notes || null,
      req.user.instructorId,
    ]);

    res.status(201).json({
      success: true,
      message: "Evaluation scheduled successfully",
      data: { id: result.insertId },
    });
  } catch (err) {
    console.error("Error creating evaluation:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create evaluation",
    });
  }
});

// ==================== UPDATE EVALUATION ====================

router.put("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Only instructors can update evaluations",
      });
    }

    const { id } = req.params;
    const {
      title,
      description,
      evaluation_type,
      group_id,
      project_id,
      scheduled_date,
      scheduled_time,
      due_date,
      location,
      meeting_link,
      evaluator_name,
      status,
      notes,
    } = req.body;

    const updates = [];
    const values = [];

    if (title !== undefined) { updates.push("title = ?"); values.push(title); }
    if (description !== undefined) { updates.push("description = ?"); values.push(description); }
    if (evaluation_type !== undefined) { updates.push("evaluation_type = ?"); values.push(evaluation_type); }
    if (group_id !== undefined) { updates.push("group_id = ?"); values.push(group_id); }
    if (project_id !== undefined) { updates.push("project_id = ?"); values.push(project_id); }
    if (scheduled_date !== undefined) { updates.push("scheduled_date = ?"); values.push(scheduled_date); }
    if (scheduled_time !== undefined) { updates.push("scheduled_time = ?"); values.push(scheduled_time); }
    if (due_date !== undefined) { updates.push("due_date = ?"); values.push(due_date); }
    if (location !== undefined) { updates.push("location = ?"); values.push(location); }
    if (meeting_link !== undefined) { updates.push("meeting_link = ?"); values.push(meeting_link); }
    if (evaluator_name !== undefined) { updates.push("evaluator_name = ?"); values.push(evaluator_name); }
    if (status !== undefined) { updates.push("status = ?"); values.push(status); }
    if (notes !== undefined) { updates.push("notes = ?"); values.push(notes); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    values.push(id);

    await db.query(
      `UPDATE evaluations SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: "Evaluation updated successfully",
    });
  } catch (err) {
    console.error("Error updating evaluation:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update evaluation",
    });
  }
});

// ==================== DELETE EVALUATION ====================

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Only instructors can delete evaluations",
      });
    }

    const { id } = req.params;

    await db.query("DELETE FROM evaluations WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Evaluation deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting evaluation:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete evaluation",
    });
  }
});

// ==================== GET UPCOMING EVALUATIONS ====================

router.get("/upcoming/list", verifyToken, async (req, res) => {
  try {
    const { role, studentId, clientId } = req.user;
    let query = "";
    let params = [];

    const baseQuery = `
      SELECT 
        e.*,
        sg.group_name,
        p.title as project_title
      FROM evaluations e
      LEFT JOIN student_groups sg ON e.group_id = sg.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.scheduled_date >= CURDATE()
        AND e.status IN ('scheduled', 'in_progress')
    `;

    if (role === "instructor" || role === "admin") {
      query = baseQuery + ` ORDER BY e.scheduled_date ASC, e.scheduled_time ASC LIMIT 10`;
    } else if (role === "student") {
      query = baseQuery + `
        AND e.group_id IN (
          SELECT group_id FROM group_members WHERE student_id = ? AND status = 'active'
        )
        ORDER BY e.scheduled_date ASC, e.scheduled_time ASC LIMIT 10
      `;
      params = [studentId];
    } else if (role === "client") {
      query = baseQuery + `
        AND p.owner_id = ?
        ORDER BY e.scheduled_date ASC, e.scheduled_time ASC LIMIT 10
      `;
      params = [clientId];
    }

    const [evaluations] = await db.query(query, params);

    res.json({
      success: true,
      data: evaluations,
    });
  } catch (err) {
    console.error("Error fetching upcoming evaluations:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch upcoming evaluations",
    });
  }
});

export default router;