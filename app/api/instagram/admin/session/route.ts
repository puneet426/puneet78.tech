import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, checkPassword, isAdmin, sessionValue } from "@/lib/instagram/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Am I logged in? */
export async function GET() {
  return NextResponse.json({
    loggedIn: isAdmin(),
    configured: Boolean(process.env.ADMIN_PASSWORD),
  });
}

/** Log in. */
export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!checkPassword(String(password ?? ""))) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, sessionValue()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

/** Log out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
