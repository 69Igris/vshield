"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import CandidateForm, {
  type CandidateFormValues,
} from "@/components/CandidateForm";
import { candidateApi } from "@/lib/services/candidate.api";
import { getErrorMessage } from "@/lib/api";

export default function NewCandidatePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: CandidateFormValues) => {
    setSubmitting(true);
    try {
      const created = await candidateApi.create(values);
      toast.success("Candidate created");
      router.push(`/candidates/${created.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/candidates"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} />
        Back to candidates
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-slate-900">Add candidate</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter candidate details to begin the verification process.
        </p>
      </div>

      <div className="card mt-6 p-6">
        <CandidateForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </div>
  );
}
