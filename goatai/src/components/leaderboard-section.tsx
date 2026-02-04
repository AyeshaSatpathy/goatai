"use client";

import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Medal, Loader2 } from "lucide-react";
import { useCollege } from "@/components/college-context";
import Image from "next/image";
import Link from "next/link";

type LeaderboardUser = {
  rank: number;
  id: string;
  name: string;
  image: string | null;
  campusId: string | null;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalStaked: number;
  totalPayout: number;
  profit: number;
};

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground">{rank}</span>;
}

function formatProfit(profit: number) {
  if (profit >= 0) return `+${profit}`;
  return `${profit}`;
}

export function LeaderboardSection() {
  const { selectedCollege } = useCollege();
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const qs = selectedCollege ? `?collegeId=${selectedCollege.id}&limit=10` : "?limit=10";
        const res = await fetch(`/api/leaderboard${qs}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load leaderboard");
        }

        setLeaders(data);
      } catch (e) {
        console.error(e);
        setError("Could not load leaderboard");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [selectedCollege]);

  return (
    <section id="leaderboard" className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Compete Against the Best
            </h2>
            <p className="text-muted-foreground mb-6">
              See how you stack up against other students. Climb the leaderboard, 
              earn bragging rights, and prove you know your campus better than anyone.
            </p>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Weekly Prizes</div>
                  <div className="text-sm text-muted-foreground">Top 10 win rewards</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Track Progress</div>
                  <div className="text-sm text-muted-foreground">See your stats grow</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Leaderboard Card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Top Predictors
                {selectedCollege && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    @ {selectedCollege.shortName}
                  </span>
                )}
              </h3>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="p-6 text-center text-muted-foreground">{error}</div>
            ) : leaders.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No trades resolved yet. Be the first to make predictions!
              </div>
            ) : (
              <div className="divide-y divide-border">
                {leaders.map((trader) => (
                  <Link
                    key={trader.id}
                    href={`/profile/${trader.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Rank */}
                    <div className="w-8 flex justify-center">
                      {getRankIcon(trader.rank)}
                    </div>

                    {/* Avatar */}
                    {trader.image ? (
                      <Image
                        src={trader.image}
                        alt={trader.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {trader.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{trader.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {trader.totalTrades} trades · {trader.wins}W/{trader.losses}L
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div
                        className={
                          trader.profit >= 0
                            ? "font-semibold text-green-600 dark:text-green-400"
                            : "font-semibold text-red-600 dark:text-red-400"
                        }
                      >
                        {formatProfit(trader.profit)} karma
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(trader.winRate * 100)}% win rate
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
