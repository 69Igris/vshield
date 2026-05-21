"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function RootPage() {
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;
    router.replace(token ? "/dashboard" : "/login");
  }, [isHydrated, token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-sm text-slate-500">Loading...</div>
    </div>
  );
}
