"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  PlayCircle,
  Download,
  ShieldCheck,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Clock,
  Link2,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import StatusBadge from "@/components/StatusBadge";
import { candidateApi } from "@/lib/services/candidate.api";
import { getErrorMessage } from "@/lib/api";
import type { CandidateDetail } from "@/types";

export default function CandidateDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const c = await candidateApi.getById(id);
      setCandidate(c);
    } catch (err) {
      toast.error(getErrorMessage(err));
      router.push("/candidates");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await candidateApi.startVerification(id);
      toast.success("Verification completed");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await candidateApi.downloadReport(id);
      toast.success("Report downloaded");
      setTimeout(load, 2500);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!candidate?.reportUrl) return;
    try {
      await navigator.clipboard.writeText(candidate.reportUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this candidate? This will also delete all verification logs.")) return;
    setDeleting(true);
    try {
      await candidateApi.remove(id);
      toast.success("Candidate deleted");
      router.push("/candidates");
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
    }
  };

  if (loading || !candidate) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 w-full animate-pulse rounded-2xl bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  const aadhaarLog = candidate.verificationLogs.find(
    (l) => l.verificationType === "AADHAAR"
  );
  const panLog = candidate.verificationLogs.find(
    (l) => l.verificationType === "PAN"
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDob = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const hasBeenVerified = candidate.verificationLogs.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href="/candidates"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-stardust transition hover:text-white"
      >
        <ArrowLeft size={14} />
        Back to candidates
      </Link>

      {/* Hero header */}
      <div className="card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#F7931A] opacity-10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-5">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] text-white shadow-[0_0_25px_-5px_rgba(247,147,26,0.6)]">
                <User size={28} strokeWidth={2.2} />
              </div>
              <span className="absolute -inset-1 rounded-2xl bg-[#F7931A] opacity-25 blur-md -z-10" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-white">
                {candidate.fullName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] text-stardust">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={12} /> {candidate.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={12} /> {candidate.phone}
                </span>
              </div>
              <div className="mt-4">
                <StatusBadge status={candidate.status} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary" onClick={handleVerify} disabled={verifying}>
              {verifying ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verifying
                </>
              ) : (
                <>
                  <PlayCircle size={16} />
                  {hasBeenVerified ? "Re-run verification" : "Start verification"}
                </>
              )}
            </button>
            <button className="btn-secondary" onClick={handleDownload} disabled={downloading}>
              {downloading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span>Report</span>
            </button>
            <Link href={`/candidates/${candidate.id}/edit`} className="btn-secondary !px-3" title="Edit">
              <Pencil size={14} />
            </Link>
            <button className="btn-danger !px-3" onClick={handleDelete} disabled={deleting} title="Delete">
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Cloud report link */}
      {candidate.reportUrl && (
        <div className="card-glass flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F7931A]/15 text-[#F7931A] ring-1 ring-[#F7931A]/30">
              <Link2 size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-heading text-sm font-semibold text-white">
                Shareable cloud link
              </div>
              <div className="truncate font-mono text-[11px] text-stardust">
                {candidate.reportUrl}
              </div>
              {candidate.reportGeneratedAt && (
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-stardust/70">
                  Uploaded {formatDate(candidate.reportGeneratedAt)}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button className="btn-secondary !px-3 !py-1.5 !text-[11px]" onClick={handleCopyLink}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={candidate.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary !px-3 !py-1.5 !text-[11px]"
            >
              Open
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Personal details */}
        <div className="card lg:col-span-2">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <div className="eyebrow">CANDIDATE INFORMATION</div>
          </div>
          <dl className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
            <Field icon={<User size={12} />} label="Full name" value={candidate.fullName} />
            <Field icon={<Calendar size={12} />} label="Date of birth" value={formatDob(candidate.dob)} />
            <Field icon={<Mail size={12} />} label="Email" value={candidate.email} />
            <Field icon={<Phone size={12} />} label="Phone" value={candidate.phone} mono />
            <Field icon={<ShieldCheck size={12} />} label="Aadhaar" value={candidate.aadhaarMasked} mono />
            <Field icon={<CreditCard size={12} />} label="PAN" value={candidate.panMasked} mono />
            <Field icon={<MapPin size={12} />} label="Address" value={candidate.address} fullWidth />
          </dl>
        </div>

        {/* Verification checks */}
        <div className="card">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <div className="eyebrow">VERIFICATION CHECKS</div>
          </div>
          <div className="space-y-3 p-5">
            <CheckCard
              icon={<ShieldCheck size={16} />}
              title="Aadhaar"
              status={aadhaarLog?.verificationStatus ?? "NOT_RUN"}
              message={
                (aadhaarLog?.responsePayload as { message?: string } | null)?.message ??
                "Not yet run"
              }
              verifiedAt={aadhaarLog ? formatDate(aadhaarLog.verifiedAt) : null}
            />
            <CheckCard
              icon={<CreditCard size={16} />}
              title="PAN"
              status={panLog?.verificationStatus ?? "NOT_RUN"}
              message={
                (panLog?.responsePayload as { message?: string } | null)?.message ??
                "Not yet run"
              }
              verifiedAt={panLog ? formatDate(panLog.verifiedAt) : null}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <div className="eyebrow">VERIFICATION TIMELINE</div>
        </div>
        {candidate.verificationLogs.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="mx-auto h-8 w-8 text-stardust/40" />
            <p className="mt-2 font-heading text-sm font-medium text-white">
              No verifications yet
            </p>
            <p className="mt-1 text-xs text-stardust">
              Click &quot;Start verification&quot; above to run Aadhaar &amp; PAN checks.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {candidate.verificationLogs.map((log) => {
              const success = log.verificationStatus === "VERIFIED";
              return (
                <li key={log.id} className="flex items-start gap-4 px-6 py-4">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${
                      success
                        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                        : "bg-red-500/15 text-red-300 ring-red-400/30"
                    }`}
                  >
                    {log.verificationType === "AADHAAR" ? (
                      <ShieldCheck size={14} />
                    ) : (
                      <CreditCard size={14} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-sm font-semibold text-white">
                        {log.verificationType === "AADHAAR" ? "Aadhaar" : "PAN"} verification
                      </span>
                      <StatusBadge status={log.verificationStatus} size="sm" />
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-stardust">
                      {formatDate(log.verifiedAt)}
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wider text-[#F7931A] transition hover:text-[#FFD600]">
                        Show API response
                      </summary>
                      <pre className="mt-2 overflow-x-auto rounded-lg border border-white/[0.05] bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-stardust">
                        {JSON.stringify(log.responsePayload, null, 2)}
                      </pre>
                    </details>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  mono,
  fullWidth,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-stardust">
        <span className="text-stardust/60">{icon}</span>
        {label}
      </dt>
      <dd className={`mt-1.5 text-sm text-white ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function CheckCard({
  icon,
  title,
  status,
  message,
  verifiedAt,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
  message: string;
  verifiedAt: string | null;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-stardust">{icon}</span>
          <span className="font-heading text-sm font-semibold text-white">{title}</span>
        </div>
        <StatusBadge status={status} size="sm" />
      </div>
      <p className="mt-2 text-xs text-stardust">{message}</p>
      {verifiedAt && (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-stardust/60">
          {verifiedAt}
        </p>
      )}
    </div>
  );
}
