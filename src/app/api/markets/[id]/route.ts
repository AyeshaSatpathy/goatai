import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const market = await prisma.market.findUnique({
      where: { id },
      include: {
        outcomes: { orderBy: { position: "asc" } },
        creator: { select: { id: true, name: true, image: true } },
      },
    });

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    return NextResponse.json(market);
  } catch (error) {
    console.error("[GET /api/markets/:id] Error:", error);
    return NextResponse.json({ error: "Failed to load market" }, { status: 500 });
  }
}


