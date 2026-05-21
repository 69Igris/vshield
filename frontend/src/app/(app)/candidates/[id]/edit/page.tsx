"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import CandidateForm, {
  type CandidateFormValues,
} from "@/components/CandidateForm";
import { candidateApi } from "@/lib/services/candidate.api";
import { getErrorMessage } from "@/lib/api";

export default function EditCandidatePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [defaults, setDefaults] = useState<Partial<CandidateFormValues> | null>(
    null
  );

  // NOTE: The list/detail API masks aadhaar/PAN, so they can't be re-edited.
  // We pre-fill the form with everything EXCEPT raw aadhaar/PAN — those stay
  // blank and the user can leave them empty (we only PATCH provided fields).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await candidateApi.getById(id);
        if (cancelled) return;
        setDefaults({
          fullName: c.fullName,
          email: c.email,
          phone: c.phone,
          dob: new Date(c.dob).toISOString().slice(0, 10),
          address: c.address,
          // aadhaar/PAN intentionally blank — masked from API
          aadhaarNumber: "",
          panNumber: "",
        });
      } catch (err) {
        toast.error(getErrorMessage(err));
        router.push("/candidates");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const handleSubmit = async (values: CandidateFormValues) => {
    setSubmitting(true);
    try {
      // Only send fields the user touched. If aadhaar/PAN were left blank
      // (because they were never re-entered), omit them so we don't overwrite.
      // For simplicity here we ALWAYS update everything except aadhaar/PAN
      // unless they were re-entered with valid values.
      const payload: Partial<CandidateFormValues> = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        dob: values.dob,
        address: values.address,
      };
      if (values.aadhaarNumber) payload.aadhaarNumber = values.aadhaarNumber;
      if (values.panNumber) payload.panNumber = values.panNumber;

      await candidateApi.update(id, payload);
      toast.success("Candidate updated");
      router.push(`/candidates/${id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/candidates/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} />
        Back to candidate
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-slate-900">Edit candidate</h1>
        <p className="mt-1 text-sm text-slate-500">
          Leave Aadhaar/PAN blank to keep the existing values.
        </p>
      </div>

      <div className="card mt-6 p-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded bg-slate-100"
              />
            ))}
          </div>
        ) : defaults ? (
          <CandidateForm
            mode="edit"
            defaultValues={defaults}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel="Save changes"
          />
        ) : null}
      </div>
    </div>
  );
}
