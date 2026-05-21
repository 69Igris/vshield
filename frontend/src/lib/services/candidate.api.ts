import { api } from "@/lib/api";
import type {
  ApiResponse,
  BulkResult,
  Candidate,
  CandidateAnalytics,
  CandidateDetail,
  CandidateStats,
  CandidateStatus,
  PaginatedResult,
} from "@/types";

export interface CandidateInput {
  fullName: string;
  email: string;
  phone: string;
  aadhaarNumber: string;
  panNumber: string;
  dob: string; // YYYY-MM-DD
  address: string;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CandidateStatus;
}

export const candidateApi = {
  list: async (params: ListParams = {}): Promise<PaginatedResult<Candidate>> => {
    const { data } = await api.get<ApiResponse<PaginatedResult<Candidate>>>(
      "/candidates",
      { params }
    );
    return data.data;
  },

  stats: async (): Promise<CandidateStats> => {
    const { data } = await api.get<ApiResponse<CandidateStats>>(
      "/candidates/stats"
    );
    return data.data;
  },

  analytics: async (): Promise<CandidateAnalytics> => {
    const { data } = await api.get<ApiResponse<CandidateAnalytics>>(
      "/candidates/analytics"
    );
    return data.data;
  },

  getById: async (id: string): Promise<CandidateDetail> => {
    const { data } = await api.get<ApiResponse<CandidateDetail>>(
      `/candidates/${id}`
    );
    return data.data;
  },

  create: async (input: CandidateInput): Promise<Candidate> => {
    const { data } = await api.post<ApiResponse<Candidate>>("/candidates", input);
    return data.data;
  },

  bulkCreate: async (
    candidates: Array<Record<string, unknown>>
  ): Promise<BulkResult> => {
    const { data } = await api.post<ApiResponse<BulkResult>>(
      "/candidates/bulk",
      { candidates }
    );
    return data.data;
  },

  update: async (
    id: string,
    input: Partial<CandidateInput>
  ): Promise<Candidate> => {
    const { data } = await api.put<ApiResponse<Candidate>>(
      `/candidates/${id}`,
      input
    );
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/candidates/${id}`);
  },

  startVerification: async (id: string) => {
    const { data } = await api.post<ApiResponse<unknown>>(
      `/verifications/${id}/start`
    );
    return data.data;
  },

  downloadReportUrl: (id: string): string => {
    // For window.open() / anchor download (rarely used since auth header is needed)
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
    return `${base}/reports/${id}`;
  },

  // Download the report as a PDF blob (uses auth header via axios)
  downloadReport: async (
    id: string,
    fileName = "report.pdf"
  ): Promise<void> => {
    const response = await api.get(`/reports/${id}`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    // Try to use server-provided filename from Content-Disposition
    const disposition = response.headers["content-disposition"] as
      | string
      | undefined;
    if (disposition) {
      const match = /filename="?([^"]+)"?/i.exec(disposition);
      if (match) fileName = match[1];
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
