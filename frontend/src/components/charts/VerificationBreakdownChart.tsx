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
        <div className="flex h-full items-center justify-center font-mono text-xs uppercase tracking-widest text-stardust/60">
          No verifications run yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 12, bottom: 0, left: -20 }}
            barGap={6}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="type"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              style={{ fontFamily: "var(--font-mono)" }}
            />
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
              labelStyle={{ color: "#94A3B8" }}
              cursor={{ fill: "rgba(247,147,26,0.05)" }}
            />
            <Legend
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
            <Bar
              dataKey="verified"
              name="Verified"
              fill="#22C55E"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="failed"
              name="Failed"
              fill="#EF4444"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
