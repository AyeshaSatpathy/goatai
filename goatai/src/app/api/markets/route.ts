import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { collegeIds } from "@/lib/colleges";
import { categoryIds } from "@/lib/categories";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";
import { moderateMarket } from "@/lib/content-moderation";
import { auditLog, getClientInfo } from "@/lib/audit-log";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collegeId = searchParams.get("collegeId") || undefined;
    const statusParam = searchParams.get("status") || undefined;
    const categoryParam = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;

    // Validate status parameter
    const validStatuses = ["OPEN", "RESOLVED", "CANCELED"] as const;
    const status = statusParam && validStatuses.includes(statusParam as typeof validStatuses[number])
      ? (statusParam as typeof validStatuses[number])
      : undefined;

    // Validate category parameter
    const category = categoryParam && categoryIds.has(categoryParam as never)
      ? categoryParam
      : undefined;

    const markets = await prisma.market.findMany({
      where: {
        collegeId,
        ...(status && { status }),
        ...(category && { category: category as never }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        outcomes: {
          orderBy: { position: "asc" },
        },
        creator: {
          select: { id: true, name: true, image: true },
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

    // Rate limiting (5 markets per hour)
    const rateLimit = checkRateLimit(user.id, rateLimits.createMarket);
    if (!rateLimit.success) {
      const clientInfo = getClientInfo(req.headers);
      auditLog({
        action: "RATE_LIMIT_HIT",
        userId: user.id,
        metadata: { endpoint: "create-market", resetIn: rateLimit.resetIn },
        ...clientInfo,
      });
      return NextResponse.json(
        { error: `Too many markets created. Try again in ${Math.ceil(rateLimit.resetIn / 60)} minutes.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      resolutionAt,
      outcomes,
      stakePoints,
      collegeId,
      category,
    }: {
      title: string;
      description: string;
      resolutionAt: string;
      outcomes: string[];
      stakePoints?: number | null;
      collegeId?: string | null;
      category?: string | null;
    } = body;

    // Validate required fields
    if (!title || !description || !resolutionAt) {
      return NextResponse.json(
        { error: "Title, description, and resolutionAt are required" },
        { status: 400 }
      );
    }

    // Validate input lengths
    const MAX_TITLE_LENGTH = 200;
    const MAX_DESCRIPTION_LENGTH = 2000;
    const MAX_OUTCOME_LENGTH = 100;
    const MAX_OUTCOMES = 10;

    if (typeof title !== "string" || title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        { error: `Title must be a string of max ${MAX_TITLE_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (typeof description !== "string" || description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `Description must be a string of max ${MAX_DESCRIPTION_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (!Array.isArray(outcomes) || outcomes.length < 2 || outcomes.length > MAX_OUTCOMES) {
      return NextResponse.json(
        { error: `Between 2 and ${MAX_OUTCOMES} outcomes are required` },
        { status: 400 }
      );
    }

    // Validate each outcome
    for (const outcome of outcomes) {
      if (typeof outcome !== "string" || outcome.length === 0 || outcome.length > MAX_OUTCOME_LENGTH) {
        return NextResponse.json(
          { error: `Each outcome must be a non-empty string of max ${MAX_OUTCOME_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    // Validate collegeId if provided
    if (collegeId && !collegeIds.has(collegeId)) {
      return NextResponse.json(
        { error: "Invalid college ID" },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category && !categoryIds.has(category as never)) {
      return NextResponse.json(
        { error: "Invalid category" },
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

    // Ensure resolution date is in the future
    if (resolutionDate <= new Date()) {
      return NextResponse.json(
        { error: "Resolution date must be in the future" },
        { status: 400 }
      );
    }

    // Content moderation
    const modResult = moderateMarket(title, description, outcomes);
    if (!modResult.allowed) {
      return NextResponse.json(
        { error: modResult.reason || "Content not allowed" },
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
        category: category as never ?? null,
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

    // Audit log
    const clientInfo = getClientInfo(req.headers);
    auditLog({
      action: "MARKET_CREATED",
      userId: user.id,
      metadata: {
        marketId: market.id,
        title: market.title,
        collegeId: market.collegeId,
        outcomeCount: outcomes.length,
      },
      ...clientInfo,
    });

    return NextResponse.json(market, { status: 201 });
  } catch (error) {
    console.error("[POST /api/markets] Error:", error);
    return NextResponse.json({ error: "Failed to create market" }, { status: 500 });
  }
}


