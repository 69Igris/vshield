"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";

const aadhaarRegex = /^\d{12}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const phoneRegex = /^\+?[0-9]{10,15}$/;

// Create-mode: aadhaar + PAN required
const createSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(phoneRegex, "Invalid phone (10–15 digits, optional +country code)"),
  aadhaarNumber: z
    .string()
    .regex(aadhaarRegex, "Aadhaar must be exactly 12 digits"),
  panNumber: z
    .string()
    .transform((v) => v.toUpperCase())
    .pipe(z.string().regex(panRegex, "Invalid PAN (expected ABCDE1234F)")),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), {
      message: "Invalid date",
    }),
  address: z.string().min(5, "Address is too short").max(500),
});

// Edit-mode: aadhaar + PAN optional (blank means "keep existing")
const editSchema = createSchema
  .extend({
    aadhaarNumber: z
      .string()
      .refine((v) => v === "" || aadhaarRegex.test(v), {
        message: "Aadhaar must be exactly 12 digits",
      }),
    panNumber: z
      .string()
      .transform((v) => v.toUpperCase())
      .pipe(
        z.string().refine((v) => v === "" || panRegex.test(v), {
          message: "Invalid PAN (expected ABCDE1234F)",
        })
      ),
  });

export const candidateFormSchema = createSchema;
export type CandidateFormValues = z.infer<typeof createSchema>;

interface Props {
  defaultValues?: Partial<CandidateFormValues>;
  onSubmit: (values: CandidateFormValues) => Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
  mode?: "create" | "edit";
}

export default function CandidateForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Save candidate",
  mode = "create",
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CandidateFormValues>({
    resolver: zodResolver(mode === "edit" ? editSchema : createSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      aadhaarNumber: "",
      panNumber: "",
      dob: "",
      address: "",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            className="input"
            placeholder="Jane Doe"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="dob">
            Date of birth
          </label>
          <input
            id="dob"
            type="date"
            className="input"
            {...register("dob")}
          />
          {errors.dob && (
            <p className="mt-1 text-xs text-red-600">{errors.dob.message}</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="jane@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            className="input"
            placeholder="9876543210"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="aadhaarNumber">
            Aadhaar number
          </label>
          <input
            id="aadhaarNumber"
            className="input font-mono"
            placeholder="123412341234"
            maxLength={12}
            {...register("aadhaarNumber")}
          />
          {errors.aadhaarNumber && (
            <p className="mt-1 text-xs text-red-600">
              {errors.aadhaarNumber.message}
            </p>
          )}
          <p className="mt-1 text-[11px] text-slate-500">
            Stored securely. Will be masked in all reports.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="panNumber">
            PAN number
          </label>
          <input
            id="panNumber"
            className="input font-mono uppercase"
            placeholder="ABCDE1234F"
            maxLength={10}
            {...register("panNumber")}
          />
          {errors.panNumber && (
            <p className="mt-1 text-xs text-red-600">
              {errors.panNumber.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="address">
          Address
        </label>
        <textarea
          id="address"
          rows={3}
          className="input resize-none"
          placeholder="Street, city, state, PIN code"
          {...register("address")}
        />
        {errors.address && (
          <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} className="mr-1.5" />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
