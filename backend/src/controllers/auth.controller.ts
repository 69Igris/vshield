import { Request, Response, NextFunction } from "express";
import { loginUser, registerUser } from "../services/auth.service";
import {
  loginSchema,
  registerSchema,
} from "../validations/auth.validation";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = registerSchema.parse(req.body);
    const { user, token } = await registerUser(input);
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: { user, token },
    });
  } catch (err) {
    return next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = loginSchema.parse(req.body);
    const { user, token } = await loginUser(input);
    return res.json({
      success: true,
      message: "Logged in successfully",
      data: { user, token },
    });
  } catch (err) {
    return next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.user is set by authMiddleware
    return res.json({ success: true, data: { user: req.user } });
  } catch (err) {
    return next(err);
  }
};
