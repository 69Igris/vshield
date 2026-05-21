interface Props {
  status: string;
  size?: "sm" | "md";
}

// Tuned for the dark void background — semi-transparent fill + bright text,
// ring uses the same hue for that "glowing badge" look.
const styles: Record<string, string> = {
  VERIFIED:
    "bg-emerald-500/10 text-emerald-300 ring-emerald-400/30 shadow-[0_0_18px_-4px_rgba(16,185,129,0.4)]",
  FAILED:
    "bg-red-500/10 text-red-300 ring-red-400/30 shadow-[0_0_18px_-4px_rgba(239,68,68,0.4)]",
  PARTIAL:
    "bg-[#FFD600]/10 text-[#FFD600] ring-[#FFD600]/30 shadow-[0_0_18px_-4px_rgba(255,214,0,0.4)]",
  PENDING:
    "bg-[#F7931A]/10 text-[#F7931A] ring-[#F7931A]/30 shadow-[0_0_18px_-4px_rgba(247,147,26,0.4)]",
  NOT_RUN: "bg-white/5 text-stardust ring-white/15",
};

export default function StatusBadge({ status, size = "md" }: Props) {
  const style = styles[status] ?? styles.NOT_RUN;
  const sizeClass =
    size === "sm"
      ? "text-[10px] px-2 py-0.5 tracking-wider"
      : "text-[11px] px-2.5 py-1 tracking-widest";
  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-semibold uppercase ring-1 ring-inset ${style} ${sizeClass}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
