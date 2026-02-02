"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { getCollegeById } from "@/lib/colleges";
import { cn } from "@/lib/utils";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  Coins,
  Calendar,
  ArrowLeft,
  Loader2,
  User,
} from "lucide-react";

type Position = {
  id: string;
  amount: number;
  payout: number | null;
  status: string;
  createdAt: string;
  market: {
    id: string;
    title: string;
    status: string;
    resolutionAt: string;
    resolvedAt: string | null;
    resolvedOutcomeId: string | null;
  };
  outcome: {
    id: string;
    label: string;
  };
};

type MarketCreated = {
  id: string;
  title: string;
  status: string;
  resolutionAt: string;
  createdAt: string;
  tradeCount: number;
};

type ProfileData = {
  id: string;
  name: string;
  email?: string;
  image: string | null;
  campusId: string | null;
  karmaBalance?: number;
  createdAt: string;
  isOwnProfile: boolean;
  stats: {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalStaked: number;
    totalPayout: number;
    profit: number;
    openPositions: number;
    totalAtRisk: number;
    marketsCreated: number;
  };
  positions: Position[];
  marketsCreated: MarketCreated[];
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            color || "bg-primary/10"
          )}
        >
          <Icon className={cn("h-5 w-5", color ? "text-white" : "text-primary")} />
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

export function UserProfile({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"positions" | "created">("positions");

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load profile");
        }

        setProfile(data);
      } catch (e) {
        console.error(e);
        setError("Could not load profile");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [userId]);

  const college = profile?.campusId ? getCollegeById(profile.campusId) : null;

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive mb-4">
              {error || "User not found"}
            </div>
            <Link href="/">
              <Button variant="outline" className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to home
              </Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to home
          </Link>

          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {profile.image ? (
              <Image
                src={profile.image}
                alt={profile.name}
                width={96}
                height={96}
                className="rounded-full"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-12 w-12 text-primary" />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{profile.name}</h1>
              {college && (
                <p className="text-lg text-muted-foreground">{college.name}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {joinDate}
                </span>
                {profile.isOwnProfile && profile.karmaBalance !== undefined && (
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <Coins className="h-4 w-4" />
                    {profile.karmaBalance} karma
                  </span>
                )}
              </div>
            </div>

            {profile.isOwnProfile && (
              <Link href="/wallet">
                <Button variant="outline" className="bg-transparent">
                  View Wallet
                </Button>
              </Link>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Trades"
              value={profile.stats.totalTrades}
              icon={Target}
            />
            <StatCard
              label="Win Rate"
              value={`${Math.round(profile.stats.winRate * 100)}%`}
              icon={Trophy}
            />
            <StatCard
              label="Profit"
              value={`${profile.stats.profit >= 0 ? "+" : ""}${profile.stats.profit}`}
              icon={profile.stats.profit >= 0 ? TrendingUp : TrendingDown}
              color={profile.stats.profit >= 0 ? "bg-green-500" : "bg-red-500"}
            />
            <StatCard
              label="Markets Created"
              value={profile.stats.marketsCreated}
              icon={Target}
            />
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 rounded-xl border border-border bg-card p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {profile.stats.wins}
              </div>
              <div className="text-sm text-muted-foreground">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {profile.stats.losses}
              </div>
              <div className="text-sm text-muted-foreground">Losses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {profile.stats.totalStaked}
              </div>
              <div className="text-sm text-muted-foreground">Total Staked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {profile.stats.openPositions}
              </div>
              <div className="text-sm text-muted-foreground">Open Positions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {profile.stats.totalAtRisk}
              </div>
              <div className="text-sm text-muted-foreground">At Risk</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab("positions")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === "positions"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Trading History ({profile.positions.length})
            </button>
            <button
              onClick={() => setActiveTab("created")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === "created"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Markets Created ({profile.marketsCreated.length})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "positions" && (
            <div className="space-y-3">
              {profile.positions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No trades yet
                </div>
              ) : (
                profile.positions.map((p) => {
                  const statusColor =
                    p.status === "WON"
                      ? "text-green-600 dark:text-green-400 bg-green-500/10"
                      : p.status === "LOST"
                      ? "text-red-600 dark:text-red-400 bg-red-500/10"
                      : p.status === "REFUNDED"
                      ? "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10"
                      : "text-muted-foreground bg-muted";

                  return (
                    <Link
                      key={p.id}
                      href={`/markets/${p.market.id}`}
                      className="block rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">
                            {p.market.title}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Bet on: <span className="text-foreground">{p.outcome.label}</span>
                            {" · "}
                            Stake: <span className="text-foreground">{p.amount} karma</span>
                            {p.payout !== null && (
                              <>
                                {" · "}
                                Payout: <span className="text-foreground">{p.payout} karma</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-semibold px-2 py-1 rounded-full",
                            statusColor
                          )}
                        >
                          {p.status}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "created" && (
            <div className="space-y-3">
              {profile.marketsCreated.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No markets created yet
                </div>
              ) : (
                profile.marketsCreated.map((m) => {
                  const statusColor =
                    m.status === "RESOLVED"
                      ? "text-green-600 dark:text-green-400 bg-green-500/10"
                      : m.status === "CANCELED"
                      ? "text-red-600 dark:text-red-400 bg-red-500/10"
                      : "text-blue-600 dark:text-blue-400 bg-blue-500/10";

                  return (
                    <Link
                      key={m.id}
                      href={`/markets/${m.id}`}
                      className="block rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">
                            {m.title}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {m.tradeCount} trades
                            {" · "}
                            Resolves:{" "}
                            {new Date(m.resolutionAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-semibold px-2 py-1 rounded-full",
                            statusColor
                          )}
                        >
                          {m.status}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
