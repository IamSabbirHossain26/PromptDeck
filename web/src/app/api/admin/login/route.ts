import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  isAuthConfigured,
  sessionToken,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "Admin auth not configured (set ADMIN_PASSWORD and ADMIN_SECRET)." },
      { status: 503 }
    );
  }
  let password = "";
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const token = sessionToken()!;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
