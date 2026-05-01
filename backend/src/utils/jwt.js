import { AppError } from "./errors.js";

const DEVELOPMENT_SECRET = "dev-local-jwt-secret";

export function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new AppError(500, "JWT_SECRET is required in production");
  }

  return DEVELOPMENT_SECRET;
}
