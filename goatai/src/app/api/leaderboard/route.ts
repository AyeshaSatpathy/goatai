import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collegeId = searchParams.get("collegeId") || undefined;
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

    // Get all users with their positions from resolved markets
    const users = await prisma.user.findMany({
      where: collegeId ? { campusId: collegeId } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        campusId: true,
        // Note: NOT selecting karmaBalance - it's private
        positions: {
          where: {
            market: { status: "RESOLVED" },
          },
          select: {
            amount: true,
            payout: true,
            status: true,
          },
        },
      },
    });

    // Calculate stats for each user
    const leaderboard = users
      .map((user) => {
        const resolvedPositions = user.positions;
        const totalTrades = resolvedPositions.length;

        if (totalTrades === 0) {
          return {
            id: user.id,
            name: user.name || user.email.split("@")[0],
            image: user.image,
            campusId: user.campusId,
            totalTrades: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            totalStaked: 0,
            totalPayout: 0,
            profit: 0,
          };
        }

        const wins = resolvedPositions.filter((p) => p.status === "WON").length;
        const losses = resolvedPositions.filter((p) => p.status === "LOST").length;
        const winRate = totalTrades > 0 ? wins / totalTrades : 0;

        const totalStaked = resolvedPositions.reduce((sum, p) => sum + p.amount, 0);
        const totalPayout = resolvedPositions.reduce((sum, p) => sum + (p.payout ?? 0), 0);
        const profit = totalPayout - totalStaked;

        return {
          id: user.id,
          name: user.name || user.email.split("@")[0],
          image: user.image,
          campusId: user.campusId,
          totalTrades,
          wins,
          losses,
          winRate,
          totalStaked,
          totalPayout,
          profit,
        };
      })
      // Only include users who have made at least one trade
      .filter((u) => u.totalTrades > 0)
      // Sort by profit descending
      .sort((a, b) => b.profit - a.profit)
      // Take top N
      .slice(0, limit)
      // Add rank
      .map((u, idx) => ({ ...u, rank: idx + 1 }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("[GET /api/leaderboard] Error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
