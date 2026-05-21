"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidates", label: "Candidates", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative hidden lg:flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-matter/60 backdrop-blur-xl">
      {/* Brand */}
      <div className="relative flex h-16 items-center gap-3 border-b border-white/[0.06] px-6">
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] text-white shadow-[0_0_20px_-5px_rgba(247,147,26,0.7)]">
            <ShieldCheck size={18} strokeWidth={2.5} />
          </div>
          <span className="absolute -inset-1 rounded-xl bg-[#F7931A] opacity-20 blur-md -z-10" />
        </div>
        <div>
          <div className="font-heading text-sm font-bold tracking-tight text-white">
            VShield
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-stardust">
            BGV PLATFORM
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 font-mono text-[12px] uppercase tracking-wider transition-all ${
                isActive
                  ? "text-white"
                  : "text-stardust hover:bg-white/5 hover:text-white"
              }`}
            >
              {isActive && (
                <>
                  <span className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-[#EA580C]/20 to-[#F7931A]/10 ring-1 ring-inset ring-[#F7931A]/30" />
                  <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-gradient-to-b from-[#FFD600] to-[#F7931A] shadow-[0_0_10px_rgba(247,147,26,0.8)]" />
                </>
              )}
              <Icon
                size={16}
                strokeWidth={isActive ? 2.4 : 1.8}
                className={isActive ? "text-[#F7931A]" : "text-stardust group-hover:text-white"}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Network status */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-stardust">
          <span className="live-dot" />
          <span>Network · Operational</span>
        </div>
        <div className="mt-2 font-mono text-[10px] text-stardust/60">v1.0.0</div>
      </div>
    </aside>
  );
}
