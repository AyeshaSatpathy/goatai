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
      select: { id: true, email: true, name: true, image: true, campusId: true, karmaBalance: true },
    });

    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user: me });
  } catch (error) {
    console.error("[GET /api/me] Error:", error);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}


