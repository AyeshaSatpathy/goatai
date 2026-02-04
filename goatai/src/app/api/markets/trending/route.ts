import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get trending markets based on recent activity
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collegeId = searchParams.get("collegeId") || undefined;
    const limit = Math.min(Number(searchParams.get("limit")) || 5, 20);

    // Get markets with their position counts from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get recent positions grouped by market
    const recentActivity = await prisma.position.groupBy({
      by: ["marketId"],
      where: {
        createdAt: { gte: oneDayAgo },
        market: collegeId ? { collegeId } : undefined,
      },
      _count: { id: true },
      _sum: { amount: true },
      orderBy: {
        _count: { id: "desc" },
      },
      take: limit * 2, // Get more to filter later
    });

    if (recentActivity.length === 0) {
      // Fallback to markets with most total activity
      const markets = await prisma.market.findMany({
        where: {
          status: "OPEN",
          ...(collegeId && { collegeId }),
        },
        include: {
          outcomes: { orderBy: { position: "asc" } },
          _count: { select: { positions: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      // Get pool totals
      const marketIds = markets.map((m) => m.id);
      const pools = await prisma.position.groupBy({
        by: ["marketId"],
        where: { marketId: { in: marketIds } },
        _sum: { amount: true },
      });

      const poolMap = new Map(pools.map((p) => [p.marketId, p._sum.amount ?? 0]));

      return NextResponse.json(
        markets.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          resolutionAt: m.resolutionAt,
          status: m.status,
          outcomes: m.outcomes,
          totalPool: poolMap.get(m.id) ?? 0,
          tradeCount: m._count.positions,
          recentTrades: 0,
          recentVolume: 0,
          trendScore: m._count.positions,
        }))
      );
    }

    // Get full market data for trending markets
    const trendingMarketIds = recentActivity.map((r) => r.marketId);

    const markets = await prisma.market.findMany({
      where: {
        id: { in: trendingMarketIds },
        status: "OPEN",
      },
      include: {
        outcomes: { orderBy: { position: "asc" } },
        _count: { select: { positions: true } },
      },
    });

    // Get total pools
    const pools = await prisma.position.groupBy({
      by: ["marketId"],
      where: { marketId: { in: trendingMarketIds } },
      _sum: { amount: true },
    });

    const poolMap = new Map(pools.map((p) => [p.marketId, p._sum.amount ?? 0]));
    const activityMap = new Map(
      recentActivity.map((r) => [
        r.marketId,
        { count: r._count.id, volume: r._sum.amount ?? 0 },
      ])
    );

    // Sort by trend score (recent activity weighted higher)
    const trending = markets
      .map((m) => {
        const activity = activityMap.get(m.id) ?? { count: 0, volume: 0 };
        // Trend score = recent trades * 2 + recent volume / 100
        const trendScore = activity.count * 2 + activity.volume / 100;

        return {
          id: m.id,
          title: m.title,
          description: m.description,
          resolutionAt: m.resolutionAt,
          status: m.status,
          outcomes: m.outcomes,
          totalPool: poolMap.get(m.id) ?? 0,
          tradeCount: m._count.positions,
          recentTrades: activity.count,
          recentVolume: activity.volume,
          trendScore,
        };
      })
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);

    return NextResponse.json(trending);
  } catch (error) {
    console.error("[GET /api/markets/trending] Error:", error);
    return NextResponse.json({ error: "Failed to load trending markets" }, { status: 500 });
  }
}
