"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="lg:hidden flex items-center gap-2">
        <div className="text-sm font-bold text-slate-900">VShield</div>
      </div>
      <div />

      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right">
          <div className="text-sm font-medium text-slate-900">
            {user?.name ?? "—"}
          </div>
          <div className="text-xs text-slate-500">{user?.email ?? ""}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {initials}
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          title="Sign out"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
