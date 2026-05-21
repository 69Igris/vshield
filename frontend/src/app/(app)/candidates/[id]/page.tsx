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
      // Cloud upload happens in the background — refresh after a beat to
      // pick up the new reportUrl.
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
    if (
      !window.confirm(
        "Delete this candidate? This will also delete all verification logs."
      )
    )
      return;
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
            className="h-24 w-full animate-pulse rounded-lg bg-slate-100"
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
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/candidates"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} />
        Back to candidates
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <User size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {candidate.fullName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} /> {candidate.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} /> {candidate.phone}
                </span>
              </div>
              <div className="mt-3">
                <StatusBadge status={candidate.status} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn-primary"
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <Loader2 size={16} className="mr-1.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <PlayCircle size={16} className="mr-1.5" />
                  {hasBeenVerified ? "Re-run verification" : "Start verification"}
                </>
              )}
            </button>
            <button
              className="btn-secondary"
              onClick={handleDownload}
              disabled={downloading}
              title="Download PDF report"
            >
              {downloading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span className="ml-1.5 hidden sm:inline">Report</span>
            </button>
            <Link
              href={`/candidates/${candidate.id}/edit`}
              className="btn-secondary"
              title="Edit"
            >
              <Pencil size={16} />
            </Link>
            <button
              className="btn-danger"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete"
            >
              {deleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cloud report link (only shown after a report has been generated) */}
      {candidate.reportUrl && (
        <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-700">
              <Link2 size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">
                Shareable cloud link
              </div>
              <div className="truncate text-xs text-slate-500">
                {candidate.reportUrl}
              </div>
              {candidate.reportGeneratedAt && (
                <div className="text-[11px] text-slate-400">
                  Uploaded {formatDate(candidate.reportGeneratedAt)}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="btn-secondary !py-1.5 !px-3 text-xs"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check size={14} className="mr-1" />
              ) : (
                <Copy size={14} className="mr-1" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={candidate.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              Open
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Personal details */}
        <div className="card lg:col-span-2">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Personal details
            </h2>
          </div>
          <dl className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
            <Field
              icon={<User size={14} />}
              label="Full name"
              value={candidate.fullName}
            />
            <Field
              icon={<Calendar size={14} />}
              label="Date of birth"
              value={formatDob(candidate.dob)}
            />
            <Field
              icon={<Mail size={14} />}
              label="Email"
              value={candidate.email}
            />
            <Field
              icon={<Phone size={14} />}
              label="Phone"
              value={candidate.phone}
            />
            <Field
              icon={<ShieldCheck size={14} />}
              label="Aadhaar"
              value={candidate.aadhaarMasked}
              mono
            />
            <Field
              icon={<CreditCard size={14} />}
              label="PAN"
              value={candidate.panMasked}
              mono
            />
            <Field
              icon={<MapPin size={14} />}
              label="Address"
              value={candidate.address}
              fullWidth
            />
          </dl>
        </div>

        {/* Verification cards */}
        <div className="card">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Verification checks
            </h2>
          </div>
          <div className="space-y-3 p-6">
            <CheckCard
              icon={<ShieldCheck size={16} />}
              title="Aadhaar"
              status={aadhaarLog?.verificationStatus ?? "NOT_RUN"}
              message={
                (aadhaarLog?.responsePayload as { message?: string } | null)
                  ?.message ?? "Not yet run"
              }
              verifiedAt={
                aadhaarLog ? formatDate(aadhaarLog.verifiedAt) : null
              }
            />
            <CheckCard
              icon={<CreditCard size={16} />}
              title="PAN"
              status={panLog?.verificationStatus ?? "NOT_RUN"}
              message={
                (panLog?.responsePayload as { message?: string } | null)
                  ?.message ?? "Not yet run"
              }
              verifiedAt={panLog ? formatDate(panLog.verifiedAt) : null}
            />
          </div>
        </div>
      </div>

      {/* Verification timeline */}
      <div className="card">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Verification timeline
          </h2>
        </div>
        {candidate.verificationLogs.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-900">
              No verifications yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Click &quot;Start verification&quot; above to run Aadhaar &amp; PAN checks.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {candidate.verificationLogs.map((log) => {
              const success = log.verificationStatus === "VERIFIED";
              return (
                <li key={log.id} className="flex items-start gap-4 px-6 py-4">
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      success
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {log.verificationType === "AADHAAR" ? (
                      <ShieldCheck size={14} />
                    ) : (
                      <CreditCard size={14} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {log.verificationType === "AADHAAR" ? "Aadhaar" : "PAN"} verification
                      </span>
                      <StatusBadge status={log.verificationStatus} size="sm" />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatDate(log.verifiedAt)}
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-brand-600 hover:text-brand-700">
                        Show API response
                      </summary>
                      <pre className="mt-2 overflow-x-auto rounded-md bg-slate-50 p-3 text-[11px] text-slate-700">
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

// ----- Sub-components -----

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
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm text-slate-900 ${mono ? "font-mono" : ""}`}
      >
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
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{icon}</span>
          <span className="text-sm font-medium text-slate-900">{title}</span>
        </div>
        <StatusBadge status={status} size="sm" />
      </div>
      <p className="mt-1.5 text-xs text-slate-600">{message}</p>
      {verifiedAt && (
        <p className="mt-1 text-[10px] text-slate-400">{verifiedAt}</p>
      )}
    </div>
  );
}
