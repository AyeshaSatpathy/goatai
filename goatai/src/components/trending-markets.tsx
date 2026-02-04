"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, TrendingUp, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/countdown-timer";
import { useCollege } from "@/components/college-context";
import { cn } from "@/lib/utils";

type TrendingMarket = {
  id: string;
  title: string;
  description: string;
  resolutionAt: string;
  status: string;
  outcomes: Array<{ id: string; label: string }>;
  totalPool: number;
  tradeCount: number;
  recentTrades: number;
  recentVolume: number;
  trendScore: number;
};

export function TrendingMarkets() {
  const { selectedCollege } = useCollege();
  const [markets, setMarkets] = useState<TrendingMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const qs = selectedCollege?.id ? `?collegeId=${selectedCollege.id}` : "";
        const res = await fetch(`/api/markets/trending${qs}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load trending");
        setMarkets(json);
      } catch (e) {
        console.error(e);
        setError("Could not load trending markets");
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedCollege?.id) {
      fetchTrending();
    } else {
      setMarkets([]);
      setIsLoading(false);
    }
  }, [selectedCollege?.id]);

  if (!selectedCollege?.id) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-muted-foreground">Loading trending markets...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return null;
  }

  if (markets.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-bold text-foreground">Trending Now</h2>
          </div>
          <Link href="#markets">
            <Button variant="ghost" size="sm">
              View All →
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.slice(0, 3).map((market, idx) => (
            <Link
              key={market.id}
              href={`/markets/${market.id}`}
              className={cn(
                "group relative rounded-xl border p-5 transition-all hover:shadow-lg",
                idx === 0
                  ? "border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-transparent"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {/* Trending Badge */}
              {idx === 0 && (
                <div className="absolute -top-2 -right-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold shadow-lg">
                    <Flame className="h-3 w-3" />
                    Hot
                  </span>
                </div>
              )}

              <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {market.title}
              </h3>

              <div className="flex flex-wrap gap-2 mb-3">
                {market.outcomes.slice(0, 2).map((o) => (
                  <span
                    key={o.id}
                    className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-foreground"
                  >
                    {o.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {market.tradeCount} trades
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {market.totalPool} karma
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <CountdownTimer
                  targetDate={new Date(market.resolutionAt)}
                  compact
                />
              </div>

              {/* Recent Activity Indicator */}
              {market.recentTrades > 0 && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  {market.recentTrades} trades in last 24h
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
