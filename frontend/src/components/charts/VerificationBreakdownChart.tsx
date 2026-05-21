"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VerificationBreakdownRow } from "@/types";

interface Props {
  data: VerificationBreakdownRow[];
}

export default function VerificationBreakdownChart({ data }: Props) {
  const allZero = data.every((r) => r.verified === 0 && r.failed === 0);

  return (
    <div className="h-64">
      {allZero ? (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">
          No verifications run yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 12, bottom: 0, left: -20 }}
            barGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="type"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                color: "white",
              }}
              itemStyle={{ color: "white" }}
              labelStyle={{ color: "#94a3b8" }}
              cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar
              dataKey="verified"
              name="Verified"
              fill="#16a34a"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="failed"
              name="Failed"
              fill="#dc2626"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
