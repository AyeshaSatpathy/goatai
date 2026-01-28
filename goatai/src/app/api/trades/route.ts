import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const sessionResult = await auth.api.getSession({
      headers: Object.fromEntries(req.headers),
    });

    const user = sessionResult?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { marketId, outcomeId, amount }: { marketId: string; outcomeId: string; amount: number } = body;

    if (!marketId || !outcomeId || !amount || amount <= 0) {
      return NextResponse.json({ error: "marketId, outcomeId, and positive amount are required" }, { status: 400 });
    }

    const [market, me] = await Promise.all([
      prisma.market.findUnique({
        where: { id: marketId },
        include: { outcomes: true },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, karmaBalance: true },
      }),
    ]);

    if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (market.status !== "OPEN") {
      return NextResponse.json({ error: "Market is not open" }, { status: 400 });
    }
    if (new Date() >= new Date(market.resolutionAt)) {
      return NextResponse.json({ error: "Market has reached its resolution time" }, { status: 400 });
    }

    const outcome = market.outcomes.find((o) => o.id === outcomeId);
    if (!outcome) return NextResponse.json({ error: "Outcome does not belong to this market" }, { status: 400 });

    if (me.karmaBalance < amount) {
      return NextResponse.json({ error: "Insufficient karma balance" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { karmaBalance: { decrement: amount } },
        select: { karmaBalance: true },
      });

      const position = await tx.position.create({
        data: {
          userId: user.id,
          marketId,
          outcomeId,
          amount,
        },
        include: {
          market: { select: { id: true, title: true, status: true } },
          outcome: { select: { id: true, label: true } },
        },
      });

      return { position, karmaBalance: updatedUser.karmaBalance };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/trades] Error:", error);
    return NextResponse.json({ error: "Failed to place trade" }, { status: 500 });
  }
}


