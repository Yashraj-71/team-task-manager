import { pool } from "../db/pool.js";

export async function canAccessProject(user, projectId) {
  if (user.role === "ADMIN") {
    return true;
  }

  const result = await pool.query(
    `SELECT 1
     FROM project_members
     WHERE project_id = $1 AND user_id = $2`,
    [projectId, user.id]
  );

  return result.rowCount > 0;
}

export async function ensureProjectAccess(user, projectId) {
  const hasAccess = await canAccessProject(user, projectId);

  if (!hasAccess) {
    const error = new Error("You do not have access to this project");
    error.statusCode = 403;
    throw error;
  }
}
