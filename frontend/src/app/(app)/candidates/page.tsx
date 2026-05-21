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

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

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
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow">CANDIDATES</div>
          <h1 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">
            Manage <span className="text-gradient">candidates</span>
          </h1>
          <p className="mt-2 text-sm text-stardust">
            Search, filter, and run identity checks on your candidates.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/candidates/bulk" className="btn-secondary">
            <Upload size={16} />
            Bulk upload
          </Link>
          <Link href="/candidates/new" className="btn-primary">
            <Plus size={16} />
            New candidate
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stardust"
          />
          <input
            type="text"
            placeholder="Search by name, email, or phone"
            className="input pl-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stardust"
          />
          <select
            className="input cursor-pointer pl-10 pr-8 appearance-none min-w-[180px]"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as CandidateStatus | "");
              setPage(1);
            }}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value} className="bg-matter text-white">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 w-full animate-pulse rounded bg-white/[0.03]"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-stardust/40" />
            <p className="mt-3 font-heading text-sm font-medium text-white">
              {search || status ? "No matching candidates" : "No candidates yet"}
            </p>
            <p className="mt-1 text-sm text-stardust">
              {search || status
                ? "Try clearing your filters."
                : "Add your first candidate to begin."}
            </p>
            {!search && !status && (
              <Link href="/candidates/new" className="btn-primary mt-5">
                <Plus size={16} />
                New candidate
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.05] bg-white/[0.02]">
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-stardust">
                  <th className="px-6 py-3">Candidate</th>
                  <th className="px-6 py-3">Aadhaar</th>
                  <th className="px-6 py-3">PAN</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {items.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer transition hover:bg-white/[0.025]"
                    onClick={() => router.push(`/candidates/${c.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{c.fullName}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-stardust">
                        {c.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[12px] text-stardust">
                      {c.aadhaarMasked}
                    </td>
                    <td className="px-6 py-4 font-mono text-[12px] text-stardust">
                      {c.panMasked}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-stardust">
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

        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between border-t border-white/[0.05] bg-white/[0.02] px-6 py-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-stardust">
              {showingRange}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-stardust transition hover:border-white/20 hover:text-white disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft size={14} />
              </button>
              <div className="font-mono text-[11px] text-stardust">
                <span className="text-white">{pagination.page}</span> / {pagination.totalPages}
              </div>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-stardust transition hover:border-white/20 hover:text-white disabled:opacity-40"
                onClick={() => setPage((p) => p + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
