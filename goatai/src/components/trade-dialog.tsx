"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";

type MarketLite = {
  id: string;
  title: string;
  description: string;
  stakePoints?: number | null;
  resolutionAt: string;
  status: "OPEN" | "RESOLVED" | "CANCELED";
  outcomes: Array<{ id: string; label: string }>;
  creatorId: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: MarketLite | null;
  onTraded?: () => void;
};

export function TradeDialog({ open, onOpenChange, market, onTraded }: Props) {
  const { session } = useAuth();
  const isAuthed = Boolean(session?.user);

  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [odds, setOdds] = useState<
    | null
    | {
        totalPool: number;
        totals: Array<{ outcomeId: string; amount: number; count: number }>;
      }
  >(null);

  const canTrade = useMemo(() => {
    if (!isAuthed) return false;
    if (!market) return false;
    if (market.status !== "OPEN") return false;
    const n = Number(amount);
    if (!selectedOutcomeId) return false;
    if (!Number.isFinite(n) || n <= 0) return false;
    return true;
  }, [isAuthed, market, selectedOutcomeId, amount]);

  useEffect(() => {
    const run = async () => {
      if (!open || !market) return;
      try {
        const res = await fetch(`/api/markets/${market.id}/stats`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return;
        setOdds({ totalPool: json.totalPool ?? 0, totals: json.totals ?? [] });
      } catch {}
    };
    run();
  }, [open, market?.id]);

  const selectedTotals = useMemo(() => {
    if (!odds || !selectedOutcomeId) return null;
    const outcomePool = odds.totals.find((t) => t.outcomeId === selectedOutcomeId)?.amount ?? 0;
    const pool = odds.totalPool ?? 0;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return { pool, outcomePool, implied: pool > 0 ? outcomePool / pool : 0, estPayout: null };
    // If your outcome wins, estimated payout under pari-mutuel after your trade:
    // payout ≈ (stake / (winnerPool + stake)) * (totalPool + stake)
    const estPayout = Math.floor((n / (outcomePool + n)) * (pool + n));
    const implied = pool > 0 ? outcomePool / pool : 0;
    return { pool, outcomePool, implied, estPayout };
  }, [odds, selectedOutcomeId, amount]);

  const reset = () => {
    setSelectedOutcomeId("");
    setAmount("");
    setIsSubmitting(false);
    setError(null);
    setSuccess(null);
    setOdds(null);
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const submit = async () => {
    if (!market) return;
    try {
      setError(null);
      setSuccess(null);
      setIsSubmitting(true);

      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: market.id,
          outcomeId: selectedOutcomeId,
          amount: Number(amount),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Failed to place trade");
        setIsSubmitting(false);
        return;
      }

      setSuccess("Trade placed!");
      setIsSubmitting(false);
      onTraded?.();
    } catch (e) {
      console.error(e);
      setError("Failed to place trade");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border">
        <DialogTitle className="sr-only">Place a trade</DialogTitle>

        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">Place a trade</h2>
            <p className="text-sm text-muted-foreground">
              {market ? market.title : "Select a market"}
            </p>
          </div>

          {!isAuthed && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Please sign in with Google to trade.
            </div>
          )}

          {market && market.status !== "OPEN" && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              This market is not open.
            </div>
          )}

          {market && (
            <>
              <div className="space-y-2">
                <Label>Choose an outcome</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {market.outcomes.map((o) => {
                    const selected = selectedOutcomeId === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setSelectedOutcomeId(o.id)}
                        disabled={!isAuthed || isSubmitting}
                        className={[
                          "rounded-lg border px-3 py-2 text-sm text-left transition-colors",
                          selected
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border hover:bg-muted/50 text-foreground",
                        ].join(" ")}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-amount">Amount (karma)</Label>
                <Input
                  id="trade-amount"
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 50"
                  disabled={!isAuthed || isSubmitting}
                />
              </div>

              {selectedTotals && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Implied odds</span>
                    <span className="font-medium text-foreground">
                      {Math.round(selectedTotals.implied * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-muted-foreground">Pool (before)</span>
                    <span className="font-medium text-foreground">{selectedTotals.pool}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-muted-foreground">Outcome pool (before)</span>
                    <span className="font-medium text-foreground">{selectedTotals.outcomePool}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <span className="text-muted-foreground">Estimated payout if you win</span>
                    <span className="font-semibold text-foreground">
                      {selectedTotals.estPayout === null ? "—" : `${selectedTotals.estPayout} karma`}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
              {success}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="bg-transparent" onClick={() => handleClose(false)}>
              Close
            </Button>
            <Button type="button" onClick={submit} disabled={!canTrade || isSubmitting} className="font-semibold">
              {isSubmitting ? "Placing..." : "Place trade"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


