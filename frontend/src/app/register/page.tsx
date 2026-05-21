"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { authApi } from "@/lib/services/auth.api";
import { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

const schema = z
  .object({
    name: z.string().min(2, "Name is too short").max(100),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && token) router.replace("/dashboard");
  }, [isHydrated, token, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { user, token } = await authApi.register({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      setAuth(user, token);
      toast.success(`Welcome, ${user.name}`);
      router.replace("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const perks = [
    "Run Aadhaar & PAN checks in one click",
    "PDF reports with masked identity numbers",
    "Bulk upload up to 500 candidates per file",
    "JWT auth, bcrypt password hashing, rate-limited APIs",
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-void text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
        <div className="ambient-glow-orange absolute -top-40 right-0 h-[520px] w-[520px]" />
        <div className="ambient-glow-gold absolute -bottom-40 -left-40 h-[520px] w-[520px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-12">
        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left — form */}
          <div className="mx-auto w-full max-w-md order-2 lg:order-1">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] text-white">
                <ShieldCheck size={20} strokeWidth={2.4} />
              </div>
              <div>
                <div className="font-heading text-base font-bold">VShield</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-stardust">
                  BGV PLATFORM
                </div>
              </div>
            </div>

            <div className="card-glass p-8 sm:p-10">
              <div className="eyebrow mb-3">CREATE ACCOUNT</div>
              <h2 className="font-heading text-3xl font-bold text-white">
                Start <span className="text-gradient">verifying</span> in minutes.
              </h2>
              <p className="mt-2 text-sm text-stardust">
                Free to start. No card required.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
                <div>
                  <label className="label" htmlFor="name">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Doe"
                    className="input"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="input"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className="input pr-12"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stardust hover:bg-white/5 hover:text-white"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="confirmPassword">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      className="input pr-12"
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stardust hover:bg-white/5 hover:text-white"
                      tabIndex={-1}
                      aria-label={
                        showConfirm ? "Hide confirm password" : "Show confirm password"
                      }
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Creating account
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-stardust">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-[#F7931A] underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Right — perks panel */}
          <div className="hidden flex-col justify-center order-1 lg:order-2 lg:flex">
            <Link href="/" className="mb-12 flex items-center gap-3">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] text-white shadow-[0_0_25px_-5px_rgba(247,147,26,0.7)]">
                  <ShieldCheck size={22} strokeWidth={2.4} />
                </div>
                <span className="absolute -inset-1 rounded-xl bg-[#F7931A] opacity-25 blur-md -z-10" />
              </div>
              <div>
                <div className="font-heading text-xl font-bold leading-none">VShield</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-stardust">
                  BGV PLATFORM
                </div>
              </div>
            </Link>

            <div className="eyebrow mb-4">WHAT YOU GET</div>
            <h1 className="font-heading text-5xl font-bold leading-[1.05] xl:text-6xl">
              Background checks <span className="text-gradient">made simple</span>.
            </h1>

            <ul className="mt-8 space-y-4">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F7931A]/15 text-[#F7931A] ring-1 ring-[#F7931A]/30">
                    <CheckCircle2 size={14} strokeWidth={2.6} />
                  </div>
                  <span className="text-stardust">{p}</span>
                </li>
              ))}
            </ul>

            <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#FFD600] to-[#F7931A] text-void">
                  <ShieldCheck size={18} strokeWidth={2.4} />
                </div>
                <div className="text-sm text-stardust">
                  Identity numbers are masked the moment they leave the
                  database. Nothing sensitive ever appears in logs, reports,
                  or analytics.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
