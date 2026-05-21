import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { prisma } from "./config/db";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import {
  apiLimiter,
  authLimiter,
  verificationLimiter,
} from "./middleware/rateLimit";
import authRoutes from "./routes/auth.routes";
import candidateRoutes from "./routes/candidate.routes";
import verificationRoutes from "./routes/verification.routes";
import reportRoutes from "./routes/report.routes";
import mockApiRoutes from "./routes/mockApi.routes";

const app = express();

// =====================================================
// Global middleware
// =====================================================
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

// =====================================================
// Health check
// =====================================================
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "BGV Backend is running",
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ success: true, status: "ok" });
});

// =====================================================
// Routes (rate-limited)
// =====================================================
app.use("/api", apiLimiter); // default API limiter
app.use("/api/auth", authLimiter, authRoutes); // strict on auth
app.use("/api/candidates", candidateRoutes);
app.use("/api/verifications", verificationLimiter, verificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/mock-api", mockApiRoutes);

// =====================================================
// Error handling (must come last)
// =====================================================
app.use(notFoundHandler);
app.use(errorHandler);

// =====================================================
// Start server
// =====================================================
const server = app.listen(env.PORT, () => {
  console.log(`BGV Backend listening on port ${env.PORT} [${env.NODE_ENV}]`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("\nShutting down...");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default app;
