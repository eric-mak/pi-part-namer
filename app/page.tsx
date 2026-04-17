"use client";

import { useMemo, useRef, useState } from "react";
import {
  CATEGORIES,
  SERIES_OPTIONS,
  formatFileName,
  formatPPN,
  type Category,
  type Field,
} from "@/lib/naming";

type FormValues = Record<string, string | boolean>;

function buildInitialValues(category: Category): FormValues {
  const v: FormValues = {};
  for (const f of category.fields) {
    if (f.type === "checkbox") {
      v[f.key] = Boolean(f.defaultValue);
    } else {
      v[f.key] = typeof f.defaultValue === "string" ? f.defaultValue : "";
    }
  }
  return v;
}

const widthClass = (w?: Field["width"]) =>
  w === "half"
    ? "md:col-span-3"
    : w === "third"
      ? "md:col-span-2"
      : "md:col-span-6";

export default function Home() {
  const [categoryId, setCategoryId] = useState<string>(CATEGORIES[0].id);
  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0],
    [categoryId],
  );
  const [allValues, setAllValues] = useState<Record<string, FormValues>>(() => {
    const init: Record<string, FormValues> = {};
    for (const c of CATEGORIES) init[c.id] = buildInitialValues(c);
    return init;
  });
  const [series, setSeries] = useState("2");
  const [ppnNumber, setPpnNumber] = useState("");
  const [dash, setDash] = useState("");
  const [revision, setRevision] = useState("R1");
  const [copied, setCopied] = useState<string | null>(null);

  const [parseUrl, setParseUrl] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseNote, setParseNote] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const applyParseResult = (result: {
    categoryId: string;
    values: Record<string, string | boolean>;
    reasoning?: string;
  }) => {
    const cat = CATEGORIES.find((c) => c.id === result.categoryId);
    if (!cat) throw new Error(`Unknown category ${result.categoryId}`);
    const base = buildInitialValues(cat);
    const merged: FormValues = { ...base };
    for (const f of cat.fields) {
      const incoming = result.values[f.key];
      if (incoming === undefined) continue;
      if (f.type === "checkbox") merged[f.key] = Boolean(incoming);
      else merged[f.key] = typeof incoming === "string" ? incoming : "";
    }
    setCategoryId(cat.id);
    setAllValues((prev) => ({ ...prev, [cat.id]: merged }));
    setParseNote(result.reasoning ?? null);
  };

  const handleParseUrl = async () => {
    if (!parseUrl.trim()) return;
    setParsing(true);
    setParseError(null);
    setParseNote(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: parseUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "parse failed");
      applyParseResult(data);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : String(e));
    } finally {
      setParsing(false);
    }
  };

  const handleParseImage = async (file: File) => {
    setParsing(true);
    setParseError(null);
    setParseNote(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      setImagePreview(dataUrl);
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "parse failed");
      applyParseResult(data);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : String(e));
    } finally {
      setParsing(false);
    }
  };

  const values = allValues[category.id];
  const setValue = (key: string, val: string | boolean) =>
    setAllValues((prev) => ({
      ...prev,
      [category.id]: { ...prev[category.id], [key]: val },
    }));

  const name = useMemo(() => category.format(values), [category, values]);
  const ppn = useMemo(
    () => formatPPN({ series, number: ppnNumber, dash, revision }),
    [series, ppnNumber, dash, revision],
  );
  const fileName = useMemo(
    () => formatFileName(ppn, revision, name),
    [ppn, revision, name],
  );

  const copy = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* ignore */
    }
  };

  return (
    <main className="flex-1 flex flex-col">
      <header className="px-8 md:px-16 pt-10 pb-8 flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <span
            aria-label="pi"
            className="inline-flex items-center justify-center h-12 w-12 md:h-14 md:w-14 rounded-full border-[3px] border-black text-2xl md:text-3xl leading-none font-serif italic pb-0.5 bg-[var(--surface)]"
          >
            π
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide">
              PI PART NAMER
            </h1>
            <p className="text-sm md:text-base text-[var(--muted)] mt-1">
              generate standard-compliant part names
            </p>
          </div>
        </div>
        <a
          href="https://www.notion.so/CAD-Standard-Practices-2fd0d8d430d480a4a198e8ea9c28f430"
          target="_blank"
          rel="noreferrer"
          className="hidden md:inline-block text-xs px-4 py-3 bg-[var(--surface)] border border-dashed border-black hover:bg-white transition-colors"
        >
          CAD Standard Practices ↗
        </a>
      </header>

      <div className="border-t border-black/20" />

      <section className="flex-1 px-8 md:px-16 py-10 space-y-8">
        {/* PARSE */}
        <div className="bg-[var(--surface)] border-[3px] border-black shadow-[6px_6px_0_0_#0a0a0a]">
          <div className="px-6 py-6">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-4">
              <div className="text-xs tracking-widest">
                PARSE FROM LINK OR IMAGE
              </div>
              <div className="text-[11px] text-[var(--muted)]">
                auto-fills category + fields using vision + URL scraping
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 flex flex-col">
                <label className="text-xs tracking-widest mb-1.5">
                  VENDOR URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={parseUrl}
                    onChange={(e) => setParseUrl(e.target.value)}
                    placeholder="https://www.mcmaster.com/91290A115/"
                    className="flex-1 bg-[var(--surface)] border border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !parsing) handleParseUrl();
                    }}
                  />
                  <button
                    onClick={handleParseUrl}
                    disabled={parsing || !parseUrl.trim()}
                    className="text-xs px-4 py-2 border border-dashed border-black bg-[var(--background)] hover:bg-black hover:text-[var(--surface)] disabled:opacity-40 transition-colors"
                  >
                    {parsing ? "PARSING…" : "PARSE URL"}
                  </button>
                </div>
              </div>

              <div className="md:col-span-4 flex flex-col">
                <label className="text-xs tracking-widest mb-1.5">
                  IMAGE / PHOTO
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleParseImage(f);
                    if (e.target) e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={parsing}
                  className="text-xs px-4 py-2 border border-dashed border-black bg-[var(--background)] hover:bg-black hover:text-[var(--surface)] disabled:opacity-40 transition-colors"
                >
                  {parsing ? "PARSING…" : "UPLOAD IMAGE"}
                </button>
              </div>
            </div>

            {(parseError || parseNote || imagePreview) && (
              <div className="mt-4 flex flex-wrap items-start gap-4">
                {imagePreview && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imagePreview}
                    alt="uploaded part"
                    className="h-20 w-20 object-cover border border-black"
                  />
                )}
                <div className="flex-1 min-w-[200px] text-[11px] space-y-1">
                  {parseError && (
                    <div className="text-red-700">ERROR: {parseError}</div>
                  )}
                  {parseNote && (
                    <div className="text-[var(--muted)]">
                      <span className="tracking-widest">NOTE: </span>
                      {parseNote}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CATEGORY picker */}
        <div className="bg-[var(--surface)] border-[3px] border-black shadow-[6px_6px_0_0_#0a0a0a]">
          <div className="px-6 pt-5 pb-5">
            <div className="text-xs tracking-widest mb-3">CATEGORY</div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = c.id === category.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={`text-xs px-3 py-2 border transition-colors ${
                      active
                        ? "bg-black text-[var(--surface)] border-black"
                        : "bg-[var(--surface)] border-dashed border-black hover:bg-[var(--background)]"
                    }`}
                    title={c.group}
                  >
                    <span className="opacity-60 mr-2">{c.group}</span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="bg-[var(--surface)] border-[3px] border-black shadow-[6px_6px_0_0_#0a0a0a]">
          <div className="px-6 py-6">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-2">
              <div className="text-xs tracking-widest">
                {category.group} &mdash; {category.label}
              </div>
              <div className="text-xs text-[var(--muted)]">
                {category.series}
              </div>
            </div>
            <div className="text-xs text-[var(--muted)] mb-6">
              FORMAT: {category.description}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {category.fields.map((f) => {
                const colClass = widthClass(f.width);
                if (f.type === "checkbox") {
                  return (
                    <label
                      key={f.key}
                      className={`${colClass} flex items-center gap-3 text-xs py-2 cursor-pointer select-none`}
                    >
                      <input
                        type="checkbox"
                        checked={values[f.key] === true}
                        onChange={(e) => setValue(f.key, e.target.checked)}
                        className="h-4 w-4 accent-black"
                      />
                      <span>{f.label}</span>
                    </label>
                  );
                }
                if (f.type === "select") {
                  return (
                    <div key={f.key} className={`${colClass} flex flex-col`}>
                      <div className="flex items-baseline justify-between">
                        <label className="text-xs tracking-widest mb-1.5">
                          {f.label}
                          {f.optional && (
                            <span className="text-[var(--muted)] ml-1 font-normal normal-case tracking-normal">
                              (optional)
                            </span>
                          )}
                        </label>
                        {f.hint && (
                          <span className="text-[10px] text-[var(--muted)]">
                            {f.hint}
                          </span>
                        )}
                      </div>
                      <select
                        value={String(values[f.key] ?? "")}
                        onChange={(e) => setValue(f.key, e.target.value)}
                        className="bg-[var(--surface)] border border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        {(f.options ?? []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt === "" ? "— none —" : opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return (
                  <div key={f.key} className={`${colClass} flex flex-col`}>
                    <div className="flex items-baseline justify-between">
                      <label className="text-xs tracking-widest mb-1.5">
                        {f.label}
                        {f.optional && (
                          <span className="text-[var(--muted)] ml-1 font-normal normal-case tracking-normal">
                            (optional)
                          </span>
                        )}
                      </label>
                      {f.hint && (
                        <span className="text-[10px] text-[var(--muted)]">
                          {f.hint}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={String(values[f.key] ?? "")}
                      onChange={(e) => setValue(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      spellCheck={false}
                      autoCapitalize="characters"
                      className="bg-[var(--surface)] border border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PPN + REV */}
        <div className="bg-[var(--surface)] border-[3px] border-black shadow-[6px_6px_0_0_#0a0a0a]">
          <div className="px-6 py-6">
            <div className="text-xs tracking-widest mb-4">
              PI PART NUMBER (PPN) &mdash; OPTIONAL
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 flex flex-col">
                <label className="text-xs tracking-widest mb-1.5">SERIES</label>
                <select
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  className="bg-[var(--surface)] border border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {SERIES_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3 flex flex-col">
                <label className="text-xs tracking-widest mb-1.5">
                  NUMBER (6 DIGITS)
                </label>
                <input
                  type="text"
                  value={ppnNumber}
                  onChange={(e) =>
                    setPpnNumber(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000399"
                  className="bg-[var(--surface)] border border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="md:col-span-2 flex flex-col">
                <label className="text-xs tracking-widest mb-1.5">
                  DASH
                  <span className="text-[var(--muted)] ml-1 font-normal normal-case tracking-normal">
                    (opt)
                  </span>
                </label>
                <input
                  type="text"
                  value={dash}
                  onChange={(e) =>
                    setDash(e.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  placeholder="001"
                  className="bg-[var(--surface)] border border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="md:col-span-2 flex flex-col">
                <label className="text-xs tracking-widest mb-1.5">
                  REVISION
                </label>
                <input
                  type="text"
                  value={revision}
                  onChange={(e) => setRevision(e.target.value.toUpperCase())}
                  placeholder="R1"
                  className="bg-[var(--surface)] border border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-3 leading-relaxed">
              Prototype builds use number revisions (R1, R2…). Production parts
              use letter revisions starting at A (skip I, O, Q, S, X, Z).
            </p>
          </div>
        </div>

        {/* OUTPUT */}
        <div className="bg-black text-[var(--surface)] border-[3px] border-black shadow-[6px_6px_0_0_#0a0a0a]">
          <div className="px-6 py-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs tracking-widest opacity-70">NAME</div>
                <button
                  onClick={() => copy(name, "name")}
                  disabled={!name}
                  className="text-[10px] px-3 py-1 border border-dashed border-[var(--surface)] hover:bg-[var(--surface)] hover:text-black disabled:opacity-40 transition-colors"
                >
                  {copied === "name" ? "COPIED" : "COPY"}
                </button>
              </div>
              <div className="text-lg md:text-xl break-words min-h-[1.75rem]">
                {name || (
                  <span className="opacity-40">
                    fill in fields to generate a name…
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-[var(--surface)]/30">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs tracking-widest opacity-70">PPN</div>
                  <button
                    onClick={() => copy(ppn, "ppn")}
                    disabled={!ppn}
                    className="text-[10px] px-3 py-1 border border-dashed border-[var(--surface)] hover:bg-[var(--surface)] hover:text-black disabled:opacity-40 transition-colors"
                  >
                    {copied === "ppn" ? "COPIED" : "COPY"}
                  </button>
                </div>
                <div className="text-base break-words min-h-[1.5rem]">
                  {ppn || <span className="opacity-40">&mdash;</span>}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs tracking-widest opacity-70">
                    FILENAME (no ext.)
                  </div>
                  <button
                    onClick={() => copy(fileName, "file")}
                    disabled={!fileName}
                    className="text-[10px] px-3 py-1 border border-dashed border-[var(--surface)] hover:bg-[var(--surface)] hover:text-black disabled:opacity-40 transition-colors"
                  >
                    {copied === "file" ? "COPIED" : "COPY"}
                  </button>
                </div>
                <div className="text-base break-words min-h-[1.5rem]">
                  {fileName || <span className="opacity-40">&mdash;</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EXAMPLES */}
        <div>
          <div className="text-xs tracking-widest mb-3">EXAMPLES</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {category.examples.map((ex) => (
              <div
                key={ex}
                className="text-xs px-3 py-2 bg-[var(--surface)] border border-dashed border-black/70 break-words"
              >
                {ex}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-8 md:px-16 py-6 text-[11px] text-[var(--muted)] border-t border-black/20">
        golden rule: NOUN FIRST, MODIFIERS SECOND &middot; ALL CAPS &middot;
        comma + space separators &middot; leading zero on decimals &middot;
        &ldquo;X&rdquo; means &ldquo;by&rdquo;
      </footer>
    </main>
  );
}
