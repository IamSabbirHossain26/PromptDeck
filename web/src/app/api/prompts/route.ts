import { NextResponse } from "next/server";
import { listPrompts } from "@/lib/prompts-repo";

// Public endpoint consumed by the browser extension and the web app.
// Reads from the database when configured, else the bundled prompts.json.
// CORS is open because the extension fetches it from chatgpt.com / claude.ai.
export const dynamic = "force-dynamic";

export async function GET() {
  let prompts;
  try {
    prompts = await listPrompts();
  } catch (e) {
    return NextResponse.json(
      { error: "failed to load prompts" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
  return NextResponse.json(
    { version: 1, count: prompts.length, prompts },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    }
  );
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
