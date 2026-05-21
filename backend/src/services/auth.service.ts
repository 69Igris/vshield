import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { signToken } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";
import type { LoginInput, RegisterInput } from "../validations/auth.validation";

export const registerUser = async (input: RegisterInput) => {
  const { name, email, password } = input;

  // Check for duplicate
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, email: user.email });

  return { user, token };
};

export const loginUser = async (input: LoginInput) => {
  const { email, password } = input;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken({ userId: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};
