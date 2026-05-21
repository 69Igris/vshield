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
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} />
        Back to candidates
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bulk upload</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload a CSV of candidates. Each row is validated and inserted
            independently — bad rows don&apos;t block good ones.
          </p>
        </div>
        <button onClick={downloadTemplate} className="btn-secondary">
          <Download size={16} className="mr-1.5" />
          Sample template
        </button>
      </div>

      {/* Drop zone */}
      {!fileName && !result && (
        <div
          onClick={onPickClick}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="card flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center transition hover:border-brand-500 hover:bg-brand-50/50"
        >
          <Upload className="h-10 w-10 text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-900">
            Drop your CSV here, or click to browse
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Required headers: {REQUIRED_HEADERS.join(", ")}
          </p>
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
        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {fileName}
                </div>
                <div className="text-xs text-slate-500">
                  {rows.length > 0
                    ? `${rows.length} valid row(s) parsed`
                    : "No valid rows"}
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Remove file"
            >
              <X size={16} />
            </button>
          </div>

          {parseErrors.length > 0 && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4">
              {parseErrors.map((e, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm text-red-700"
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
                  <thead className="bg-slate-50 text-left font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2">#</th>
                      {REQUIRED_HEADERS.map((h) => (
                        <th key={h} className="px-4 py-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rows.slice(0, 10).map((r, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                        {REQUIRED_HEADERS.map((h) => (
                          <td key={h} className="px-4 py-2 text-slate-700">
                            {r[h] || (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 10 && (
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-center text-xs text-slate-500">
                    Showing first 10 of {rows.length} rows
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
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
                      <Loader2 size={16} className="mr-1.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-1.5" />
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
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Total rows
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {result.totalRows}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-xs uppercase tracking-wide text-green-700">
                Created
              </div>
              <div className="mt-1 text-2xl font-bold text-green-700">
                {result.createdCount}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-xs uppercase tracking-wide text-red-700">
                Failed
              </div>
              <div className="mt-1 text-2xl font-bold text-red-700">
                {result.failedCount}
              </div>
            </div>
          </div>

          {result.failed.length > 0 && (
            <div className="card">
              <div className="border-b border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900">
                Failed rows
              </div>
              <ul className="divide-y divide-slate-200">
                {result.failed.map((f) => (
                  <li
                    key={f.row}
                    className="flex items-start gap-3 px-6 py-3 text-sm"
                  >
                    <AlertCircle
                      size={16}
                      className="mt-0.5 shrink-0 text-red-600"
                    />
                    <div>
                      <div className="font-medium text-slate-900">
                        Row {f.row}
                      </div>
                      <ul className="mt-0.5 list-disc pl-4 text-xs text-red-700">
                        {f.errors.map((e, i) => (
                          <li key={i}>
                            <span className="font-mono">{e.path}</span>:{" "}
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
              <div className="border-b border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900">
                Created candidates
              </div>
              <ul className="divide-y divide-slate-200">
                {result.created.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 px-6 py-3 text-sm"
                  >
                    <CheckCircle2
                      size={16}
                      className="shrink-0 text-green-600"
                    />
                    <Link
                      href={`/candidates/${c.id}`}
                      className="text-slate-900 hover:text-brand-700"
                    >
                      Row {c.row}: {c.fullName}
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
