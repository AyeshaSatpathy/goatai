import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";
import { auditLog, getClientInfo } from "@/lib/audit-log";

// Cancel a market and refund all positions
// Only the creator can cancel, and only if the market is still OPEN
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const sessionResult = await auth.api.getSession({
      headers: Object.fromEntries(req.headers),
    });

    const user = sessionResult?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limiting
    const rateLimit = checkRateLimit(user.id, rateLimits.resolveMarket);
    if (!rateLimit.success) {
      const clientInfo = getClientInfo(req.headers);
      auditLog({
        action: "RATE_LIMIT_HIT",
        userId: user.id,
        metadata: { endpoint: "cancel-market", resetIn: rateLimit.resetIn },
        ...clientInfo,
      });
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rateLimit.resetIn} seconds.` },
        { status: 429 }
      );
    }

    const { id: marketId } = await ctx.params;

    const market = await prisma.market.findUnique({
      where: { id: marketId },
    });

    if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });

    if (market.creatorId !== user.id) {
      return NextResponse.json({ error: "Only the creator can cancel this market" }, { status: 403 });
    }

    if (market.status !== "OPEN") {
      return NextResponse.json({ error: "Market is not open" }, { status: 400 });
    }

    // Load all positions to refund
    const positions = await prisma.position.findMany({
      where: { marketId },
      select: { id: true, userId: true, amount: true },
    });

    const totalPool = positions.reduce((sum, p) => sum + p.amount, 0);

    await prisma.$transaction(async (tx) => {
      // Update market status to CANCELED
      await tx.market.update({
        where: { id: marketId },
        data: {
          status: "CANCELED",
          totalPool,
        },
      });

      // Refund all positions
      for (const p of positions) {
        await tx.position.update({
          where: { id: p.id },
          data: { status: "REFUNDED", payout: p.amount },
        });

        await tx.user.update({
          where: { id: p.userId },
          data: { karmaBalance: { increment: p.amount } },
        });
      }
    });

    // Audit log
    const clientInfo = getClientInfo(req.headers);
    auditLog({
      action: "MARKET_CANCELED",
      userId: user.id,
      metadata: {
        marketId,
        refundedPositions: positions.length,
        totalRefunded: totalPool,
      },
      ...clientInfo,
    });

    return NextResponse.json({ 
      ok: true, 
      refunded: positions.length,
      totalRefunded: totalPool,
    });
  } catch (error) {
    console.error("[POST /api/markets/:id/cancel] Error:", error);
    return NextResponse.json({ error: "Failed to cancel market" }, { status: 500 });
  }
}
