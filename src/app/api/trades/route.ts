import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";
import { auditLog, getClientInfo } from "@/lib/audit-log";

export async function POST(req: NextRequest) {
  try {
    const sessionResult = await auth.api.getSession({
      headers: Object.fromEntries(req.headers),
    });

    const user = sessionResult?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limiting
    const rateLimit = checkRateLimit(user.id, rateLimits.trade);
    if (!rateLimit.success) {
      const clientInfo = getClientInfo(req.headers);
      auditLog({
        action: "RATE_LIMIT_HIT",
        userId: user.id,
        metadata: { endpoint: "trade", resetIn: rateLimit.resetIn },
        ...clientInfo,
      });
      return NextResponse.json(
        { error: `Too many trades. Try again in ${rateLimit.resetIn} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { marketId, outcomeId, amount }: { marketId: string; outcomeId: string; amount: number } = body;

    // Validate amount: must be a positive integer, max 100,000 karma per trade
    const MAX_TRADE_AMOUNT = 100_000;
    if (!marketId || !outcomeId || typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "marketId, outcomeId, and positive integer amount are required" }, { status: 400 });
    }
    if (amount > MAX_TRADE_AMOUNT) {
      return NextResponse.json({ error: `Maximum trade amount is ${MAX_TRADE_AMOUNT} karma` }, { status: 400 });
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

    // Audit log
    const clientInfo = getClientInfo(req.headers);
    auditLog({
      action: "TRADE_PLACED",
      userId: user.id,
      metadata: {
        marketId,
        outcomeId,
        amount,
        positionId: result.position.id,
      },
      ...clientInfo,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/trades] Error:", error);
    return NextResponse.json({ error: "Failed to place trade" }, { status: 500 });
  }
}


