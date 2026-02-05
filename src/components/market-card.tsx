"use client";

import { BarChart3, Coins } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";

interface MarketCardProps {
  id?: string;
  title: string;
  description: string;
  outcomes: Array<{ id?: string; label: string }>;
  resolutionAt: string | Date;
  stakePoints?: number | null;
  totalPool?: number;
  odds?: Array<{ outcomeId: string; amount: number; probability: number }>;
  onClick?: () => void;
}

export function MarketCard({
  id,
  title,
  description,
  outcomes,
  resolutionAt,
  stakePoints,
  totalPool,
  odds,
  onClick,
}: MarketCardProps) {
  const resolution =
    typeof resolutionAt === "string" ? new Date(resolutionAt) : resolutionAt;
  const isDetermined =
    !Number.isNaN(resolution.getTime()) && Date.now() >= resolution.getTime();

  return (
    <div
      onClick={onClick}
      className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer h-full flex flex-col"
    >
      {isDetermined && (
        <div className="mb-3">
          <span className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border border-green-600/30 bg-green-500/10 text-green-700 dark:text-green-300">
            DETERMINED
          </span>
        </div>
      )}
      <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </h3>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {outcomes.slice(0, 4).map((o, idx) => (
          <span
            key={o.id ?? `${id ?? "market"}-outcome-${idx}`}
            className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-foreground"
          >
            {o.label}
          </span>
        ))}
        {outcomes.length > 4 && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            +{outcomes.length - 4} more
          </span>
        )}
      </div>

      {odds && odds.length > 0 && (
        <div className="mb-4 rounded-lg border border-border bg-background px-3 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Current odds</span>
            </div>
            <span>{typeof totalPool === "number" ? `${totalPool} karma pooled` : ""}</span>
          </div>
          <div className="space-y-2">
            {odds
              .slice()
              .sort((a, b) => b.probability - a.probability)
              .slice(0, 2)
              .map((o) => {
                const label = outcomes.find((x) => x.id === o.outcomeId)?.label ?? "—";
                const pct = Math.round(o.probability * 100);
                return (
                  <div key={o.outcomeId} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{label}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
        {isDetermined ? (
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            Awaiting resolution
          </span>
        ) : (
          <CountdownTimer targetDate={resolution} compact />
        )}
        <div className="flex items-center gap-1">
          <Coins className="h-3.5 w-3.5" />
          <span>{stakePoints ? `${stakePoints} pts` : "No stake"}</span>
        </div>
      </div>
    </div>
  );
}
