"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { candidateApi, type ListParams } from "@/lib/services/candidate.api";
import { getErrorMessage } from "@/lib/api";
import type { Candidate, CandidateStatus, PaginatedResult } from "@/types";
import StatusBadge from "@/components/StatusBadge";

const STATUSES: { value: CandidateStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "PARTIAL", label: "Partial" },
  { value: "FAILED", label: "Failed" },
];

const LIMIT = 10;

export default function CandidatesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<CandidateStatus | "">("");
  const [data, setData] = useState<PaginatedResult<Candidate> | null>(null);
  const [loading, setLoading] = useState(true);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // re-fetch on page/search/status change
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params: ListParams = { page, limit: LIMIT };
        if (search) params.search = search;
        if (status) params.status = status;
        const result = await candidateApi.list(params);
        if (!cancelled) setData(result);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [page, search, status]);

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  const showingRange = useMemo(() => {
    if (!pagination || pagination.total === 0) return null;
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return `${start}–${end} of ${pagination.total}`;
  }, [pagination]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage candidates and run identity verifications
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/candidates/bulk" className="btn-secondary">
            <Upload size={16} className="mr-1.5" />
            Bulk upload
          </Link>
          <Link href="/candidates/new" className="btn-primary">
            <Plus size={16} className="mr-1.5" />
            New candidate
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by name, email, or phone"
            className="input pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            className="input pl-9 pr-8 appearance-none cursor-pointer"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as CandidateStatus | "");
              setPage(1);
            }}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 w-full animate-pulse rounded bg-slate-100"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-900">
              {search || status ? "No matching candidates" : "No candidates yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {search || status
                ? "Try clearing your filters."
                : "Add your first candidate to begin."}
            </p>
            {!search && !status && (
              <Link href="/candidates/new" className="btn-primary mt-4">
                <Plus size={16} className="mr-1.5" />
                New candidate
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Candidate</th>
                  <th className="px-6 py-3">Aadhaar</th>
                  <th className="px-6 py-3">PAN</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer transition hover:bg-slate-50"
                    onClick={() => router.push(`/candidates/${c.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {c.fullName}
                      </div>
                      <div className="text-xs text-slate-500">{c.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-mono text-xs">
                      {c.aadhaarMasked}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-mono text-xs">
                      {c.panMasked}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
            <div className="text-xs text-slate-500">
              Showing {showingRange}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary !py-1.5 !px-2"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-xs text-slate-600">
                Page <span className="font-semibold">{pagination.page}</span> of{" "}
                {pagination.totalPages}
              </div>
              <button
                className="btn-secondary !py-1.5 !px-2"
                onClick={() => setPage((p) => p + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
