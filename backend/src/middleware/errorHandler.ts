import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

// Centralized error handler
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  // Our custom app errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Anything else
  console.error("[UNHANDLED ERROR]", err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
