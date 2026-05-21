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

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace("/login");
    }
  }, [isHydrated, token, router]);

  if (!isHydrated || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-stardust">
          Initializing...
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-void text-white">
      {/* Ambient background layers — they sit fixed behind everything */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
        <div className="ambient-glow-orange absolute -top-32 -left-40 h-[420px] w-[420px]" />
        <div className="ambient-glow-gold absolute -bottom-32 -right-40 h-[480px] w-[480px]" />
      </div>

      <Sidebar />
      <div className="relative flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
