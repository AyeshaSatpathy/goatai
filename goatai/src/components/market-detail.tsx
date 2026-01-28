"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TradeDialog } from "@/components/trade-dialog";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

type Market = {
  id: string;
  title: string;
  description: string;
  resolutionAt: string;
  stakePoints?: number | null;
  status: "OPEN" | "RESOLVED" | "CANCELED";
  creatorId: string;
  resolvedOutcomeId?: string | null;
  outcomes: Array<{ id: string; label: string; position: number }>;
  creator: { id: string; name: string | null; email: string; image: string | null };
};

type Stats = {
  totals: Array<{ outcomeId: string; amount: number; count: number }>;
  myPositions: Array<{ id: string; amount: number; status: string; outcomeId: string; createdAt: string }>;
  canResolve: boolean;
};

export function MarketDetail({ marketId }: { marketId: string }) {
  const { session } = useAuth();
  const [market, setMarket] = useState<Market | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tradeOpen, setTradeOpen] = useState(false);
  const [resolveOutcomeId, setResolveOutcomeId] = useState<string>("");
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const resolutionLabel = useMemo(() => {
    if (!market?.resolutionAt) return "—";
    const d = new Date(market.resolutionAt);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
  }, [market?.resolutionAt]);

  const totalsByOutcome = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    for (const t of stats?.totals ?? []) map.set(t.outcomeId, { amount: t.amount, count: t.count });
    return map;
  }, [stats?.totals]);

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const [mRes, sRes] = await Promise.all([
        fetch(`/api/markets/${marketId}`),
        fetch(`/api/markets/${marketId}/stats`),
      ]);

      const mJson = await mRes.json().catch(() => ({}));
      if (!mRes.ok) throw new Error(mJson?.error || "Failed to load market");

      const sJson = await sRes.json().catch(() => ({}));
      if (!sRes.ok) throw new Error(sJson?.error || "Failed to load market stats");

      setMarket(mJson);
      setStats(sJson);
    } catch (e) {
      console.error(e);
      setError("Could not load market");
      setMarket(null);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId, session?.user?.id]);

  const handleResolve = async () => {
    if (!resolveOutcomeId) return;
    try {
      setResolveError(null);
      setIsResolving(true);
      const res = await fetch(`/api/markets/${marketId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeId: resolveOutcomeId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResolveError(json?.error || "Failed to resolve market");
        setIsResolving(false);
        return;
      }
      setIsResolving(false);
      await load();
    } catch (e) {
      console.error(e);
      setResolveError("Failed to resolve market");
      setIsResolving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-muted-foreground">
          Loading…
        </div>
      </main>
    );
  }

  if (error || !market) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive mb-4">
            {error ?? "Market not found"}
          </div>
          <Link href="/#markets">
            <Button variant="outline" className="bg-transparent">Back to markets</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <Link href="/#markets" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to markets
            </Link>
            <h1 className="text-3xl font-bold text-foreground">{market.title}</h1>
            <p className="text-muted-foreground">{market.description}</p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground">
                Status: {market.status}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground">
                Resolves: {resolutionLabel}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground">
                Stake: {market.stakePoints ? `${market.stakePoints} karma` : "None"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="font-semibold"
              onClick={() => setTradeOpen(true)}
              disabled={!session?.user || market.status !== "OPEN"}
            >
              Trade
            </Button>
            <Button variant="outline" className="bg-transparent" onClick={load}>
              Refresh
            </Button>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Outcomes</h2>
            <div className="space-y-3">
              {market.outcomes.map((o) => {
                const t = totalsByOutcome.get(o.id) ?? { amount: 0, count: 0 };
                const isWinner = market.status === "RESOLVED" && market.resolvedOutcomeId === o.id;
                return (
                  <div
                    key={o.id}
                    className={cn(
                      "rounded-lg border px-4 py-3 flex items-center justify-between",
                      isWinner
                        ? "border-green-600/40 bg-green-500/10"
                        : "border-border bg-background"
                    )}
                  >
                    <div className="font-medium text-foreground">
                      {o.label}{" "}
                      {isWinner && (
                        <span className="ml-2 text-xs font-semibold text-green-700 dark:text-green-300">
                          WINNER
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t.amount} karma · {t.count} trades
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Your positions</h2>
              {!session?.user ? (
                <div className="text-sm text-muted-foreground">Sign in to see your positions.</div>
              ) : (stats?.myPositions?.length ?? 0) === 0 ? (
                <div className="text-sm text-muted-foreground">No positions on this market yet.</div>
              ) : (
                <div className="space-y-2">
                  {stats!.myPositions.map((p) => {
                    const outcomeLabel =
                      market.outcomes.find((o) => o.id === p.outcomeId)?.label ?? "—";
                    const statusColor =
                      p.status === "WON"
                        ? "text-green-700 dark:text-green-300"
                        : p.status === "LOST"
                        ? "text-red-600"
                        : "text-muted-foreground";
                    return (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 bg-background">
                        <div>
                          <div className="text-sm font-medium text-foreground">{outcomeLabel}</div>
                          <div className="text-xs text-muted-foreground">{p.amount} karma</div>
                        </div>
                        <div className={cn("text-xs font-semibold", statusColor)}>{p.status}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {stats?.canResolve && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">Resolve market</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  As the creator, you can pick the winning outcome.
                </p>

                <div className="space-y-2 mb-4">
                  <label className="text-sm font-medium text-foreground">Winning outcome</label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={resolveOutcomeId}
                    onChange={(e) => setResolveOutcomeId(e.target.value)}
                  >
                    <option value="">Select an outcome…</option>
                    {market.outcomes.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {resolveError && (
                  <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {resolveError}
                  </div>
                )}

                <Button
                  variant="destructive"
                  className="w-full font-semibold"
                  onClick={handleResolve}
                  disabled={!resolveOutcomeId || isResolving}
                >
                  {isResolving ? "Resolving..." : "Resolve"}
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>

      <TradeDialog
        open={tradeOpen}
        onOpenChange={setTradeOpen}
        market={{
          id: market.id,
          title: market.title,
          description: market.description,
          resolutionAt: market.resolutionAt,
          stakePoints: market.stakePoints ?? null,
          status: market.status,
          outcomes: market.outcomes,
          creatorId: market.creatorId,
        }}
        onTraded={load}
      />
    </main>
  );
}


