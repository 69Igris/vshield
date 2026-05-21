"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ShieldCheck, Loader2 } from "lucide-react";

import { authApi } from "@/lib/services/auth.api";
import { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  name: z.string().min(2, "Name is too short").max(100),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [submitting, setSubmitting] = useState(false);

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
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { user, token } = await authApi.register(values);
      setAuth(user, token);
      toast.success(`Welcome, ${user.name}`);
      router.replace("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">VShield</h1>
            <p className="text-xs text-slate-500">
              Background Verification Platform
            </p>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold text-slate-900">Create account</h2>
          <p className="mt-1 text-sm text-slate-500">
            Get started by creating your verifier account.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
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
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
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
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="input"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
