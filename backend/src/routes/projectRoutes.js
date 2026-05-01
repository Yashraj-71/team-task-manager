import express from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ensureProjectAccess } from "../services/projectAccess.js";
import { AppError } from "../utils/errors.js";

const router = express.Router();

const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().max(1000, "Description is too long").optional().default("")
});

const memberSchema = z.object({
  userId: z.coerce.number().int().positive("User ID must be valid")
});

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const query = req.user.role === "ADMIN"
      ? `SELECT p.*, u.name AS owner_name,
            COUNT(DISTINCT pm.user_id) AS member_count,
            COUNT(DISTINCT t.id) AS task_count
         FROM projects p
         JOIN users u ON u.id = p.owner_id
         LEFT JOIN project_members pm ON pm.project_id = p.id
         LEFT JOIN tasks t ON t.project_id = p.id
         GROUP BY p.id, u.name
         ORDER BY p.created_at DESC`
      : `SELECT p.*, u.name AS owner_name,
            COUNT(DISTINCT pm.user_id) AS member_count,
            COUNT(DISTINCT t.id) AS task_count
         FROM projects p
         JOIN users u ON u.id = p.owner_id
         JOIN project_members mine ON mine.project_id = p.id AND mine.user_id = $1
         LEFT JOIN project_members pm ON pm.project_id = p.id
         LEFT JOIN tasks t ON t.project_id = p.id
         GROUP BY p.id, u.name
         ORDER BY p.created_at DESC`;

    const result = await pool.query(query, req.user.role === "ADMIN" ? [] : [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/members", requireRole("ADMIN"), async (_req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role FROM users ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole("ADMIN"), validate(projectSchema), async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const { name, description } = req.validatedBody;

    const projectResult = await client.query(
      `INSERT INTO projects (name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, req.user.id]
    );

    const project = projectResult.rows[0];

    await client.query(
      "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [project.id, req.user.id]
    );

    await client.query("COMMIT");
    res.status(201).json(project);
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

router.get("/:projectId", async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const existsResult = await pool.query("SELECT id FROM projects WHERE id = $1", [projectId]);

    if (existsResult.rowCount === 0) {
      throw new AppError(404, "Project not found");
    }

    await ensureProjectAccess(req.user, projectId);

    const [projectResult, memberResult] = await Promise.all([
      pool.query(
        `SELECT p.*, u.name AS owner_name
         FROM projects p
         JOIN users u ON u.id = p.owner_id
         WHERE p.id = $1`,
        [projectId]
      ),
      pool.query(
        `SELECT u.id, u.name, u.email, u.role
         FROM project_members pm
         JOIN users u ON u.id = pm.user_id
         WHERE pm.project_id = $1
         ORDER BY u.name ASC`,
        [projectId]
      )
    ]);

    if (projectResult.rowCount === 0) {
      throw new AppError(404, "Project not found");
    }

    res.json({
      ...projectResult.rows[0],
      members: memberResult.rows
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:projectId/members", requireRole("ADMIN"), validate(memberSchema), async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const { userId } = req.validatedBody;

    const projectExists = await pool.query("SELECT id FROM projects WHERE id = $1", [projectId]);
    if (projectExists.rowCount === 0) {
      throw new AppError(404, "Project not found");
    }

    const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (userExists.rowCount === 0) {
      throw new AppError(404, "User not found");
    }

    await pool.query(
      "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [projectId, userId]
    );

    res.status(201).json({ message: "Member added to project" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:projectId/members/:userId", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = Number(req.params.userId);

    await pool.query(
      "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2",
      [projectId, userId]
    );

    res.json({ message: "Member removed from project" });
  } catch (error) {
    next(error);
  }
});

export default router;
