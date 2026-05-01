import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../utils/errors.js";
import { getJwtSecret } from "../utils/jwt.js";

const router = express.Router();

const authSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER")
});

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

router.post("/signup", validate(authSchema), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.validatedBody;

    if (!name) {
      throw new AppError(400, "Name is required");
    }

    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rowCount > 0) {
      throw new AppError(409, "Email is already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, passwordHash, role]
    );

    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (error) {
    next(error);
  }
});

router.post("/login", validate(authSchema.omit({ name: true, role: true })), async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;
    const result = await pool.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      throw new AppError(401, "Invalid credentials");
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new AppError(401, "Invalid credentials");
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, "User not found");
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
