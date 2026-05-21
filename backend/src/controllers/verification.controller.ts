import { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { startVerification } from "../services/verification.service";

export const start = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const candidateId = req.params.id;
    const result = await startVerification(req.user.id, candidateId);
    return res.json({
      success: true,
      message: "Verification completed",
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};
