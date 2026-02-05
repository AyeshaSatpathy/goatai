import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get detailed stats for the current user
export async function GET(req: NextRequest) {
  try {
    const sessionResult = await auth.api.getSession({
      headers: Object.fromEntries(req.headers),
    });

    const user = sessionResult?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user with all their positions
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        karmaBalance: true,
        createdAt: true,
        positions: {
          include: {
            market: {
              select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
              },
            },
            outcome: {
              select: {
                id: true,
                label: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        markets: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Calculate stats
    const resolvedPositions = me.positions.filter((p) => p.market.status === "RESOLVED");
    const openPositions = me.positions.filter((p) => p.market.status === "OPEN");

    const totalTrades = resolvedPositions.length;
    const wins = resolvedPositions.filter((p) => p.status === "WON").length;
    const losses = resolvedPositions.filter((p) => p.status === "LOST").length;
    const winRate = totalTrades > 0 ? wins / totalTrades : 0;

    const totalStaked = resolvedPositions.reduce((sum, p) => sum + p.amount, 0);
    const totalPayout = resolvedPositions.reduce((sum, p) => sum + (p.payout ?? 0), 0);
    const profit = totalPayout - totalStaked;
    const roi = totalStaked > 0 ? profit / totalStaked : 0;

    const totalAtRisk = openPositions.reduce((sum, p) => sum + p.amount, 0);

    // Calculate streaks
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    // Sort by resolved time to calculate streaks properly
    const sortedResolved = resolvedPositions
      .filter((p) => p.status === "WON" || p.status === "LOST")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (const p of sortedResolved) {
      if (p.status === "WON") {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Current streak (from most recent)
    const reversed = [...sortedResolved].reverse();
    for (const p of reversed) {
      if (p.status === "WON") {
        currentStreak++;
      } else {
        break;
      }
    }

    // Best and worst trades
    const bestTrade = resolvedPositions.reduce(
      (best, p) => {
        const pnl = (p.payout ?? 0) - p.amount;
        return pnl > best.pnl ? { pnl, position: p } : best;
      },
      { pnl: -Infinity, position: null as typeof resolvedPositions[0] | null }
    );

    const worstTrade = resolvedPositions.reduce(
      (worst, p) => {
        const pnl = (p.payout ?? 0) - p.amount;
        return pnl < worst.pnl ? { pnl, position: p } : worst;
      },
      { pnl: Infinity, position: null as typeof resolvedPositions[0] | null }
    );

    // Monthly performance (last 6 months)
    const monthlyPerformance: Array<{
      month: string;
      trades: number;
      wins: number;
      profit: number;
    }> = [];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      const monthPositions = resolvedPositions.filter((p) => {
        const t = new Date(p.createdAt);
        return t >= monthStart && t <= monthEnd;
      });

      const monthWins = monthPositions.filter((p) => p.status === "WON").length;
      const monthProfit = monthPositions.reduce(
        (sum, p) => sum + ((p.payout ?? 0) - p.amount),
        0
      );

      monthlyPerformance.push({
        month: monthLabel,
        trades: monthPositions.length,
        wins: monthWins,
        profit: monthProfit,
      });
    }

    return NextResponse.json({
      karmaBalance: me.karmaBalance,
      memberSince: me.createdAt,
      summary: {
        totalTrades,
        wins,
        losses,
        winRate,
        totalStaked,
        totalPayout,
        profit,
        roi,
        openPositions: openPositions.length,
        totalAtRisk,
        marketsCreated: me.markets.length,
        currentStreak,
        maxStreak,
      },
      bestTrade: bestTrade.position
        ? {
            market: bestTrade.position.market,
            outcome: bestTrade.position.outcome,
            amount: bestTrade.position.amount,
            payout: bestTrade.position.payout,
            profit: bestTrade.pnl,
          }
        : null,
      worstTrade: worstTrade.position
        ? {
            market: worstTrade.position.market,
            outcome: worstTrade.position.outcome,
            amount: worstTrade.position.amount,
            payout: worstTrade.position.payout,
            profit: worstTrade.pnl,
          }
        : null,
      monthlyPerformance,
      recentTrades: me.positions.slice(0, 10).map((p) => ({
        id: p.id,
        market: p.market,
        outcome: p.outcome,
        amount: p.amount,
        payout: p.payout,
        status: p.status,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("[GET /api/me/stats] Error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
