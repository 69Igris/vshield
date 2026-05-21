interface Props {
  status: string;
  size?: "sm" | "md";
}

const styles: Record<string, string> = {
  VERIFIED: "bg-green-100 text-green-800 ring-green-600/20",
  FAILED: "bg-red-100 text-red-800 ring-red-600/20",
  PARTIAL: "bg-yellow-100 text-yellow-800 ring-yellow-600/20",
  PENDING: "bg-indigo-100 text-indigo-800 ring-indigo-600/20",
  NOT_RUN: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export default function StatusBadge({ status, size = "md" }: Props) {
  const style = styles[status] ?? styles.NOT_RUN;
  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ring-1 ring-inset tracking-wide ${style} ${sizeClass}`}
    >
      {status}
    </span>
  );
}
