import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionResult = await auth.api.getSession({
      headers: Object.fromEntries(req.headers),
    });

    const user = sessionResult?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, image: true, karmaBalance: true, campusId: true },
    });

    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const positions = await prisma.position.findMany({
      where: { userId: user.id },
      include: {
        market: { select: { id: true, title: true, status: true, resolutionAt: true, resolvedAt: true } },
        outcome: { select: { id: true, label: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ user: me, positions });
  } catch (error) {
    console.error("[GET /api/wallet] Error:", error);
    return NextResponse.json({ error: "Failed to load wallet" }, { status: 500 });
  }
}


