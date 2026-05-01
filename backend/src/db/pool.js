import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const databaseFile = process.env.DATABASE_FILE || path.resolve(process.cwd(), "backend", "data", "app.db");
fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

const db = new Database(databaseFile);
db.pragma("foreign_keys = ON");

function normalizeSql(sql, params) {
  const orderedParams = [];
  const normalizedSql = sql.replace(/\$(\d+)/g, (_, index) => {
    orderedParams.push(params[Number(index) - 1]);
    return "?";
  });

  return { normalizedSql, orderedParams };
}

function mapRows(rows) {
  return rows.map((row) => ({ ...row }));
}

async function query(sql, params = []) {
  const { normalizedSql, orderedParams } = normalizeSql(sql, params);
  const trimmedSql = normalizedSql.trim();
  const isBatch = trimmedSql.includes(";") && params.length === 0;

  if (isBatch) {
    db.exec(trimmedSql);
    return { rows: [], rowCount: 0 };
  }

  const statement = db.prepare(trimmedSql);
  const isReadQuery = /^(select|pragma|with)\b/i.test(trimmedSql);
  const hasReturning = /\breturning\b/i.test(trimmedSql);

  if (isReadQuery || hasReturning) {
    const rows = mapRows(statement.all(...orderedParams));
    return { rows, rowCount: rows.length };
  }

  const result = statement.run(...orderedParams);
  return { rows: [], rowCount: result.changes };
}

export const pool = {
  query,
  async connect() {
    return {
      query,
      release() {}
    };
  },
  async end() {
    db.close();
  }
};
