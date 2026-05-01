import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = await fs.readFile(schemaPath, "utf8");
  await pool.query(schema);
  await pool.end();
  console.log("Database initialized successfully.");
}

initDb().catch(async (error) => {
  console.error("Failed to initialize database:", error);
  await pool.end();
  process.exit(1);
});
