import express from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ensureProjectAccess } from "../services/projectAccess.js";
import { AppError } from "../utils/errors.js";

const router = express.Router();

const taskSchema = z.object({
  projectId: z.coerce.number().int().positive("Project is required"),
  title: z.string().min(3, "Task title must be at least 3 characters"),
  description: z.string().max(1000, "Description is too long").optional().default(""),
  assignedTo: z.coerce.number().int().positive("Assignee is required").nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().nullable().optional()
});

const taskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"])
});

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      req.user.role === "ADMIN"
        ? `SELECT t.*, p.name AS project_name, u.name AS assigned_to_name, c.name AS created_by_name
           FROM tasks t
           JOIN projects p ON p.id = t.project_id
           LEFT JOIN users u ON u.id = t.assigned_to
           JOIN users c ON c.id = t.created_by
           ORDER BY t.created_at DESC`
        : `SELECT t.*, p.name AS project_name, u.name AS assigned_to_name, c.name AS created_by_name
           FROM tasks t
           JOIN projects p ON p.id = t.project_id
           JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
           LEFT JOIN users u ON u.id = t.assigned_to
           JOIN users c ON c.id = t.created_by
           ORDER BY t.created_at DESC`,
      req.user.role === "ADMIN" ? [] : [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole("ADMIN"), validate(taskSchema), async (req, res, next) => {
  try {
    const { projectId, title, description, assignedTo, status, priority, dueDate } = req.validatedBody;

    const projectExists = await pool.query("SELECT id FROM projects WHERE id = $1", [projectId]);
    if (projectExists.rowCount === 0) {
      throw new AppError(404, "Project not found");
    }

    await ensureProjectAccess(req.user, projectId);

    if (assignedTo) {
      const memberCheck = await pool.query(
        "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
        [projectId, assignedTo]
      );

      if (memberCheck.rowCount === 0) {
        throw new AppError(400, "Assignee must be a project member");
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, assigned_to, created_by, status, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [projectId, title, description, assignedTo ?? null, req.user.id, status, priority, dueDate || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/:taskId/status", validate(taskStatusSchema), async (req, res, next) => {
  try {
    const taskId = Number(req.params.taskId);
    const { status } = req.validatedBody;

    const taskResult = await pool.query("SELECT * FROM tasks WHERE id = $1", [taskId]);
    if (taskResult.rowCount === 0) {
      throw new AppError(404, "Task not found");
    }

    const task = taskResult.rows[0];
    await ensureProjectAccess(req.user, task.project_id);

    if (req.user.role !== "ADMIN" && task.assigned_to !== req.user.id) {
      throw new AppError(403, "You can only update your assigned tasks");
    }

    const result = await pool.query(
      `UPDATE tasks
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, taskId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/:taskId", requireRole("ADMIN"), validate(taskSchema), async (req, res, next) => {
  try {
    const taskId = Number(req.params.taskId);
    const { projectId, title, description, assignedTo, status, priority, dueDate } = req.validatedBody;

    const taskResult = await pool.query("SELECT id FROM tasks WHERE id = $1", [taskId]);
    if (taskResult.rowCount === 0) {
      throw new AppError(404, "Task not found");
    }

    const projectExists = await pool.query("SELECT id FROM projects WHERE id = $1", [projectId]);
    if (projectExists.rowCount === 0) {
      throw new AppError(404, "Project not found");
    }

    if (assignedTo) {
      const memberCheck = await pool.query(
        "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
        [projectId, assignedTo]
      );

      if (memberCheck.rowCount === 0) {
        throw new AppError(400, "Assignee must be a project member");
      }
    }

    const result = await pool.query(
      `UPDATE tasks
       SET project_id = $1,
           title = $2,
           description = $3,
           assigned_to = $4,
           status = $5,
           priority = $6,
           due_date = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [projectId, title, description, assignedTo ?? null, status, priority, dueDate || null, taskId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:taskId", requireRole("ADMIN"), async (req, res, next) => {
  try {
    await pool.query("DELETE FROM tasks WHERE id = $1", [Number(req.params.taskId)]);
    res.json({ message: "Task deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
