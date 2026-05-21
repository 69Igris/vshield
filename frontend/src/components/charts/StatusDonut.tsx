"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CandidateStats } from "@/types";

interface Props {
  stats: CandidateStats;
}

// Tuned for the dark void background — bright, glowing slices.
const COLORS = {
  Verified: "#22C55E", // emerald
  Pending: "#F7931A", // bitcoin orange
  Partial: "#FFD600", // digital gold
  Failed: "#EF4444", // red
};

export default function StatusDonut({ stats }: Props) {
  const data = [
    { name: "Verified", value: stats.verified },
    { name: "Pending", value: stats.pending },
    { name: "Partial", value: stats.partial },
    { name: "Failed", value: stats.failed },
  ].filter((d) => d.value > 0);

  if (stats.total === 0) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-xs uppercase tracking-widest text-stardust/60">
        No data yet
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name as keyof typeof COLORS]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F1115",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              fontSize: 12,
              color: "white",
              fontFamily: "var(--font-mono)",
            }}
            itemStyle={{ color: "white" }}
            formatter={(v: number, n: string) => [`${v} candidates`, n]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: 11,
              color: "#94A3B8",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
