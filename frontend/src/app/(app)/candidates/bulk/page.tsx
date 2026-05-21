"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { candidateApi } from "@/lib/services/candidate.api";
import { getErrorMessage } from "@/lib/api";
import type { BulkResult } from "@/types";

const REQUIRED_HEADERS = [
  "fullName",
  "email",
  "phone",
  "aadhaarNumber",
  "panNumber",
  "dob",
  "address",
] as const;

type Row = Record<(typeof REQUIRED_HEADERS)[number], string>;

const SAMPLE_CSV = `fullName,email,phone,aadhaarNumber,panNumber,dob,address
Asha Verma,asha@example.com,9876543201,123456789012,ABCDE1234F,1992-04-15,"21 MG Road, Bengaluru"
Rohan Mehta,rohan@example.com,9876543202,234567890123,BCDEF2345G,1988-11-02,"7 Marine Drive, Mumbai"
Sneha Iyer,sneha@example.com,9876543203,345678901234,CDEFG3456H,1995-06-30,"45 Park Street, Kolkata"
`;

export default function BulkUploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  const reset = () => {
    setFileName(null);
    setRows([]);
    setParseErrors([]);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = (file: File) => {
    setResult(null);
    setParseErrors([]);
    setRows([]);
    setFileName(file.name);

    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (parsed) => {
        const headers = parsed.meta.fields ?? [];
        const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
        if (missing.length > 0) {
          setParseErrors([
            `Missing required column(s): ${missing.join(", ")}. Required headers: ${REQUIRED_HEADERS.join(", ")}`,
          ]);
          return;
        }
        // Trim all string values
        const cleanRows = parsed.data.map((r) => {
          const out = {} as Row;
          for (const k of REQUIRED_HEADERS) {
            out[k] = (r[k] ?? "").toString().trim();
          }
          return out;
        });
        if (cleanRows.length === 0) {
          setParseErrors(["The CSV has headers but no data rows."]);
          return;
        }
        if (cleanRows.length > 500) {
          setParseErrors([
            `Too many rows (${cleanRows.length}). Max 500 per upload — split your file.`,
          ]);
          return;
        }
        setRows(cleanRows);
      },
      error: (err) => {
        setParseErrors([`CSV parse error: ${err.message}`]);
      },
    });
  };

  const onPickClick = () => inputRef.current?.click();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onUpload = async () => {
    if (rows.length === 0) return;
    setUploading(true);
    try {
      const res = await candidateApi.bulkCreate(rows);
      setResult(res);
      if (res.failedCount === 0) {
        toast.success(`Created ${res.createdCount} candidates`);
      } else {
        toast.error(
          `Created ${res.createdCount}, ${res.failedCount} failed — see details below`
        );
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bgv_candidates_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/candidates"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-stardust transition hover:text-white"
      >
        <ArrowLeft size={14} />
        Back to candidates
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow">BULK UPLOAD</div>
          <h1 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">
            Onboard <span className="text-gradient">in bulk</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-stardust">
            Upload a CSV of candidates. Each row is validated and inserted
            independently — bad rows don&apos;t block good ones.
          </p>
        </div>
        <button onClick={downloadTemplate} className="btn-secondary">
          <Download size={16} />
          Sample template
        </button>
      </div>

      {/* Drop zone */}
      {!fileName && !result && (
        <div
          onClick={onPickClick}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="card relative cursor-pointer overflow-hidden border-2 border-dashed border-white/15 px-6 py-20 text-center transition hover:border-[#F7931A]/60 hover:bg-[#F7931A]/[0.03]"
        >
          <div className="pointer-events-none absolute inset-0 bg-dots-pattern opacity-50" />
          <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#F7931A] opacity-10 blur-3xl" />
          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EA580C]/30 to-[#F7931A]/15 ring-1 ring-[#F7931A]/30">
              <Upload className="h-6 w-6 text-[#F7931A]" />
            </div>
            <p className="mt-4 font-heading text-base font-semibold text-white">
              Drop your CSV here, or click to browse
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-stardust">
              Required: {REQUIRED_HEADERS.join(" · ")}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />
        </div>
      )}

      {/* File picked, preview */}
      {fileName && !result && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F7931A]/15 text-[#F7931A] ring-1 ring-[#F7931A]/30">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <div className="font-heading text-sm font-semibold text-white">
                  {fileName}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-stardust">
                  {rows.length > 0
                    ? `${rows.length} VALID ROW(S) PARSED`
                    : "NO VALID ROWS"}
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              className="rounded-md p-1.5 text-stardust transition hover:bg-white/5 hover:text-white"
              title="Remove file"
            >
              <X size={16} />
            </button>
          </div>

          {parseErrors.length > 0 && (
            <div className="border-b border-red-500/20 bg-red-500/[0.06] px-6 py-4">
              {parseErrors.map((e, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm text-red-300"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {e}
                </div>
              ))}
            </div>
          )}

          {rows.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="border-b border-white/[0.05] bg-white/[0.02]">
                    <tr className="text-left font-mono text-[10px] uppercase tracking-[0.15em] text-stardust">
                      <th className="px-4 py-2.5">#</th>
                      {REQUIRED_HEADERS.map((h) => (
                        <th key={h} className="px-4 py-2.5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {rows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="text-white">
                        <td className="px-4 py-2 font-mono text-stardust">
                          {i + 1}
                        </td>
                        {REQUIRED_HEADERS.map((h) => (
                          <td key={h} className="px-4 py-2 text-stardust">
                            {r[h] || (
                              <span className="text-white/20">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 10 && (
                  <div className="border-t border-white/[0.05] bg-white/[0.02] px-4 py-2 text-center font-mono text-[10px] uppercase tracking-wider text-stardust">
                    SHOWING FIRST 10 OF {rows.length} ROWS
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] bg-white/[0.02] px-6 py-4">
                <button onClick={reset} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={onUpload}
                  className="btn-primary"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Uploading
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload {rows.length} candidate(s)
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Result summary */}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="eyebrow !text-stardust">TOTAL ROWS</div>
              <div className="mt-2 font-heading text-3xl font-bold text-white">
                {result.totalRows}
              </div>
            </div>
            <div className="card p-5">
              <div className="eyebrow !text-emerald-400">CREATED</div>
              <div className="mt-2 font-heading text-3xl font-bold text-emerald-300">
                {result.createdCount}
              </div>
            </div>
            <div className="card p-5">
              <div className="eyebrow !text-red-400">FAILED</div>
              <div className="mt-2 font-heading text-3xl font-bold text-red-300">
                {result.failedCount}
              </div>
            </div>
          </div>

          {result.failed.length > 0 && (
            <div className="card">
              <div className="border-b border-white/[0.06] px-6 py-3">
                <div className="eyebrow !text-red-400">FAILED ROWS</div>
              </div>
              <ul className="divide-y divide-white/[0.05]">
                {result.failed.map((f) => (
                  <li
                    key={f.row}
                    className="flex items-start gap-3 px-6 py-3 text-sm"
                  >
                    <AlertCircle
                      size={16}
                      className="mt-0.5 shrink-0 text-red-400"
                    />
                    <div>
                      <div className="font-heading font-medium text-white">
                        Row {f.row}
                      </div>
                      <ul className="mt-1 list-disc pl-4 text-xs text-red-300">
                        {f.errors.map((e, i) => (
                          <li key={i}>
                            <span className="font-mono text-red-200">{e.path}</span>:{" "}
                            {e.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.createdCount > 0 && (
            <div className="card">
              <div className="border-b border-white/[0.06] px-6 py-3">
                <div className="eyebrow !text-emerald-400">CREATED CANDIDATES</div>
              </div>
              <ul className="divide-y divide-white/[0.05]">
                {result.created.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 px-6 py-3 text-sm"
                  >
                    <CheckCircle2
                      size={16}
                      className="shrink-0 text-emerald-400"
                    />
                    <Link
                      href={`/candidates/${c.id}`}
                      className="text-white transition hover:text-[#F7931A]"
                    >
                      <span className="font-mono text-stardust mr-2">Row {c.row}:</span>{c.fullName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={reset} className="btn-secondary">
              Upload another file
            </button>
            <button
              onClick={() => router.push("/candidates")}
              className="btn-primary"
            >
              Go to candidates
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
