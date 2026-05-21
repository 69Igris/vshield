// =====================================================
// Shared types between frontend and backend API
// =====================================================

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export type CandidateStatus = "PENDING" | "VERIFIED" | "FAILED" | "PARTIAL";

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  aadhaarMasked: string;
  panMasked: string;
  dob: string;
  address: string;
  status: CandidateStatus;
  reportUrl: string | null;
  reportGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

export interface VerificationLog {
  id: string;
  verificationType: "AADHAAR" | "PAN";
  verificationStatus: "VERIFIED" | "FAILED";
  responsePayload: Record<string, unknown>;
  verifiedAt: string;
}

export interface CandidateDetail extends Candidate {
  verificationLogs: VerificationLog[];
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CandidateStats {
  total: number;
  verified: number;
  pending: number;
  failed: number;
  partial: number;
}

export interface TimeseriesBucket {
  date: string; // YYYY-MM-DD
  label: string; // "21 May"
  count: number;
}

export interface VerificationBreakdownRow {
  type: "Aadhaar" | "PAN";
  verified: number;
  failed: number;
}

export interface CandidateAnalytics {
  timeseries: TimeseriesBucket[];
  verificationBreakdown: VerificationBreakdownRow[];
}

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

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: { path: string; message: string }[];
}
