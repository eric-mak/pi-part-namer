"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  type Category,
  type Field,
  formatPPN,
} from "@/lib/naming";

interface Ctx {
  documentId: string;
  workspaceId: string;
  versionId: string;
  elementId: string;
  clientId: string;
}

type FormValues = Record<string, string | boolean>;

function buildInitialValues(category: Category): FormValues {
  const v: FormValues = {};
  for (const f of category.fields) {
    if (f.type === "checkbox") v[f.key] = Boolean(f.defaultValue);
    else v[f.key] = typeof f.defaultValue === "string" ? f.defaultValue : "";
  }
  return v;
}

const widthClass = (w?: Field["width"]) =>
  w === "half"
    ? "md:col-span-3"
    : w === "third"
      ? "md:col-span-2"
      : "md:col-span-6";

export function OnshapeClient({ ctx }: { ctx: Ctx }) {
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [selectedPartName, setSelectedPartName] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Waiting for part selection…");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState<string>(CATEGORIES[0].id);
  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0],
    [categoryId],
  );
  const [values, setValues] = useState<FormValues>(() =>
    buildInitialValues(CATEGORIES[0]),
  );

  const [ppnSeries, setPpnSeries] = useState("2");
  const [ppnNumber, setPpnNumber] = useState("");
  const [ppnDash, setPpnDash] = useState("");

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      const data = ev.data as
        | { messageName?: string; message?: Record<string, unknown> }
        | undefined;
      if (!data || typeof data !== "object") return;
      if (
        data.messageName === "onshapeSelectionChanged" ||
        data.messageName === "selectionChanged"
      ) {
        const payload = data.message ?? {};
        const parts =
          (payload.selections as Array<{
            deterministicId?: string;
            partId?: string;
            name?: string;
          }>) ?? [];
        const first = parts[0];
        if (first && (first.partId || first.deterministicId)) {
          setSelectedPartId(
            (first.partId ?? first.deterministicId) as string,
          );
          setSelectedPartName(first.name ?? null);
          setStatus("");
        } else {
          setSelectedPartId(null);
          setSelectedPartName(null);
          setStatus("Waiting for part selection…");
        }
      }
    };
    window.addEventListener("message", handler);
    window.parent?.postMessage({ messageName: "extensionReady" }, "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  const partQuery = useMemo(() => {
    if (!selectedPartId) return "";
    const q = new URLSearchParams();
    q.set("documentId", ctx.documentId);
    if (ctx.workspaceId) q.set("workspaceId", ctx.workspaceId);
    else if (ctx.versionId) q.set("versionId", ctx.versionId);
    q.set("elementId", ctx.elementId);
    q.set("partId", selectedPartId);
    return q.toString();
  }, [ctx, selectedPartId]);

  const generate = useCallback(async () => {
    if (!partQuery) return;
    setBusy(true);
    setError(null);
    setStatus("Reading part metadata…");
    try {
      const metaRes = await fetch(`/api/onshape/part?${partQuery}`);
      const metaJson = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaJson.error ?? "metadata failed");

      const text = JSON.stringify(metaJson, null, 2).slice(0, 10000);
      const dataUrl = `data:text/plain;base64,${btoa(
        unescape(encodeURIComponent(text)),
      )}`;

      setStatus("Generating name…");
      const parseRes = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: {
            data: dataUrl,
            mediaType: "text/plain",
            name: selectedPartName ?? "onshape-part",
          },
        }),
      });
      const parseJson = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseJson.error ?? "parse failed");

      const cat = CATEGORIES.find((c) => c.id === parseJson.categoryId);
      if (!cat) throw new Error(`Unknown category ${parseJson.categoryId}`);
      const base = buildInitialValues(cat);
      for (const f of cat.fields) {
        const incoming = parseJson.values?.[f.key];
        if (incoming === undefined) continue;
        if (f.type === "checkbox") base[f.key] = Boolean(incoming);
        else base[f.key] = typeof incoming === "string" ? incoming : "";
      }
      setCategoryId(cat.id);
      setValues(base);
      setStatus("Name generated. Edit if needed, then save.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [partQuery, selectedPartName]);

  const name = useMemo(() => category.format(values), [category, values]);
  const ppn = useMemo(
    () => formatPPN({ series: ppnSeries, number: ppnNumber, dash: ppnDash, revision: "" }),
    [ppnSeries, ppnNumber, ppnDash],
  );

  const save = async () => {
    if (!partQuery || !name) return;
    setBusy(true);
    setError(null);
    setStatus("Writing to Onshape…");
    try {
      const res = await fetch(`/api/onshape/part?${partQuery}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          partNumber: ppn || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "save failed");
      setStatus("Saved to Onshape ✓");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const setValue = (k: string, v: string | boolean) =>
    setValues((prev) => {
      const next = { ...prev, [k]: v };
      if (category.derive) {
        const derived = category.derive(next);
        for (const [dk, dv] of Object.entries(derived)) next[dk] = dv;
      }
      return next;
    });

  return (
    <main className="min-h-screen p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="serif text-xl">
          PI Part Namer <span className="italic">(π)</span>
        </h1>
        <div className="text-[10px] text-[var(--muted)] tracking-widest">
          ONSHAPE EXTENSION
        </div>
      </header>

      <div className="bg-[var(--surface)] border-[3px] border-[var(--border)] p-4 shadow-[4px_4px_0_0_var(--shadow)]">
        <div className="text-[11px] tracking-widest mb-2">SELECTION</div>
        {selectedPartId ? (
          <div className="text-sm break-all">
            <span className="opacity-70">{selectedPartName ?? "(unnamed)"}</span>
            <span className="ml-2 text-[10px] opacity-50">
              id: {selectedPartId}
            </span>
          </div>
        ) : (
          <div className="text-sm text-[var(--muted)]">
            Click a part in Onshape.
          </div>
        )}
        <button
          onClick={generate}
          disabled={!selectedPartId || busy}
          className="mt-3 text-xs px-4 py-2 border border-dashed border-[var(--border)] bg-[var(--background)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-fg)] disabled:opacity-40 transition-colors"
        >
          {busy ? "WORKING…" : "GENERATE NAME"}
        </button>
      </div>

      {(status || error) && (
        <div className="text-[11px]">
          {error ? (
            <span className="text-[var(--danger)]">ERROR: {error}</span>
          ) : (
            <span className="text-[var(--muted)]">{status}</span>
          )}
        </div>
      )}

      <div className="bg-[var(--surface)] border-[3px] border-[var(--border)] p-4 shadow-[4px_4px_0_0_var(--shadow)]">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {CATEGORIES.map((c) => {
            const active = c.id === category.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setCategoryId(c.id);
                  setValues(buildInitialValues(c));
                }}
                className={`text-[10px] px-2 py-1 border ${
                  active
                    ? "bg-[var(--invert-bg)] text-[var(--invert-fg)] border-[var(--border)]"
                    : "bg-[var(--surface)] border-dashed border-[var(--border)]"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {category.fields
            .filter((f) => !f.advanced)
            .map((f) => {
              const cls = widthClass(f.width);
              if (f.type === "checkbox") {
                return (
                  <label
                    key={f.key}
                    className={`${cls} flex items-center gap-2 text-xs`}
                  >
                    <input
                      type="checkbox"
                      checked={values[f.key] === true}
                      onChange={(e) => setValue(f.key, e.target.checked)}
                    />
                    {f.label}
                  </label>
                );
              }
              if (f.type === "select") {
                return (
                  <div key={f.key} className={`${cls} flex flex-col`}>
                    <label className="text-[10px] tracking-widest mb-1">
                      {f.label}
                    </label>
                    <select
                      value={String(values[f.key] ?? "")}
                      onChange={(e) => setValue(f.key, e.target.value)}
                      className="bg-[var(--surface)] border border-[var(--border)] px-2 py-1.5 text-sm"
                    >
                      {(f.options ?? []).map((o) => (
                        <option key={o} value={o}>
                          {o || "—"}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              const sugg = f.suggestions ? f.suggestions(values) : [];
              const listId = sugg.length ? `dl-os-${f.key}` : undefined;
              return (
                <div key={f.key} className={`${cls} flex flex-col`}>
                  <label className="text-[10px] tracking-widest mb-1">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    list={listId}
                    value={String(values[f.key] ?? "")}
                    onChange={(e) => setValue(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="bg-[var(--surface)] border border-[var(--border)] px-2 py-1.5 text-sm"
                  />
                  {listId && (
                    <datalist id={listId}>
                      {sugg.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      <div className="bg-[var(--surface)] border-[3px] border-[var(--border)] p-4 shadow-[4px_4px_0_0_var(--shadow)]">
        <div className="text-[11px] tracking-widest mb-2">
          PART NUMBER <span className="opacity-60">(optional)</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input
            value={ppnSeries}
            onChange={(e) => setPpnSeries(e.target.value.replace(/\D/g, "").slice(0, 1))}
            placeholder="2"
            className="bg-[var(--surface)] border border-[var(--border)] px-2 py-1.5 text-sm"
          />
          <input
            value={ppnNumber}
            onChange={(e) => setPpnNumber(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000001"
            className="bg-[var(--surface)] border border-[var(--border)] px-2 py-1.5 text-sm"
          />
          <input
            value={ppnDash}
            onChange={(e) => setPpnDash(e.target.value.replace(/\D/g, "").slice(0, 3))}
            placeholder="dash"
            className="bg-[var(--surface)] border border-[var(--border)] px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="bg-[var(--invert-bg)] text-[var(--invert-fg)] border-[3px] border-[var(--border)] p-4 shadow-[4px_4px_0_0_var(--shadow)]">
        <div className="text-[10px] tracking-widest opacity-70 mb-1">NAME</div>
        <div className="text-sm md:text-base break-words min-h-[1.25rem]">
          {name || <span className="opacity-40">(empty)</span>}
        </div>
        {ppn && (
          <div className="mt-2 text-[11px] opacity-70">PPN: {ppn}</div>
        )}
        <button
          onClick={save}
          disabled={!selectedPartId || !name || busy}
          className="mt-4 text-xs px-4 py-2 border border-dashed border-[var(--invert-fg)] hover:bg-[var(--invert-fg)] hover:text-[var(--invert-bg)] disabled:opacity-40 transition-colors"
        >
          {busy ? "SAVING…" : "SAVE TO ONSHAPE"}
        </button>
      </div>
    </main>
  );
}
