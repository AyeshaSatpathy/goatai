import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: marketId } = await ctx.params;

    const market = await prisma.market.findUnique({
      where: { id: marketId },
      select: { id: true, status: true, creatorId: true },
    });
    if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });

    const totals = await prisma.position.groupBy({
      by: ["outcomeId"],
      where: { marketId },
      _sum: { amount: true },
      _count: { _all: true },
    });

    let myPositions: Array<{
      id: string;
      amount: number;
      status: string;
      outcomeId: string;
      createdAt: Date;
    }> = [];

    const sessionResult = await auth.api.getSession({
      headers: Object.fromEntries(req.headers),
    });
    const user = sessionResult?.user;
    if (user) {
      myPositions = await prisma.position.findMany({
        where: { marketId, userId: user.id },
        select: { id: true, amount: true, status: true, outcomeId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      totals: totals.map((t) => ({
        outcomeId: t.outcomeId,
        amount: t._sum.amount ?? 0,
        count: t._count._all,
      })),
      myPositions,
      canResolve: Boolean(user && market.creatorId === user.id && market.status === "OPEN"),
    });
  } catch (error) {
    console.error("[GET /api/markets/:id/stats] Error:", error);
    return NextResponse.json({ error: "Failed to load market stats" }, { status: 500 });
  }
}


