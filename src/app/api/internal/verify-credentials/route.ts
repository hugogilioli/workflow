export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    const e = String(email ?? "").trim().toLowerCase();
    const p = String(password ?? "");

    if (!e || !p) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: e } });
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const ok = await bcrypt.compare(p, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("verify-credentials error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
