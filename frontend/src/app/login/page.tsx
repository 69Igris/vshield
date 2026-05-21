"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ShieldCheck, Loader2, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";

import { authApi } from "@/lib/services/auth.api";
import { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && token) router.replace("/dashboard");
  }, [isHydrated, token, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const fillDemoCredentials = () => {
    setValue("email", "admin@test.com", { shouldValidate: true });
    setValue("password", "password123", { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { user, token } = await authApi.login(values);
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name}`);
      router.replace("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-void text-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
        <div className="ambient-glow-orange absolute -top-40 -left-40 h-[520px] w-[520px]" />
        <div className="ambient-glow-gold absolute -bottom-40 right-0 h-[520px] w-[520px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-12">
        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left — brand panel */}
          <div className="hidden flex-col justify-between lg:flex">
            <Link href="/" className="flex items-center gap-3">
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

            <div>
              <div className="eyebrow mb-4">
                <span className="live-dot" />
                Trusted by recruiters across India
              </div>
              <h1 className="font-heading text-5xl font-bold leading-[1.05] xl:text-6xl">
                Identity, <span className="text-gradient">verified</span>.
                <br />
                In seconds.
              </h1>
              <p className="mt-6 max-w-md text-lg text-stardust">
                Run Aadhaar and PAN verification, generate professional audit
                reports, and ship clean candidate data — all from a single
                dashboard.
              </p>
            </div>

            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-stardust">
              © 2026 VShield · v1.0
            </div>
          </div>

          {/* Right — form card */}
          <div className="mx-auto w-full max-w-md">
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
              <div className="eyebrow mb-3">SIGN IN</div>
              <h2 className="font-heading text-3xl font-bold text-white">
                Welcome <span className="text-gradient">back</span>.
              </h2>
              <p className="mt-2 text-sm text-stardust">
                Enter your credentials to access the verification dashboard.
              </p>

              {/* Demo credentials panel — for reviewers / first-time visitors */}
              <div className="mt-6 rounded-xl border border-[#F7931A]/25 bg-gradient-to-br from-[#F7931A]/[0.06] to-[#FFD600]/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Sparkles size={14} className="mt-0.5 shrink-0 text-[#FFD600]" />
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FFD600]">
                        DEMO CREDENTIALS
                      </div>
                      <div className="mt-2 space-y-1 font-mono text-[12px] text-white">
                        <div>
                          <span className="text-stardust">email:</span> admin@test.com
                        </div>
                        <div>
                          <span className="text-stardust">password:</span> password123
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fillDemoCredentials}
                    className="shrink-0 rounded-full border border-[#F7931A]/40 bg-[#F7931A]/10 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#F7931A] transition hover:border-[#F7931A] hover:bg-[#F7931A]/20 hover:text-white"
                  >
                    Use demo
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
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
                      autoComplete="current-password"
                      placeholder="••••••••"
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

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Signing in
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-stardust">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-[#F7931A] underline-offset-4 hover:underline"
                >
                  Create one
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-stardust">
              Identity numbers are masked and stored securely
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
