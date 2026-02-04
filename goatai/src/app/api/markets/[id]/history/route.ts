import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get price/odds history for a market over time
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: marketId } = await ctx.params;

    const market = await prisma.market.findUnique({
      where: { id: marketId },
      select: {
        id: true,
        createdAt: true,
        outcomes: {
          select: { id: true, label: true },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    // Get all positions ordered by time
    const positions = await prisma.position.findMany({
      where: { marketId },
      select: {
        outcomeId: true,
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (positions.length === 0) {
      // No trades yet, return initial state
      const initialOdds = market.outcomes.map((o) => ({
        outcomeId: o.id,
        label: o.label,
        probability: 1 / market.outcomes.length, // Equal odds initially
      }));

      return NextResponse.json({
        outcomes: market.outcomes,
        history: [
          {
            timestamp: market.createdAt,
            totalPool: 0,
            odds: initialOdds,
          },
        ],
      });
    }

    // Build cumulative history snapshots
    // We'll create a snapshot after each trade
    const outcomeIds = market.outcomes.map((o) => o.id);
    const cumulative = new Map<string, number>();
    for (const oid of outcomeIds) cumulative.set(oid, 0);

    const history: Array<{
      timestamp: Date;
      totalPool: number;
      odds: Array<{ outcomeId: string; label: string; probability: number }>;
    }> = [];

    // Add initial state
    history.push({
      timestamp: market.createdAt,
      totalPool: 0,
      odds: market.outcomes.map((o) => ({
        outcomeId: o.id,
        label: o.label,
        probability: 1 / market.outcomes.length,
      })),
    });

    // Process each position and create snapshots
    // To avoid too many data points, we'll aggregate by hour for long-running markets
    let lastSnapshotTime = market.createdAt.getTime();
    const ONE_HOUR = 60 * 60 * 1000;
    const marketDuration = Date.now() - market.createdAt.getTime();
    const aggregateByHour = marketDuration > 24 * ONE_HOUR;

    for (const pos of positions) {
      cumulative.set(pos.outcomeId, (cumulative.get(pos.outcomeId) ?? 0) + pos.amount);

      const totalPool = Array.from(cumulative.values()).reduce((a, b) => a + b, 0);
      const posTime = pos.createdAt.getTime();

      // Aggregate if needed
      if (aggregateByHour && posTime - lastSnapshotTime < ONE_HOUR) {
        // Update the last snapshot instead of creating new one
        if (history.length > 0) {
          const last = history[history.length - 1];
          last.totalPool = totalPool;
          last.odds = market.outcomes.map((o) => ({
            outcomeId: o.id,
            label: o.label,
            probability: totalPool > 0 ? (cumulative.get(o.id) ?? 0) / totalPool : 1 / market.outcomes.length,
          }));
        }
        continue;
      }

      lastSnapshotTime = posTime;

      history.push({
        timestamp: pos.createdAt,
        totalPool,
        odds: market.outcomes.map((o) => ({
          outcomeId: o.id,
          label: o.label,
          probability: totalPool > 0 ? (cumulative.get(o.id) ?? 0) / totalPool : 1 / market.outcomes.length,
        })),
      });
    }

    // Limit to max 100 data points for performance
    const maxPoints = 100;
    let finalHistory = history;
    if (history.length > maxPoints) {
      const step = Math.ceil(history.length / maxPoints);
      finalHistory = history.filter((_, i) => i % step === 0 || i === history.length - 1);
    }

    return NextResponse.json({
      outcomes: market.outcomes,
      history: finalHistory,
    });
  } catch (error) {
    console.error("[GET /api/markets/:id/history] Error:", error);
    return NextResponse.json({ error: "Failed to load price history" }, { status: 500 });
  }
}
