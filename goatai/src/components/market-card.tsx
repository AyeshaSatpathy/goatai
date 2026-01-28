"use client";

import { CalendarClock, Coins } from "lucide-react";

interface MarketCardProps {
  id?: string;
  title: string;
  description: string;
  outcomes: Array<{ id?: string; label: string }>;
  resolutionAt: string | Date;
  stakePoints?: number | null;
  onClick?: () => void;
}

export function MarketCard({
  id,
  title,
  description,
  outcomes,
  resolutionAt,
  stakePoints,
  onClick,
}: MarketCardProps) {
  const resolution =
    typeof resolutionAt === "string" ? new Date(resolutionAt) : resolutionAt;
  const resolutionLabel = Number.isNaN(resolution.getTime())
    ? "—"
    : resolution.toLocaleString();

  return (
    <div
      onClick={onClick}
      className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
    >
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

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CalendarClock className="h-3.5 w-3.5" />
          <span>Resolves {resolutionLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <Coins className="h-3.5 w-3.5" />
          <span>{stakePoints ? `${stakePoints} pts` : "No stake"}</span>
        </div>
      </div>
    </div>
  );
}
