"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { TrendingUp } from "lucide-react";

type Outcome = {
  id: string;
  label: string;
};

type HistoryPoint = {
  timestamp: string;
  totalPool: number;
  odds: Array<{
    outcomeId: string;
    label: string;
    probability: number;
  }>;
};

type PriceHistoryData = {
  outcomes: Outcome[];
  history: HistoryPoint[];
};

interface PriceHistoryChartProps {
  marketId: string;
}

// Color palette for different outcomes
const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

export function PriceHistoryChart({ marketId }: PriceHistoryChartProps) {
  const [data, setData] = useState<PriceHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/markets/${marketId}/history`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load history");
        setData(json);
      } catch (e) {
        console.error(e);
        setError("Could not load price history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [marketId]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Price History</h2>
        </div>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Loading chart...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Price History</h2>
        </div>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          {error || "No data available"}
        </div>
      </div>
    );
  }

  // Transform data for recharts
  const chartData = data.history.map((point) => {
    const entry: Record<string, number | string> = {
      time: new Date(point.timestamp).getTime(),
      formattedTime: format(new Date(point.timestamp), "MMM d, HH:mm"),
      totalPool: point.totalPool,
    };

    for (const odd of point.odds) {
      entry[odd.outcomeId] = Math.round(odd.probability * 100);
    }

    return entry;
  });

  // If only one data point, show a message
  if (chartData.length <= 1) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Price History</h2>
        </div>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Not enough trading activity to show a chart yet.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Price History</h2>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="formattedTime"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              className="text-muted-foreground"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              width={40}
              className="text-muted-foreground"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload) return null;
                return (
                  <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
                    <div className="text-xs text-muted-foreground mb-2">{label}</div>
                    {payload.map((entry, idx) => {
                      const outcome = data.outcomes.find((o) => o.id === entry.dataKey);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-4 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-foreground">
                              {outcome?.label || entry.dataKey}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">
                            {entry.value}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
            <Legend
              formatter={(value) => {
                const outcome = data.outcomes.find((o) => o.id === value);
                return (
                  <span className="text-xs text-muted-foreground">
                    {outcome?.label || value}
                  </span>
                );
              }}
            />
            {data.outcomes.map((outcome, idx) => (
              <Line
                key={outcome.id}
                type="monotone"
                dataKey={outcome.id}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-xs text-muted-foreground text-center">
        Based on {data.history.length} data points
      </div>
    </div>
  );
}
