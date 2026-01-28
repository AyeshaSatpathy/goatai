"use client";

import { useEffect, useMemo, useState } from "react";
import { MarketCard } from "@/components/market-card";
import { CollegeSelector } from "@/components/college-selector";
import { Button } from "@/components/ui/button";
import { useCollege } from "@/components/college-context";
import { CreateMarketDialog } from "@/components/create-market-dialog";
import { useAuth } from "@/components/auth-provider";
import { TradeDialog } from "@/components/trade-dialog";

type Market = {
  id: string;
  title: string;
  description: string;
  resolutionAt: string;
  stakePoints?: number | null;
  collegeId?: string | null;
  outcomes: Array<{ id: string; label: string; position: number }>;
};

export function MarketsSection() {
  const { selectedCollege } = useCollege();
  const { session } = useAuth();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const collegeId = selectedCollege?.id;

  const loadMarkets = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const qs = collegeId ? `?collegeId=${encodeURIComponent(collegeId)}` : "";
      const res = await fetch(`/api/markets${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load markets");
      setMarkets(data);
    } catch (e) {
      console.error(e);
      setError("Could not load markets");
      setMarkets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMarkets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  const headerTitle = useMemo(() => {
    return selectedCollege ? `${selectedCollege.shortName} Markets` : "Markets";
  }, [selectedCollege]);

  return (
    <section id="markets" className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                {headerTitle}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto md:mx-0">
                {selectedCollege
                  ? `Explore predictions happening at ${selectedCollege.name}`
                  : "Select your college to see campus-specific predictions"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-center md:justify-end">
              <Button
                className="font-semibold"
                onClick={() => setIsCreateOpen(true)}
                disabled={!session?.user}
              >
                Create Market
              </Button>
              {!session?.user && (
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                  Sign in to create markets
                </p>
              )}
            </div>
          </div>

          {/* College Selector */}
          <div className="max-w-md mx-auto mt-8">
            <CollegeSelector />
          </div>
        </div>

        {/* Markets Grid */}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading markets…</div>
        ) : markets.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No markets yet. {session?.user ? "Be the first to create one!" : "Sign in to create one."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((m) => (
              <div key={m.id} className="space-y-2">
                <MarketCard
                  id={m.id}
                  title={m.title}
                  description={m.description}
                  outcomes={m.outcomes}
                  resolutionAt={m.resolutionAt}
                  stakePoints={m.stakePoints ?? null}
                />
                <Button
                  className="w-full font-semibold"
                  onClick={() => {
                    setSelectedMarket(m);
                    setIsTradeOpen(true);
                  }}
                  disabled={!session?.user}
                >
                  Trade
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Button
            variant="outline"
            size="lg"
            className="font-semibold bg-transparent"
            onClick={loadMarkets}
          >
            Refresh
          </Button>
        </div>
      </div>

      <CreateMarketDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        collegeId={collegeId}
        onCreated={loadMarkets}
      />

      <TradeDialog
        open={isTradeOpen}
        onOpenChange={setIsTradeOpen}
        market={selectedMarket}
        onTraded={loadMarkets}
      />
    </section>
  );
}
