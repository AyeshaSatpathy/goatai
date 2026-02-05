"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CollegeSelector } from "@/components/college-selector";
import { getCollegeById } from "@/lib/colleges";

type WalletResponse = {
  user: { id: string; name: string | null; email: string; image: string | null; karmaBalance: number; campusId?: string | null };
  positions: Array<{
    id: string;
    amount: number;
    payout?: number | null;
    status: "OPEN" | "WON" | "LOST" | "REFUNDED";
    createdAt: string;
    market: { id: string; title: string; status: "OPEN" | "RESOLVED" | "CANCELED"; resolutionAt: string; resolvedAt: string | null };
    outcome: { id: string; label: string };
  }>;
};

export function WalletView() {
  const [data, setData] = useState<WalletResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await fetch("/api/wallet");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || "Failed to load wallet");
        setData(null);
        setIsLoading(false);
        return;
      }
      setData(json);
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      setError("Failed to load wallet");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Wallet</h1>
            <p className="text-muted-foreground">
              Your Karma balance and positions.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-transparent" onClick={load}>
              Refresh
            </Button>
            <Link href="/#markets">
              <Button className="font-semibold">Browse Markets</Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : !data ? (
          <div className="text-muted-foreground">
            Sign in to view your wallet.
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Campus</div>
                  <div className="text-xl font-bold text-foreground">
                    {getCollegeById(data.user.campusId)?.name ?? "Not selected"}
                  </div>
                </div>
                <div className="w-full md:w-[360px]">
                  <CollegeSelector />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                You can change your campus anytime — it’s saved to your profile.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 mb-8">
              <div className="text-sm text-muted-foreground mb-1">Karma balance</div>
              <div className="text-4xl font-bold text-foreground">{data.user.karmaBalance}</div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Positions</h2>
                <span className="text-sm text-muted-foreground">{data.positions.length} total</span>
              </div>

              {data.positions.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
                  No positions yet. Go place a trade.
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card divide-y divide-border">
                  {data.positions.map((p) => (
                    <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="font-medium text-foreground">{p.market.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Outcome: <span className="text-foreground">{p.outcome.label}</span> · Stake:{" "}
                          <span className="text-foreground">{p.amount}</span> karma
                          {p.market.status === "RESOLVED" && typeof p.payout === "number" && (
                            <>
                              {" "}
                              · Payout: <span className="text-foreground">{p.payout}</span> karma
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground">
                          {p.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Market: {p.market.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}


