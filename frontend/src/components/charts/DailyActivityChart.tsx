"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeseriesBucket } from "@/types";

interface Props {
  data: TimeseriesBucket[];
}

export default function DailyActivityChart({ data }: Props) {
  const allZero = data.every((d) => d.count === 0);

  return (
    <div className="h-64">
      {allZero ? (
        <div className="flex h-full items-center justify-center font-mono text-xs uppercase tracking-widest text-stardust/60">
          No activity in the last 7 days
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 12, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id="btcFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F7931A" stopOpacity={0.55} />
                <stop offset="60%" stopColor="#F7931A" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#F7931A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
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
              formatter={(v: number) => [`${v} candidate(s)`, "Created"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#F7931A"
              strokeWidth={2}
              fill="url(#btcFill)"
              dot={{ r: 3, fill: "#F7931A", stroke: "#FFD600", strokeWidth: 1 }}
              activeDot={{ r: 6, fill: "#FFD600", stroke: "#F7931A", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
