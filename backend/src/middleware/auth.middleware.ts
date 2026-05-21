import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db";
import { AppError } from "./errorHandler";
import { verifyToken } from "../utils/jwt";

// Extend Express Request to carry the authenticated user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError("Invalid or expired token", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new AppError("User no longer exists", 401);
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};
