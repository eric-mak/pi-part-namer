import { NextResponse } from "next/server";
import { authorizeUrl } from "@/lib/onshape";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const returnTo = url.searchParams.get("returnTo") ?? "/onshape";
  const state = Buffer.from(JSON.stringify({ returnTo })).toString("base64url");
  try {
    return NextResponse.redirect(authorizeUrl(state));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
