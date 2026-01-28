import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Resolution rules (MVP):
// - Only creator can resolve
// - Winners get 2x their stake credited (stake was already deducted at trade time)
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const sessionResult = await auth.api.getSession({
      headers: Object.fromEntries(req.headers),
    });

    const user = sessionResult?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: marketId } = await ctx.params;
    const body = await req.json();
    const { outcomeId }: { outcomeId: string } = body;

    if (!outcomeId) return NextResponse.json({ error: "outcomeId is required" }, { status: 400 });

    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: {
        outcomes: true,
      },
    });

    if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });
    if (market.creatorId !== user.id) {
      return NextResponse.json({ error: "Only the creator can resolve this market" }, { status: 403 });
    }
    if (market.status !== "OPEN") {
      return NextResponse.json({ error: "Market is not open" }, { status: 400 });
    }
    if (!market.outcomes.some((o) => o.id === outcomeId)) {
      return NextResponse.json({ error: "Outcome does not belong to this market" }, { status: 400 });
    }

    const now = new Date();

    // Load positions once, then resolve in a transaction.
    const positions = await prisma.position.findMany({
      where: { marketId },
      select: { id: true, userId: true, outcomeId: true, amount: true },
    });

    const winnerByUser = new Map<string, number>();
    const winners = positions.filter((p) => p.outcomeId === outcomeId);
    const losers = positions.filter((p) => p.outcomeId !== outcomeId);

    for (const p of winners) {
      winnerByUser.set(p.userId, (winnerByUser.get(p.userId) ?? 0) + p.amount * 2);
    }

    await prisma.$transaction(async (tx) => {
      await tx.market.update({
        where: { id: marketId },
        data: {
          status: "RESOLVED",
          resolvedAt: now,
          resolvedOutcomeId: outcomeId,
        },
      });

      if (winners.length) {
        await tx.position.updateMany({
          where: { id: { in: winners.map((p) => p.id) } },
          data: { status: "WON" },
        });
      }
      if (losers.length) {
        await tx.position.updateMany({
          where: { id: { in: losers.map((p) => p.id) } },
          data: { status: "LOST" },
        });
      }

      for (const [userId, credit] of winnerByUser.entries()) {
        await tx.user.update({
          where: { id: userId },
          data: { karmaBalance: { increment: credit } },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/markets/:id/resolve] Error:", error);
    return NextResponse.json({ error: "Failed to resolve market" }, { status: 500 });
  }
}


