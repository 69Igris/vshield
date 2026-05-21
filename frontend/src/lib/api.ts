import axios, { AxiosError } from "axios";
import type { ApiErrorResponse } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("bgv_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-logout on 401, re-throw with backend message
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiErrorResponse>) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      // only redirect if we were authenticated (i.e. on a protected page)
      const onAuthPage =
        window.location.pathname.startsWith("/login") ||
        window.location.pathname.startsWith("/register");
      if (!onAuthPage) {
        localStorage.removeItem("bgv_token");
        localStorage.removeItem("bgv_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// Convenience: get a clean error message from an Axios error
export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorResponse | undefined;
    if (data?.errors && data.errors.length > 0) {
      return data.errors.map((e) => `${e.path}: ${e.message}`).join(", ");
    }
    return data?.message ?? err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong";
};
