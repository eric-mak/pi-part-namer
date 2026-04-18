import { NextResponse } from "next/server";
import { exchangeCode, writeToken } from "@/lib/onshape";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  if (!code) {
    return NextResponse.json({ error: "missing code" }, { status: 400 });
  }

  let returnTo = "/onshape";
  try {
    const decoded = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as { returnTo?: string };
    if (decoded.returnTo) returnTo = decoded.returnTo;
  } catch {
    /* ignore */
  }

  try {
    const tok = await exchangeCode(code);
    await writeToken(tok);
    return NextResponse.redirect(new URL(returnTo, url.origin));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
