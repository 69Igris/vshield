"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuthStore } from "@/store/auth.store";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Once hydrated, kick out if no token
  useEffect(() => {
    if (isHydrated && !token) {
      router.replace("/login");
    }
  }, [isHydrated, token, router]);

  // Avoid flash of protected content while we hydrate
  if (!isHydrated || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
