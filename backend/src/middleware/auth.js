import jwt from "jsonwebtoken";
import { AppError } from "../utils/errors.js";
import { getJwtSecret } from "../utils/jwt.js";

export function authenticate(req, _res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required"));
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, "You do not have permission for this action"));
    }

    next();
  };
}
