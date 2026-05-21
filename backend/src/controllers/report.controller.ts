import { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { generateReport } from "../services/report.service";

export const download = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { buffer, fileName } = await generateReport({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      candidateId: req.params.id,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );
    res.setHeader("Content-Length", buffer.length.toString());
    return res.send(buffer);
  } catch (err) {
    return next(err);
  }
};
