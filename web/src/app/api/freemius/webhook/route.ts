import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

/**
 * Freemius webhook receiver.
 *
 * Configure in the Freemius dashboard (Settings → Webhooks) to point at
 * https://YOUR-DOMAIN/api/freemius/webhook and set FREEMIUS_SECRET_KEY in the
 * server environment (sk_... — NEVER expose it as NEXT_PUBLIC_*).
 *
 * Freemius signs each request with HMAC-SHA256 of the raw body using your
 * secret key, sent in the `x-signature` header. Events worth handling:
 *   license.created / license.activated  → grant Pro access
 *   license.expired / license.cancelled → revoke Pro access
 *   subscription.cancelled              → schedule downgrade at period end
 */
export async function POST(req: NextRequest) {
  const secret = process.env.FREEMIUS_SECRET_KEY;
  const raw = await req.text();

  if (secret) {
    const signature = req.headers.get("x-signature") ?? "";
    const expected = crypto
      .createHmac("sha256", secret)
      .update(raw)
      .digest("hex");
    const valid =
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  } else {
    // Without the secret configured we cannot trust the payload — accept
    // nothing. This avoids a spoofable webhook in half-configured deploys.
    return NextResponse.json(
      { error: "webhook not configured (FREEMIUS_SECRET_KEY missing)" },
      { status: 503 }
    );
  }

  let event: { type?: string; objects?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  switch (event.type) {
    case "license.created":
    case "license.activated":
      // TODO: mark the user as Pro in your DB (e.g. Supabase) using
      // event.objects.user / event.objects.license.
      break;
    case "license.expired":
    case "license.cancelled":
    case "subscription.cancelled":
      // TODO: revoke or schedule revocation of Pro access.
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
