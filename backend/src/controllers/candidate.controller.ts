import { NextFunction, Request, Response } from "express";
import {
  bulkCreateCandidates,
  createCandidate,
  deleteCandidate,
  getCandidateAnalytics,
  getCandidateById,
  getCandidateStats,
  listCandidates,
  updateCandidate,
} from "../services/candidate.service";
import {
  bulkCreateSchema,
  createCandidateSchema,
  listQuerySchema,
  updateCandidateSchema,
} from "../validations/candidate.validation";
import { AppError } from "../middleware/errorHandler";

const requireUser = (req: Request) => {
  if (!req.user) throw new AppError("Unauthorized", 401);
  return req.user;
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = requireUser(req);
    const input = createCandidateSchema.parse(req.body);
    const candidate = await createCandidate(user.id, input);
    return res.status(201).json({
      success: true,
      message: "Candidate created",
      data: candidate,
    });
  } catch (err) {
    return next(err);
  }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = requireUser(req);
    const query = listQuerySchema.parse(req.query);
    const result = await listCandidates(user.id, query);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = requireUser(req);
    const candidate = await getCandidateById(user.id, req.params.id);
    return res.json({ success: true, data: candidate });
  } catch (err) {
    return next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = requireUser(req);
    const input = updateCandidateSchema.parse(req.body);
    const candidate = await updateCandidate(user.id, req.params.id, input);
    return res.json({
      success: true,
      message: "Candidate updated",
      data: candidate,
    });
  } catch (err) {
    return next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = requireUser(req);
    const result = await deleteCandidate(user.id, req.params.id);
    return res.json({
      success: true,
      message: "Candidate deleted",
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

export const stats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = requireUser(req);
    const data = await getCandidateStats(user.id);
    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
};

export const bulkCreate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = requireUser(req);
    const { candidates } = bulkCreateSchema.parse(req.body);
    const result = await bulkCreateCandidates(user.id, candidates);
    return res.status(result.failedCount === 0 ? 201 : 207).json({
      success: true,
      message:
        result.failedCount === 0
          ? `Created ${result.createdCount} candidates`
          : `Created ${result.createdCount}, failed ${result.failedCount}`,
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

export const analytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = requireUser(req);
    const data = await getCandidateAnalytics(user.id);
    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
};
