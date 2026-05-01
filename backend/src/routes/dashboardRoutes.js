import express from "express";
import { pool } from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const params = req.user.role === "ADMIN" ? [] : [req.user.id];
    const membershipJoin = req.user.role === "ADMIN"
      ? ""
      : "JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1";

    const [summaryResult, statusResult, overdueResult, myTasksResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) AS total_tasks,
           SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) AS completed_tasks,
           SUM(CASE WHEN status <> 'DONE' THEN 1 ELSE 0 END) AS open_tasks
         FROM tasks t
         ${membershipJoin}`,
        params
      ),
      pool.query(
        `SELECT status, COUNT(*) AS count
         FROM tasks t
         ${membershipJoin}
         GROUP BY status`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) AS overdue_tasks
         FROM tasks t
         ${membershipJoin}
         WHERE due_date IS NOT NULL
           AND date(due_date) < date('now')
           AND status <> 'DONE'`,
        params
      ),
      pool.query(
        `SELECT t.id, t.title, t.status, t.priority, t.due_date, p.name AS project_name
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         ${req.user.role === "ADMIN" ? "" : "JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1"}
         WHERE ${req.user.role === "ADMIN" ? "TRUE" : "t.assigned_to = $1"}
         ORDER BY CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END, t.due_date ASC, t.created_at DESC
         LIMIT 8`,
        params
      )
    ]);

    res.json({
      summary: {
        ...summaryResult.rows[0],
        overdue_tasks: overdueResult.rows[0].overdue_tasks
      },
      statusBreakdown: statusResult.rows,
      spotlightTasks: myTasksResult.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;
