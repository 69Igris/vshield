import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { maskAadhaar, maskPan } from "../utils/mask";
import {
  createCandidateSchema,
  type CreateCandidateInput,
  type ListQueryInput,
  type UpdateCandidateInput,
} from "../validations/candidate.validation";

// Shape we expose to the client — never includes raw aadhaar/PAN
const toPublicCandidate = (c: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  aadhaarNumber: string;
  panNumber: string;
  dob: Date;
  address: string;
  status: string;
  reportUrl: string | null;
  reportGeneratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
}) => ({
  id: c.id,
  fullName: c.fullName,
  email: c.email,
  phone: c.phone,
  aadhaarMasked: maskAadhaar(c.aadhaarNumber),
  panMasked: maskPan(c.panNumber),
  dob: c.dob,
  address: c.address,
  status: c.status,
  reportUrl: c.reportUrl,
  reportGeneratedAt: c.reportGeneratedAt,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  createdById: c.createdById,
});

export const createCandidate = async (
  userId: string,
  input: CreateCandidateInput
) => {
  const candidate = await prisma.candidate.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      aadhaarNumber: input.aadhaarNumber,
      panNumber: input.panNumber,
      dob: input.dob,
      address: input.address,
      status: "PENDING",
      createdById: userId,
    },
  });
  return toPublicCandidate(candidate);
};

export const listCandidates = async (
  userId: string,
  query: ListQueryInput
) => {
  const { page, limit, search, status } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.CandidateWhereInput = {
    createdById: userId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.candidate.count({ where }),
  ]);

  return {
    items: items.map(toPublicCandidate),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const getCandidateById = async (userId: string, id: string) => {
  const candidate = await prisma.candidate.findFirst({
    where: { id, createdById: userId },
    include: {
      verificationLogs: {
        orderBy: { verifiedAt: "desc" },
      },
    },
  });
  if (!candidate) throw new AppError("Candidate not found", 404);

  return {
    ...toPublicCandidate(candidate),
    verificationLogs: candidate.verificationLogs.map((log) => ({
      id: log.id,
      verificationType: log.verificationType,
      verificationStatus: log.verificationStatus,
      responsePayload: log.responsePayload,
      verifiedAt: log.verifiedAt,
    })),
  };
};

export const updateCandidate = async (
  userId: string,
  id: string,
  input: UpdateCandidateInput
) => {
  // Make sure user owns the candidate
  const existing = await prisma.candidate.findFirst({
    where: { id, createdById: userId },
  });
  if (!existing) throw new AppError("Candidate not found", 404);

  const updated = await prisma.candidate.update({
    where: { id },
    data: input,
  });
  return toPublicCandidate(updated);
};

export const deleteCandidate = async (userId: string, id: string) => {
  const existing = await prisma.candidate.findFirst({
    where: { id, createdById: userId },
  });
  if (!existing) throw new AppError("Candidate not found", 404);

  // Logs cascade-delete via Prisma schema
  await prisma.candidate.delete({ where: { id } });
  return { id };
};

// Dashboard stats: counts by status for the current user
export const getCandidateStats = async (userId: string) => {
  const [total, verified, pending, failed, partial] = await Promise.all([
    prisma.candidate.count({ where: { createdById: userId } }),
    prisma.candidate.count({ where: { createdById: userId, status: "VERIFIED" } }),
    prisma.candidate.count({ where: { createdById: userId, status: "PENDING" } }),
    prisma.candidate.count({ where: { createdById: userId, status: "FAILED" } }),
    prisma.candidate.count({ where: { createdById: userId, status: "PARTIAL" } }),
  ]);
  return { total, verified, pending, failed, partial };
};

// Bulk create — validate each row individually so we can report per-row
// errors instead of failing the whole batch on the first bad record.
export interface BulkResult {
  totalRows: number;
  createdCount: number;
  failedCount: number;
  created: Array<{ row: number; id: string; fullName: string }>;
  failed: Array<{
    row: number;
    errors: { path: string; message: string }[];
    input?: Record<string, unknown>;
  }>;
}

export const bulkCreateCandidates = async (
  userId: string,
  rows: unknown[]
): Promise<BulkResult> => {
  const result: BulkResult = {
    totalRows: rows.length,
    createdCount: 0,
    failedCount: 0,
    created: [],
    failed: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 1; // 1-indexed for the user
    const raw = rows[i];

    // Validate
    const parsed = createCandidateSchema.safeParse(raw);
    if (!parsed.success) {
      const errors = (parsed.error as ZodError).errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      result.failed.push({
        row: rowNumber,
        errors,
        input: typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : undefined,
      });
      result.failedCount++;
      continue;
    }

    // Insert
    try {
      const c = await prisma.candidate.create({
        data: { ...parsed.data, status: "PENDING", createdById: userId },
        select: { id: true, fullName: true },
      });
      result.created.push({ row: rowNumber, id: c.id, fullName: c.fullName });
      result.createdCount++;
    } catch (err) {
      result.failed.push({
        row: rowNumber,
        errors: [
          {
            path: "_database",
            message:
              err instanceof Error ? err.message : "Database insert failed",
          },
        ],
      });
      result.failedCount++;
    }
  }

  return result;
};

// Analytics: last-7-days timeseries + verification (Aadhaar/PAN) success rate
export const getCandidateAnalytics = async (userId: string) => {
  // Fixed application timezone. Render runs in UTC, local dev typically runs
  // in IST — bucketing in a fixed TZ keeps the chart consistent everywhere.
  const TZ = "Asia/Kolkata";

  // YYYY-MM-DD in the app timezone (en-CA happens to format that way).
  const tzDateKey = (d: Date): string =>
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

  // Human label like "21 May" in the app timezone.
  const tzDateLabel = (d: Date): string =>
    new Intl.DateTimeFormat("en-IN", {
      timeZone: TZ,
      day: "2-digit",
      month: "short",
    }).format(d);

  // ----- Last 7 days of new candidates -----
  const now = new Date();
  const DAY_MS = 24 * 60 * 60 * 1000;
  // Use an 8-day UTC window so the query never misses a candidate whose
  // IST date falls inside the 7-day window but whose UTC timestamp is slightly older.
  const eightDaysAgo = new Date(now.getTime() - 8 * DAY_MS);

  const recentCandidates = await prisma.candidate.findMany({
    where: { createdById: userId, createdAt: { gte: eightDaysAgo } },
    select: { createdAt: true },
  });

  // Build 7 buckets going back from "today" in the app TZ.
  const buckets: { date: string; label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    buckets.push({
      date: tzDateKey(d),
      label: tzDateLabel(d),
      count: 0,
    });
  }
  for (const c of recentCandidates) {
    const key = tzDateKey(new Date(c.createdAt));
    const bucket = buckets.find((b) => b.date === key);
    if (bucket) bucket.count++;
  }

  // ----- Verification breakdown (Aadhaar / PAN, verified vs failed) -----
  // Two-step lookup: nested relation filters (`candidate: { createdById }`)
  // are unreliable on Prisma's MongoDB provider, so we first fetch this
  // user's candidate IDs and then filter logs by that list.
  const userCandidates = await prisma.candidate.findMany({
    where: { createdById: userId },
    select: { id: true },
  });
  const candidateIds = userCandidates.map((c) => c.id);

  // Fetch ALL logs (newest first) — we'll keep just the latest per
  // (candidate, verificationType) so re-running verification on the same
  // candidate doesn't inflate the bar chart counts.
  const allLogs =
    candidateIds.length === 0
      ? []
      : await prisma.verificationLog.findMany({
          where: { candidateId: { in: candidateIds } },
          select: {
            candidateId: true,
            verificationType: true,
            verificationStatus: true,
            verifiedAt: true,
          },
          orderBy: { verifiedAt: "desc" },
        });

  const seen = new Set<string>();
  const latestLogs: typeof allLogs = [];
  for (const log of allLogs) {
    const key = `${log.candidateId}:${log.verificationType}`;
    if (!seen.has(key)) {
      seen.add(key);
      latestLogs.push(log);
    }
  }

  const counters = {
    AADHAAR: { VERIFIED: 0, FAILED: 0 },
    PAN: { VERIFIED: 0, FAILED: 0 },
  };
  for (const l of latestLogs) {
    const t = l.verificationType as "AADHAAR" | "PAN";
    const s = l.verificationStatus as "VERIFIED" | "FAILED";
    if (counters[t]?.[s] !== undefined) counters[t][s]++;
  }

  const verificationBreakdown = [
    {
      type: "Aadhaar",
      verified: counters.AADHAAR.VERIFIED,
      failed: counters.AADHAAR.FAILED,
    },
    {
      type: "PAN",
      verified: counters.PAN.VERIFIED,
      failed: counters.PAN.FAILED,
    },
  ];

  return { timeseries: buckets, verificationBreakdown };
};
