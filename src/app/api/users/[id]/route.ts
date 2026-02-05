import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await ctx.params;

    // Get current user to determine if viewing own profile
    const sessionResult = await auth.api.getSession({
      headers: Object.fromEntries(req.headers),
    });
    const currentUserId = sessionResult?.user?.id;
    const isOwnProfile = currentUserId === userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        campusId: true,
        karmaBalance: true,
        createdAt: true,
        positions: {
          include: {
            market: {
              select: {
                id: true,
                title: true,
                status: true,
                resolutionAt: true,
                resolvedAt: true,
                resolvedOutcomeId: true,
              },
            },
            outcome: {
              select: {
                id: true,
                label: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        markets: {
          select: {
            id: true,
            title: true,
            status: true,
            resolutionAt: true,
            createdAt: true,
            _count: {
              select: { positions: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate stats from resolved positions
    const resolvedPositions = user.positions.filter(
      (p) => p.market.status === "RESOLVED"
    );

    const totalTrades = resolvedPositions.length;
    const wins = resolvedPositions.filter((p) => p.status === "WON").length;
    const losses = resolvedPositions.filter((p) => p.status === "LOST").length;
    const winRate = totalTrades > 0 ? wins / totalTrades : 0;

    const totalStaked = resolvedPositions.reduce((sum, p) => sum + p.amount, 0);
    const totalPayout = resolvedPositions.reduce(
      (sum, p) => sum + (p.payout ?? 0),
      0
    );
    const profit = totalPayout - totalStaked;

    // Open positions (markets still open)
    const openPositions = user.positions.filter(
      (p) => p.market.status === "OPEN"
    );
    const totalAtRisk = openPositions.reduce((sum, p) => sum + p.amount, 0);

    // Format the response
    const profile = {
      id: user.id,
      name: user.name || user.email.split("@")[0],
      email: isOwnProfile ? user.email : undefined, // Only show email on own profile
      image: user.image,
      campusId: user.campusId,
      karmaBalance: isOwnProfile ? user.karmaBalance : undefined, // Only show balance on own profile
      createdAt: user.createdAt,
      isOwnProfile,
      stats: {
        totalTrades,
        wins,
        losses,
        winRate,
        totalStaked,
        totalPayout,
        profit,
        openPositions: openPositions.length,
        totalAtRisk,
        marketsCreated: user.markets.length,
      },
      positions: user.positions.map((p) => ({
        id: p.id,
        amount: p.amount,
        payout: p.payout,
        status: p.status,
        createdAt: p.createdAt,
        market: p.market,
        outcome: p.outcome,
      })),
      marketsCreated: user.markets.map((m) => ({
        id: m.id,
        title: m.title,
        status: m.status,
        resolutionAt: m.resolutionAt,
        createdAt: m.createdAt,
        tradeCount: m._count.positions,
      })),
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[GET /api/users/:id] Error:", error);
    return NextResponse.json(
      { error: "Failed to load user profile" },
      { status: 500 }
    );
  }
}
