import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Resolution rules (MVP):
// - Only creator can resolve
// - Pari-mutuel payout: winners split the total pool proportional to their stake.
//   Stake was already deducted at trade time, so we credit the payout on resolve.
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

    const winners = positions.filter((p) => p.outcomeId === outcomeId);
    const losers = positions.filter((p) => p.outcomeId !== outcomeId);

    const totalPool = positions.reduce((sum, p) => sum + p.amount, 0);
    const winnerPool = winners.reduce((sum, p) => sum + p.amount, 0);

    await prisma.$transaction(async (tx) => {
      await tx.market.update({
        where: { id: marketId },
        data: {
          status: "RESOLVED",
          resolvedAt: now,
          resolvedOutcomeId: outcomeId,
        },
      });

      // If no one bet on the winning outcome, refund everyone.
      if (totalPool > 0 && winnerPool === 0) {
        // Refund all open positions
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
        return;
      }

      // Mark losers (no payout)
      if (losers.length) {
        await tx.position.updateMany({
          where: { id: { in: losers.map((p) => p.id) } },
          data: { status: "LOST", payout: 0 },
        });
      }

      // Pay winners proportional to stake. We round down each payout, and any remainder stays unallocated (MVP).
      const payoutByUser = new Map<string, number>();
      for (const p of winners) {
        const payout = winnerPool === 0 ? 0 : Math.floor((p.amount / winnerPool) * totalPool);
        await tx.position.update({
          where: { id: p.id },
          data: { status: "WON", payout },
        });
        payoutByUser.set(p.userId, (payoutByUser.get(p.userId) ?? 0) + payout);
      }

      for (const [userId, credit] of payoutByUser.entries()) {
        if (credit <= 0) continue;
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



