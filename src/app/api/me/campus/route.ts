import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { collegeIds } from "@/lib/colleges";

export async function PUT(req: NextRequest) {
  try {
    const sessionResult = await auth.api.getSession({
      headers: Object.fromEntries(req.headers),
    });

    const user = sessionResult?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const campusId = (body?.campusId ?? null) as string | null;

    if (!campusId || typeof campusId !== "string" || !collegeIds.has(campusId)) {
      return NextResponse.json({ error: "Invalid campusId" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { campusId },
      select: { id: true, campusId: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("[PUT /api/me/campus] Error:", error);
    return NextResponse.json({ error: "Failed to update campus" }, { status: 500 });
  }
}


