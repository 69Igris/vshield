"use client";

import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";

export default function Header() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = () => {
    clearAuth();
    toast.success("Signed out");
    router.replace("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="relative flex h-16 items-center justify-between border-b border-white/[0.06] bg-matter/40 px-4 backdrop-blur-xl sm:px-6">
      {/* Mobile brand */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#EA580C] to-[#F7931A] text-white">
          <ShieldCheck size={16} strokeWidth={2.5} />
        </div>
        <span className="font-heading text-sm font-bold">VShield</span>
      </div>
      <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-stardust">
        <span className="live-dot" />
        <span>Mainnet · India</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium text-white">{user?.name ?? "—"}</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-stardust">
            {user?.email ?? ""}
          </div>
        </div>
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] font-mono text-xs font-bold text-white ring-2 ring-white/10">
            {initials}
          </div>
          <span className="absolute -inset-1 rounded-full bg-[#F7931A] opacity-25 blur-sm -z-10" />
        </div>
        <button
          onClick={handleLogout}
          className="btn-ghost"
          title="Sign out"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
