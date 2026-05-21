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
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/candidates"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-stardust transition hover:text-white"
      >
        <ArrowLeft size={14} />
        Back to candidates
      </Link>

      <div>
        <div className="eyebrow">NEW CANDIDATE</div>
        <h1 className="mt-3 font-heading text-3xl font-bold text-white">
          Add a <span className="text-gradient">candidate</span>
        </h1>
        <p className="mt-2 text-sm text-stardust">
          Enter candidate details to begin the verification process.
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        <CandidateForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </div>
  );
}
