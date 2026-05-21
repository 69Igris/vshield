import rateLimit from "express-rate-limit";

// Strict limit for auth routes — prevents brute-force login attempts.
// 10 requests per 15 minutes per IP.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many authentication attempts from this IP. Please try again in 15 minutes.",
  },
});

// Looser limit for verification routes — verification calls hit external
// APIs which may have per-second quotas. 30 requests per minute per IP.
export const verificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Verification rate limit exceeded. Slow down and retry shortly.",
  },
});

// Default API limiter — applied to all /api/* routes.
// 200 requests per minute per IP.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "API rate limit exceeded. Please slow down.",
  },
});
