import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collegeId = searchParams.get("collegeId") || undefined;

    const markets = await prisma.market.findMany({
      where: {
        collegeId,
      },
      include: {
        outcomes: {
          orderBy: { position: "asc" },
        },
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add lightweight odds/totals for list rendering
    const marketIds = markets.map((m) => m.id);
    const grouped = marketIds.length
      ? await prisma.position.groupBy({
          by: ["marketId", "outcomeId"],
          where: { marketId: { in: marketIds } },
          _sum: { amount: true },
        })
      : [];

    const totalsByMarket = new Map<string, Map<string, number>>();
    const poolByMarket = new Map<string, number>();

    for (const row of grouped) {
      const mId = row.marketId;
      const oId = row.outcomeId;
      const amt = row._sum.amount ?? 0;
      if (!totalsByMarket.has(mId)) totalsByMarket.set(mId, new Map());
      totalsByMarket.get(mId)!.set(oId, amt);
      poolByMarket.set(mId, (poolByMarket.get(mId) ?? 0) + amt);
    }

    const withOdds = markets.map((m) => {
      const pool = poolByMarket.get(m.id) ?? 0;
      const byOutcome = totalsByMarket.get(m.id) ?? new Map<string, number>();
      const odds = m.outcomes.map((o) => {
        const amt = byOutcome.get(o.id) ?? 0;
        return {
          outcomeId: o.id,
          amount: amt,
          probability: pool > 0 ? amt / pool : 0,
        };
      });
      return { ...m, totalPool: pool, odds };
    });

    return NextResponse.json(withOdds);
  } catch (error) {
    console.error("[GET /api/markets] Error:", error);
    return NextResponse.json({ error: "Failed to load markets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require an authenticated user
    const sessionResult = await auth.api.getSession({
      headers: Object.fromEntries(req.headers),
    });

    const user = sessionResult?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      resolutionAt,
      outcomes,
      stakePoints,
      collegeId,
    }: {
      title: string;
      description: string;
      resolutionAt: string;
      outcomes: string[];
      stakePoints?: number | null;
      collegeId?: string | null;
    } = body;

    if (!title || !description || !resolutionAt) {
      return NextResponse.json(
        { error: "Title, description, and resolutionAt are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(outcomes) || outcomes.length < 2) {
      return NextResponse.json(
        { error: "At least two outcomes are required" },
        { status: 400 }
      );
    }

    const resolutionDate = new Date(resolutionAt);
    if (Number.isNaN(resolutionDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid resolutionAt date/time" },
        { status: 400 }
      );
    }

    const market = await prisma.market.create({
      data: {
        title,
        description,
        resolutionAt: resolutionDate,
        stakePoints: stakePoints ?? null,
        collegeId: collegeId ?? null,
        creatorId: user.id,
        outcomes: {
          create: outcomes.map((label, index) => ({
            label,
            position: index,
          })),
        },
      },
      include: {
        outcomes: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json(market, { status: 201 });
  } catch (error) {
    console.error("[POST /api/markets] Error:", error);
    return NextResponse.json({ error: "Failed to create market" }, { status: 500 });
  }
}


