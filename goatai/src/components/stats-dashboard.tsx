"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Flame,
  Trophy,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

type StatsData = {
  karmaBalance: number;
  memberSince: string;
  summary: {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalStaked: number;
    totalPayout: number;
    profit: number;
    roi: number;
    openPositions: number;
    totalAtRisk: number;
    marketsCreated: number;
    currentStreak: number;
    maxStreak: number;
  };
  bestTrade: {
    market: { id: string; title: string };
    outcome: { label: string };
    amount: number;
    payout: number;
    profit: number;
  } | null;
  worstTrade: {
    market: { id: string; title: string };
    outcome: { label: string };
    amount: number;
    payout: number;
    profit: number;
  } | null;
  monthlyPerformance: Array<{
    month: string;
    trades: number;
    wins: number;
    profit: number;
  }>;
  recentTrades: Array<{
    id: string;
    market: { id: string; title: string; status: string };
    outcome: { label: string };
    amount: number;
    payout: number | null;
    status: string;
    createdAt: string;
  }>;
};

export function StatsDashboard() {
  const { session } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/me/stats");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load stats");
        setStats(json);
      } catch (e) {
        console.error(e);
        setError("Could not load your stats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [session?.user]);

  if (!session?.user) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Your Stats Dashboard</h2>
            <p className="text-muted-foreground">Sign in to see your personal trading stats</p>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-muted-foreground">Loading your stats...</div>
        </div>
      </section>
    );
  }

  if (error || !stats) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-destructive">{error || "Could not load stats"}</div>
        </div>
      </section>
    );
  }

  const { summary, monthlyPerformance, bestTrade, worstTrade, recentTrades } = stats;

  return (
    <section id="stats" className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your Stats</h2>
            <p className="text-muted-foreground">Track your prediction performance</p>
          </div>
          <Link href="/wallet" className="text-primary hover:underline text-sm font-medium">
            View Wallet →
          </Link>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Target className="h-5 w-5" />}
            label="Win Rate"
            value={`${Math.round(summary.winRate * 100)}%`}
            subtext={`${summary.wins}W / ${summary.losses}L`}
            variant={summary.winRate >= 0.5 ? "positive" : "negative"}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Total Profit"
            value={`${summary.profit >= 0 ? "+" : ""}${summary.profit}`}
            subtext={`${Math.round(summary.roi * 100)}% ROI`}
            variant={summary.profit >= 0 ? "positive" : "negative"}
          />
          <StatCard
            icon={<Flame className="h-5 w-5" />}
            label="Current Streak"
            value={`${summary.currentStreak}`}
            subtext={`Best: ${summary.maxStreak}`}
            variant="neutral"
          />
          <StatCard
            icon={<Wallet className="h-5 w-5" />}
            label="Karma Balance"
            value={stats.karmaBalance.toLocaleString()}
            subtext={`${summary.totalAtRisk} at risk`}
            variant="neutral"
          />
        </div>

        {/* Monthly Performance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Monthly Performance
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyPerformance}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v >= 0 ? `+${v}` : v)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-sm">
                          <div className="font-medium text-foreground">{data.month}</div>
                          <div className="text-muted-foreground">{data.trades} trades</div>
                          <div className={cn(
                            "font-medium",
                            data.profit >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {data.profit >= 0 ? "+" : ""}{data.profit} karma
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {monthlyPerformance.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.profit >= 0 ? "#22c55e" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Best/Worst Trades */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Notable Trades
            </h3>
            <div className="space-y-4">
              {bestTrade && (
                <div className="p-4 rounded-lg border border-green-600/30 bg-green-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      Best Trade
                    </span>
                  </div>
                  <Link
                    href={`/markets/${bestTrade.market.id}`}
                    className="text-sm font-medium text-foreground hover:underline line-clamp-1"
                  >
                    {bestTrade.market.title}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-1">
                    {bestTrade.outcome.label} · {bestTrade.amount} → {bestTrade.payout}
                  </div>
                  <div className="text-sm font-semibold text-green-600 mt-1">
                    +{bestTrade.profit} karma
                  </div>
                </div>
              )}

              {worstTrade && (
                <div className="p-4 rounded-lg border border-red-600/30 bg-red-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-300">
                      Worst Trade
                    </span>
                  </div>
                  <Link
                    href={`/markets/${worstTrade.market.id}`}
                    className="text-sm font-medium text-foreground hover:underline line-clamp-1"
                  >
                    {worstTrade.market.title}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-1">
                    {worstTrade.outcome.label} · {worstTrade.amount} → {worstTrade.payout}
                  </div>
                  <div className="text-sm font-semibold text-red-600 mt-1">
                    {worstTrade.profit} karma
                  </div>
                </div>
              )}

              {!bestTrade && !worstTrade && (
                <div className="text-center text-muted-foreground py-8">
                  No resolved trades yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Recent Trades</h3>
          {recentTrades.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No trades yet. Start predicting!
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrades.slice(0, 5).map((trade) => (
                <Link
                  key={trade.id}
                  href={`/markets/${trade.market.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground line-clamp-1">
                      {trade.market.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trade.outcome.label} · {trade.amount} karma
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        trade.status === "WON"
                          ? "bg-green-500/10 text-green-700 dark:text-green-300"
                          : trade.status === "LOST"
                          ? "bg-red-500/10 text-red-700 dark:text-red-300"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {trade.status === "OPEN" ? "Pending" : trade.status}
                    </span>
                    {trade.status !== "OPEN" && trade.payout !== null && (
                      <div
                        className={cn(
                          "text-xs mt-1",
                          (trade.payout - trade.amount) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {(trade.payout - trade.amount) >= 0 ? "+" : ""}
                        {trade.payout - trade.amount}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  variant: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "p-1.5 rounded-lg",
            variant === "positive"
              ? "bg-green-500/10 text-green-600"
              : variant === "negative"
              ? "bg-red-500/10 text-red-600"
              : "bg-muted text-muted-foreground"
          )}
        >
          {icon}
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div
        className={cn(
          "text-2xl font-bold",
          variant === "positive"
            ? "text-green-600 dark:text-green-400"
            : variant === "negative"
            ? "text-red-600 dark:text-red-400"
            : "text-foreground"
        )}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{subtext}</div>
    </div>
  );
}
