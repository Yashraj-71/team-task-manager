import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { pool } from "./db/pool.js";
import { app } from "./app.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, "db", "schema.sql");
const PORT = process.env.PORT || 5000;

async function bootstrap() {
  const schema = await fs.readFile(schemaPath, "utf8");
  await pool.query(schema);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Unable to start server:", error);
  process.exit(1);
});
