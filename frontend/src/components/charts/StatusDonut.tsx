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

const COLORS = {
  Verified: "#16a34a",
  Pending: "#4f46e5",
  Partial: "#ca8a04",
  Failed: "#dc2626",
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
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
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
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name as keyof typeof COLORS]}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              color: "white",
            }}
            itemStyle={{ color: "white" }}
            formatter={(v: number, n: string) => [`${v} candidates`, n]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
