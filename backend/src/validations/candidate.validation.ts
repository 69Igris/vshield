import { z } from "zod";

// Aadhaar: exactly 12 digits
const aadhaarRegex = /^\d{12}$/;
// PAN: 5 uppercase letters + 4 digits + 1 uppercase letter (ABCDE1234F)
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
// Phone: 10 digits (optional leading +country code)
const phoneRegex = /^\+?[0-9]{10,15}$/;

export const VALID_STATUSES = ["PENDING", "VERIFIED", "FAILED", "PARTIAL"] as const;

export const createCandidateSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").toLowerCase(),
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  aadhaarNumber: z
    .string()
    .regex(aadhaarRegex, "Aadhaar must be exactly 12 digits"),
  panNumber: z
    .string()
    .toUpperCase()
    .regex(panRegex, "Invalid PAN format (expected ABCDE1234F)"),
  dob: z.coerce.date({ errorMap: () => ({ message: "Invalid date of birth" }) }),
  address: z.string().min(5, "Address too short").max(500),
});

export const updateCandidateSchema = createCandidateSchema.partial();

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(VALID_STATUSES).optional(),
});

export const bulkCreateSchema = z.object({
  candidates: z
    .array(z.unknown()) // each row is validated individually so we can report per-row errors
    .min(1, "No candidates provided")
    .max(500, "Bulk upload limited to 500 rows per request"),
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;
