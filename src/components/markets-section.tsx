"use client";

import { useEffect, useMemo, useState } from "react";
import { MarketCard } from "@/components/market-card";
import { CollegeSelector } from "@/components/college-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollege } from "@/components/college-context";
import Link from "next/link";
import { CreateMarketDialog } from "@/components/create-market-dialog";
import { useAuth } from "@/components/auth-provider";
import { TradeDialog, type MarketLite } from "@/components/trade-dialog"; // ✅ import the correct MarketLite
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryList, type CategoryId } from "@/lib/categories";

type Market = {
  id: string;
  title: string;
  description: string;
  resolutionAt: string;
  stakePoints?: number | null;
  collegeId?: string | null;
  category?: string | null;
  status: "OPEN" | "RESOLVED" | "CANCELED";
  outcomes: Array<{ id: string; label: string; position: number }>;
  totalPool?: number;
  odds?: Array<{ outcomeId: string; amount: number; probability: number }>;
  creatorId?: string;
};

type StatusFilter = "ALL" | "OPEN" | "RESOLVED";
type CategoryFilter = "ALL" | CategoryId;

export function MarketsSection() {
  const { selectedCollege } = useCollege();
  const { session } = useAuth();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const collegeId = selectedCollege?.id;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadMarkets = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const params = new URLSearchParams();
      if (collegeId) params.set("collegeId", collegeId);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const qs = params.toString() ? `?${params.toString()}` : "";
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
    if (!collegeId) {
      setMarkets([]);
      setIsLoading(false);
      return;
    }
    loadMarkets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId, statusFilter, categoryFilter, debouncedSearch]);

  const headerTitle = useMemo(() => selectedCollege ? `${selectedCollege.shortName} Markets` : "Markets", [selectedCollege]);

  // ✅ Convert selectedMarket to the correct MarketLite
  const marketLite: MarketLite | null = selectedMarket
    ? {
        id: selectedMarket.id,
        title: selectedMarket.title,
        description: selectedMarket.description,
        resolutionAt: selectedMarket.resolutionAt,
        creatorId: selectedMarket.creatorId ?? "unknown",
      }
    : null;

  return (
    <section id="markets" className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{headerTitle}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto md:mx-0">
                {selectedCollege ? `Explore predictions happening at ${selectedCollege.name}` : "Select your college to see campus-specific predictions"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-center md:justify-end">
              <Button className="font-semibold" onClick={() => setIsCreateOpen(true)} disabled={!session?.user}>
                Create Market
              </Button>
              {!session?.user && (
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                  Sign in to create markets
                </p>
              )}
            </div>
          </div>

          <div className="max-w-md mx-auto mt-8"><CollegeSelector /></div>

          {collegeId && (
            <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search markets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-10" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {(["ALL", "OPEN", "RESOLVED"] as const).map((status) => (
                  <button key={status} onClick={() => setStatusFilter(status)} className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors", statusFilter === status ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    {status === "ALL" ? "All" : status === "OPEN" ? "Open" : "Resolved"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {collegeId && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <button onClick={() => setCategoryFilter("ALL")} className={cn("px-3 py-1.5 text-sm font-medium rounded-full transition-colors", categoryFilter === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                All Categories
              </button>
              {categoryList.map((cat) => (
                <button key={cat.id} onClick={() => setCategoryFilter(cat.id as CategoryId)} className={cn("px-3 py-1.5 text-sm font-medium rounded-full transition-colors", categoryFilter === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        {!collegeId ? (
          <div className="text-center text-muted-foreground">Please select a campus to view markets.</div>
        ) : isLoading ? (
          <div className="text-center text-muted-foreground">Loading markets…</div>
        ) : markets.length === 0 ? (
          <div className="text-center text-muted-foreground">No markets yet. {session?.user ? "Be the first to create one!" : "Sign in to create one."}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((m) => (
              <div key={m.id} className="space-y-2">
                <MarketCard id={m.id} title={m.title} description={m.description} outcomes={m.outcomes} resolutionAt={m.resolutionAt} stakePoints={m.stakePoints ?? null} odds={m.odds} totalPool={m.totalPool} />
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/markets/${m.id}`}>
                    <Button variant="outline" className="w-full bg-transparent font-semibold">View</Button>
                  </Link>
                  <Button className="w-full font-semibold" onClick={() => { setSelectedMarket(m); setIsTradeOpen(true); }} disabled={!session?.user || !collegeId}>Trade</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="font-semibold bg-transparent" onClick={loadMarkets}>Refresh</Button>
        </div>
      </div>

      <CreateMarketDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} collegeId={collegeId} onCreated={loadMarkets} />

      <TradeDialog open={isTradeOpen} onOpenChange={setIsTradeOpen} market={marketLite} onTraded={loadMarkets} />
    </section>
  );
}
