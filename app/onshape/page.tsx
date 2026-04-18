import { readToken } from "@/lib/onshape";
import { OnshapeClient } from "./OnshapeClient";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [k: string]: string | string[] | undefined }>;

function str(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function OnshapePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const token = await readToken();

  const ctx = {
    documentId: str(sp.documentId),
    workspaceId: str(sp.workspaceId),
    versionId: str(sp.versionId),
    elementId: str(sp.elementId),
    clientId: str(sp.clientId),
  };

  if (!token) {
    const current = new URL("https://placeholder/onshape");
    for (const [k, v] of Object.entries(ctx)) {
      if (v) current.searchParams.set(k, v);
    }
    const returnTo = `/onshape${current.search}`;
    const authHref = `/api/onshape/auth?returnTo=${encodeURIComponent(returnTo)}`;
    return (
      <main className="min-h-screen px-6 py-10 flex items-center justify-center">
        <div className="max-w-md bg-[var(--surface)] border-[3px] border-[var(--border)] shadow-[6px_6px_0_0_var(--shadow)] p-6">
          <h1 className="serif text-2xl mb-3">
            PI Part Namer <span className="italic">(π)</span>
          </h1>
          <p className="text-sm text-[var(--muted)] mb-5">
            Connect your Onshape account to let this extension read part
            metadata and write generated names back to Onshape.
          </p>
          <a
            href={authHref}
            className="inline-block text-xs tracking-widest px-4 py-3 border border-dashed border-[var(--border)] bg-[var(--background)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-fg)] transition-colors"
          >
            CONNECT TO ONSHAPE
          </a>
        </div>
      </main>
    );
  }

  return <OnshapeClient ctx={ctx} />;
}
