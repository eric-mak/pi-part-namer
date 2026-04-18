import { NextResponse } from "next/server";
import { onshapeFetch } from "@/lib/onshape";

export const runtime = "nodejs";

interface PartRef {
  documentId: string;
  workspaceId?: string;
  versionId?: string;
  elementId: string;
  partId: string;
}

function parseRef(url: URL): PartRef | { error: string } {
  const documentId = url.searchParams.get("documentId") ?? "";
  const workspaceId = url.searchParams.get("workspaceId") ?? "";
  const versionId = url.searchParams.get("versionId") ?? "";
  const elementId = url.searchParams.get("elementId") ?? "";
  const partId = url.searchParams.get("partId") ?? "";
  if (!documentId || !elementId || !partId)
    return { error: "documentId, elementId, and partId are required" };
  if (!workspaceId && !versionId)
    return { error: "workspaceId or versionId is required" };
  return { documentId, workspaceId, versionId, elementId, partId };
}

function partBase(r: PartRef) {
  const wv = r.workspaceId ? `w/${r.workspaceId}` : `v/${r.versionId}`;
  return `/parts/d/${r.documentId}/${wv}/e/${r.elementId}/partid/${encodeURIComponent(r.partId)}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = parseRef(url);
  if ("error" in ref) {
    return NextResponse.json({ error: ref.error }, { status: 400 });
  }

  try {
    const [metaRes, massRes] = await Promise.all([
      onshapeFetch(`${partBase(ref)}/metadata`),
      onshapeFetch(`${partBase(ref)}/massproperties`),
    ]);
    if (metaRes.status === 401) {
      return NextResponse.json({ error: "NOT_AUTHORIZED" }, { status: 401 });
    }
    if (!metaRes.ok) {
      return NextResponse.json(
        { error: `metadata ${metaRes.status}` },
        { status: 502 },
      );
    }
    const metadata = await metaRes.json();
    const mass = massRes.ok ? await massRes.json() : null;
    return NextResponse.json({ metadata, mass });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg === "NOT_AUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(req: Request) {
  const url = new URL(req.url);
  const ref = parseRef(url);
  if ("error" in ref) {
    return NextResponse.json({ error: ref.error }, { status: 400 });
  }
  let body: { name?: string; partNumber?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.name && !body.partNumber) {
    return NextResponse.json(
      { error: "provide 'name' or 'partNumber'" },
      { status: 400 },
    );
  }

  const properties: Array<{ propertyId: string; value: string }> = [];
  if (body.name) properties.push({ propertyId: "Name", value: body.name });
  if (body.partNumber)
    properties.push({ propertyId: "Part number", value: body.partNumber });

  try {
    const res = await onshapeFetch(`${partBase(ref)}/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ properties }),
    });
    if (res.status === 401) {
      return NextResponse.json({ error: "NOT_AUTHORIZED" }, { status: 401 });
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: `update ${res.status}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg === "NOT_AUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
