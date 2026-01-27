"use client";

import { TrendingUp, TrendingDown, Users, Clock } from "lucide-react";

interface MarketCardProps {
  title: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  endDate: string;
  trending?: "up" | "down" | "neutral";
  onClick?: () => void;
}

export function MarketCard({
  title,
  category,
  yesPrice,
  noPrice,
  volume,
  endDate,
  trending = "neutral",
  onClick,
}: MarketCardProps) {
  return (
    <div
      onClick={onClick}
      className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          {category}
        </span>
        {trending !== "neutral" && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trending === "up" ? "text-green-600 dark:text-green-400" : "text-red-500"
            }`}
          >
            {trending === "up" ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>Trending</span>
          </div>
        )}
      </div>

      <h3 className="font-semibold text-foreground mb-4 line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </h3>

      <div className="flex gap-2 mb-4">
        <button className="flex-1 py-2.5 px-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors">
          <span className="block text-xs text-muted-foreground mb-0.5">Yes</span>
          <span className="block text-lg font-bold text-green-600 dark:text-green-400">
            {yesPrice}¢
          </span>
        </button>
        <button className="flex-1 py-2.5 px-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
          <span className="block text-xs text-muted-foreground mb-0.5">No</span>
          <span className="block text-lg font-bold text-red-500">
            {noPrice}¢
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span>{volume} volume</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{endDate}</span>
        </div>
      </div>
    </div>
  );
}
