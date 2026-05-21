"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldQuestion,
  ArrowRight,
  Plus,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import { candidateApi } from "@/lib/services/candidate.api";
import { getErrorMessage } from "@/lib/api";
import type {
  Candidate,
  CandidateAnalytics,
  CandidateStats,
} from "@/types";
import StatusBadge from "@/components/StatusBadge";
import StatusDonut from "@/components/charts/StatusDonut";
import DailyActivityChart from "@/components/charts/DailyActivityChart";
import VerificationBreakdownChart from "@/components/charts/VerificationBreakdownChart";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  trendLabel?: string;
}

function StatCard({ label, value, icon, accent, trendLabel }: StatCardProps) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
          {trendLabel && (
            <div className="mt-1 text-[11px] text-slate-400">{trendLabel}</div>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200" />
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="text-slate-400">{icon}</span>
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>
          )}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [analytics, setAnalytics] = useState<CandidateAnalytics | null>(null);
  const [recent, setRecent] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [s, a, list] = await Promise.all([
          candidateApi.stats(),
          candidateApi.analytics(),
          candidateApi.list({ page: 1, limit: 5 }),
        ]);
        if (cancelled) return;
        setStats(s);
        setAnalytics(a);
        setRecent(list.items);
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
  }, []);

  const last7Total = analytics?.timeseries.reduce((sum, t) => sum + t.count, 0) ?? 0;
  // Latest verification per (candidate, type). Aadhaar + PAN each top out
  // at total-candidates count when every candidate has been checked.
  const candidatesChecked =
    analytics?.verificationBreakdown.reduce(
      (sum, r) => sum + r.verified + r.failed,
      0
    ) ?? 0;
  const successRate = (() => {
    if (!analytics) return 0;
    const verified = analytics.verificationBreakdown.reduce(
      (s, r) => s + r.verified,
      0
    );
    return candidatesChecked > 0
      ? Math.round((verified / candidatesChecked) * 100)
      : 0;
  })();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your verification activity
          </p>
        </div>
        <Link href="/candidates/new" className="btn-primary">
          <Plus size={16} className="mr-1.5" />
          New candidate
        </Link>
      </div>

      {/* Top stat cards (5) */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Total"
            value={stats?.total ?? 0}
            icon={<Users className="h-5 w-5 text-slate-700" />}
            accent="bg-slate-100"
            trendLabel={`${last7Total} added this week`}
          />
          <StatCard
            label="Verified"
            value={stats?.verified ?? 0}
            icon={<CheckCircle2 className="h-5 w-5 text-green-700" />}
            accent="bg-green-100"
            trendLabel={`${successRate}% verification success`}
          />
          <StatCard
            label="Pending"
            value={stats?.pending ?? 0}
            icon={<Clock className="h-5 w-5 text-indigo-700" />}
            accent="bg-indigo-100"
          />
          <StatCard
            label="Partial"
            value={stats?.partial ?? 0}
            icon={<ShieldQuestion className="h-5 w-5 text-yellow-700" />}
            accent="bg-yellow-100"
          />
          <StatCard
            label="Failed"
            value={stats?.failed ?? 0}
            icon={<AlertTriangle className="h-5 w-5 text-red-700" />}
            accent="bg-red-100"
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Candidates added — last 7 days"
            subtitle={`${last7Total} total in this period`}
            icon={<TrendingUp size={16} />}
          >
            {loading || !analytics ? (
              <div className="h-64 animate-pulse rounded bg-slate-100" />
            ) : (
              <DailyActivityChart data={analytics.timeseries} />
            )}
          </ChartCard>
        </div>
        <ChartCard
          title="Status distribution"
          subtitle="Across all candidates"
          icon={<PieChartIcon size={16} />}
        >
          {loading || !stats ? (
            <div className="h-64 animate-pulse rounded bg-slate-100" />
          ) : (
            <StatusDonut stats={stats} />
          )}
        </ChartCard>
      </div>

      {/* Verification breakdown + Recent candidates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard
          title="Verification checks"
          subtitle="Current status per candidate (latest run)"
          icon={<BarChart3 size={16} />}
        >
          {loading || !analytics ? (
            <div className="h-64 animate-pulse rounded bg-slate-100" />
          ) : (
            <VerificationBreakdownChart data={analytics.verificationBreakdown} />
          )}
        </ChartCard>

        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent candidates
              </h2>
              <Link
                href="/candidates"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 w-full animate-pulse rounded bg-slate-100"
                  />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Users className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-900">
                  No candidates yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Add your first candidate to start running verifications.
                </p>
                <Link href="/candidates/new" className="btn-primary mt-4">
                  <Plus size={16} className="mr-1.5" />
                  New candidate
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {recent.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/candidates/${c.id}`}
                      className="flex items-center justify-between px-6 py-4 transition hover:bg-slate-50"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {c.fullName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {c.email} • {c.phone}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="hidden text-xs text-slate-500 sm:inline">
                          {new Date(c.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
