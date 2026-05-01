export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message || "Internal server error"
  });
}
