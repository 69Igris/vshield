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
  Activity,
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
  glowColor: string; // rgba string for shadow
  iconBg: string; // background classes for icon container
  iconColor: string; // icon stroke color class
  trendLabel?: string;
}

function StatCard({
  label,
  value,
  icon,
  glowColor,
  iconBg,
  iconColor,
  trendLabel,
}: StatCardProps) {
  return (
    <div
      className="card card-hover relative overflow-hidden p-5"
      style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 30px -15px ${glowColor}` }}
    >
      {/* Decorative corner accent */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-30 blur-2xl"
           style={{ background: glowColor }} />

      <div className="relative flex items-start justify-between">
        <div>
          <div className="eyebrow">{label}</div>
          <div className="mt-3 font-heading text-4xl font-bold text-white">
            {value.toLocaleString()}
          </div>
          {trendLabel && (
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-stardust">
              {trendLabel}
            </div>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} ring-1 ring-inset ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="h-3 w-20 animate-pulse rounded bg-white/[0.04]" />
      <div className="mt-3 h-8 w-16 animate-pulse rounded bg-white/[0.04]" />
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
      <div className="flex items-start justify-between border-b border-white/[0.06] px-6 py-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[#F7931A]">{icon}</span>
            <span className="font-heading text-sm font-semibold text-white">
              {title}
            </span>
          </div>
          {subtitle && (
            <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-stardust">
              {subtitle}
            </div>
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
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            DASHBOARD
          </div>
          <h1 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">
            Verification <span className="text-gradient">overview</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-stardust">
            Track candidate verifications, monitor identity check throughput,
            and download audit-grade reports.
          </p>
        </div>
        <Link href="/candidates/new" className="btn-primary">
          <Plus size={16} />
          New candidate
        </Link>
      </div>

      {/* Stat cards */}
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
            icon={<Users className="h-5 w-5 text-white" />}
            glowColor="rgba(247,147,26,0.4)"
            iconBg="bg-gradient-to-br from-[#EA580C] to-[#F7931A]"
            iconColor="ring-[#F7931A]/40"
            trendLabel={`${last7Total} added this week`}
          />
          <StatCard
            label="Verified"
            value={stats?.verified ?? 0}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-300" />}
            glowColor="rgba(16,185,129,0.35)"
            iconBg="bg-emerald-500/15"
            iconColor="ring-emerald-400/30"
            trendLabel={`${successRate}% verification success`}
          />
          <StatCard
            label="Pending"
            value={stats?.pending ?? 0}
            icon={<Clock className="h-5 w-5 text-[#F7931A]" />}
            glowColor="rgba(247,147,26,0.3)"
            iconBg="bg-[#F7931A]/10"
            iconColor="ring-[#F7931A]/30"
          />
          <StatCard
            label="Partial"
            value={stats?.partial ?? 0}
            icon={<ShieldQuestion className="h-5 w-5 text-[#FFD600]" />}
            glowColor="rgba(255,214,0,0.3)"
            iconBg="bg-[#FFD600]/10"
            iconColor="ring-[#FFD600]/30"
          />
          <StatCard
            label="Failed"
            value={stats?.failed ?? 0}
            icon={<AlertTriangle className="h-5 w-5 text-red-300" />}
            glowColor="rgba(239,68,68,0.3)"
            iconBg="bg-red-500/15"
            iconColor="ring-red-400/30"
          />
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Candidate activity"
            subtitle={`${last7Total} added in the last 7 days`}
            icon={<TrendingUp size={16} />}
          >
            {loading || !analytics ? (
              <div className="h-64 animate-pulse rounded bg-white/[0.03]" />
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
            <div className="h-64 animate-pulse rounded bg-white/[0.03]" />
          ) : (
            <StatusDonut stats={stats} />
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 + recent candidates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard
          title="Verification checks"
          subtitle="Current state per candidate"
          icon={<BarChart3 size={16} />}
        >
          {loading || !analytics ? (
            <div className="h-64 animate-pulse rounded bg-white/[0.03]" />
          ) : (
            <VerificationBreakdownChart data={analytics.verificationBreakdown} />
          )}
        </ChartCard>

        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <Activity size={16} className="text-[#F7931A]" />
                <h2 className="font-heading text-sm font-semibold text-white">
                  Recent candidates
                </h2>
              </div>
              <Link
                href="/candidates"
                className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-[#F7931A] transition hover:text-[#FFD600]"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 w-full animate-pulse rounded bg-white/[0.03]"
                  />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Users className="mx-auto h-10 w-10 text-stardust/40" />
                <p className="mt-3 font-heading text-sm font-medium text-white">
                  No candidates yet
                </p>
                <p className="mt-1 text-sm text-stardust">
                  Add your first candidate to start running verifications.
                </p>
                <Link href="/candidates/new" className="btn-primary mt-5">
                  <Plus size={16} />
                  New candidate
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {recent.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/candidates/${c.id}`}
                      className="flex items-center justify-between px-6 py-4 transition hover:bg-white/[0.02]"
                    >
                      <div>
                        <div className="font-medium text-white">{c.fullName}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-stardust">
                          {c.email} · {c.phone}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="hidden font-mono text-[10px] uppercase tracking-wider text-stardust sm:inline">
                          {new Date(c.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        <StatusBadge status={c.status} size="sm" />
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
