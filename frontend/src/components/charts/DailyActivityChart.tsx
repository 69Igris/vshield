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
        <div className="flex h-full items-center justify-center text-sm text-slate-400">
          No activity in the last 7 days
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 12, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id="brandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
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
              formatter={(v: number) => [`${v} candidate(s)`, "Created"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#brandFill)"
              dot={{ r: 3, fill: "#2563eb" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
