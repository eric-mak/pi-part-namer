"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [touched, setTouched] = useState<Record<string, Set<string>>>(() => {
    const t: Record<string, Set<string>> = {};
    for (const c of CATEGORIES) t[c.id] = new Set();
    return t;
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [series, setSeries] = useState("2");
  const [ppnNumber, setPpnNumber] = useState("");
  const [dash, setDash] = useState("");
  const [revision, setRevision] = useState("R1");
  const [copied, setCopied] = useState<string | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, []);
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const [parseUrl, setParseUrl] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseNote, setParseNote] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
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
    const incomingKeys = new Set<string>();
    for (const f of cat.fields) {
      const incoming = result.values[f.key];
      if (incoming === undefined) continue;
      incomingKeys.add(f.key);
      if (f.type === "checkbox") merged[f.key] = Boolean(incoming);
      else merged[f.key] = typeof incoming === "string" ? incoming : "";
    }
    setCategoryId(cat.id);
    setAllValues((prev) => ({ ...prev, [cat.id]: merged }));
    setTouched((prev) => ({ ...prev, [cat.id]: incomingKeys }));
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

  const handleParseFile = async (file: File) => {
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
      const mediaType = file.type || "application/octet-stream";
      if (mediaType.startsWith("image/")) {
        setImagePreview(dataUrl);
        setFileLabel(null);
      } else {
        setImagePreview(null);
        setFileLabel(`${file.name} · ${mediaType}`);
      }
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: { data: dataUrl, mediaType, name: file.name },
        }),
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
  const setValue = (key: string, val: string | boolean) => {
    const prevCatValues = allValues[category.id];
    const nextValues: FormValues = { ...prevCatValues, [key]: val };
    const userTouched = touched[category.id] ?? new Set<string>();
    const nextTouched = new Set(userTouched);
    nextTouched.add(key);
    if (category.derive) {
      const derived = category.derive(nextValues);
      for (const [dk, dv] of Object.entries(derived)) {
        if (nextTouched.has(dk)) continue;
        nextValues[dk] = dv;
      }
    }
    setAllValues((prev) => ({ ...prev, [category.id]: nextValues }));
    setTouched((prev) => ({ ...prev, [category.id]: nextTouched }));
  };

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
        <div className="flex items-end gap-4">
          <h1 className="serif text-4xl md:text-5xl leading-none">
            PI Part Namer <span className="italic">(π)</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="toggle theme"
            className="text-xs px-4 py-3 bg-[var(--surface)] border border-dashed border-[var(--border)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-fg)] transition-colors"
          >
            {theme === "dark" ? "☀ LIGHT" : "☾ DARK"}
          </button>
          <a
            href="https://www.notion.so/CAD-Standard-Practices-2fd0d8d430d480a4a198e8ea9c28f430"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-block text-xs px-4 py-3 bg-[var(--surface)] border border-dashed border-[var(--border)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-fg)] transition-colors"
          >
            CAD Standard Practices ↗
          </a>
        </div>
      </header>

      <p className="px-8 md:px-16 -mt-4 pb-8 text-sm md:text-base text-[var(--muted)] max-w-3xl">
        generate standard-compliant part names following the PI CAD standard
        practices.
      </p>

      <div className="border-t border-[var(--divider)]" />

      <section className="flex-1 px-8 md:px-16 py-10 space-y-8">
        {/* PARSE */}
        <div className="bg-[var(--surface)] border-[3px] border-[var(--border)] shadow-[6px_6px_0_0_var(--shadow)]">
          <div className="px-6 py-6">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-4">
              <div className="serif text-xl">
                Parse from link or file
              </div>
              <div className="text-[11px] text-[var(--muted)]">
                auto-fills category + fields from vendor URLs, images, PDFs, or text
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
                    className="flex-1 bg-[var(--surface)] border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border)]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !parsing) handleParseUrl();
                    }}
                  />
                  <button
                    onClick={handleParseUrl}
                    disabled={parsing || !parseUrl.trim()}
                    className="text-xs px-4 py-2 border border-dashed border-[var(--border)] bg-[var(--background)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-fg)] disabled:opacity-40 transition-colors"
                  >
                    {parsing ? "PARSING…" : "PARSE URL"}
                  </button>
                </div>
              </div>

              <div className="md:col-span-4 flex flex-col">
                <label className="text-xs tracking-widest mb-1.5">
                  FILE <span className="text-[var(--muted)] font-normal normal-case tracking-normal">(image / pdf / text)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,text/plain,text/csv,text/markdown,application/json,.txt,.md,.csv,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleParseFile(f);
                    if (e.target) e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={parsing}
                  className="text-xs px-4 py-2 border border-dashed border-[var(--border)] bg-[var(--background)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-fg)] disabled:opacity-40 transition-colors"
                >
                  {parsing ? "PARSING…" : "UPLOAD FILE"}
                </button>
              </div>
            </div>

            {(parseError || parseNote || imagePreview || fileLabel) && (
              <div className="mt-4 flex flex-wrap items-start gap-4">
                {imagePreview && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imagePreview}
                    alt="uploaded part"
                    className="h-20 w-20 object-cover border border-[var(--border)]"
                  />
                )}
                {!imagePreview && fileLabel && (
                  <div className="px-3 py-2 text-[11px] border border-[var(--border)] bg-[var(--background)]">
                    {fileLabel}
                  </div>
                )}
                <div className="flex-1 min-w-[200px] text-[11px] space-y-1">
                  {parseError && (
                    <div className="text-[var(--danger)]">ERROR: {parseError}</div>
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
        <div className="bg-[var(--surface)] border-[3px] border-[var(--border)] shadow-[6px_6px_0_0_var(--shadow)]">
          <div className="px-6 pt-5 pb-5">
            <div className="serif text-xl mb-3">Category</div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = c.id === category.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={`text-xs px-3 py-2 border transition-colors ${
                      active
                        ? "bg-[var(--invert-bg)] text-[var(--invert-fg)] border-[var(--border)]"
                        : "bg-[var(--surface)] border-dashed border-[var(--border)] hover:bg-[var(--background)]"
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
        <div className="bg-[var(--surface)] border-[3px] border-[var(--border)] shadow-[6px_6px_0_0_var(--shadow)]">
          <div className="px-6 py-6">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
              <div className="serif text-xl">
                {category.group.charAt(0) + category.group.slice(1).toLowerCase()}{" "}
                <span className="italic text-[var(--muted)]">
                  / {category.label.charAt(0) + category.label.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="text-[11px] text-[var(--muted)] tracking-widest">
                {category.series}
              </div>
            </div>
            <div className="text-xs text-[var(--muted)] mb-6">
              FORMAT: {category.description}
            </div>

            {(() => {
              const primaryFields = category.fields.filter((f) => !f.advanced);
              const advancedFields = category.fields.filter((f) => f.advanced);
              const renderField = (f: Field) => {
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
                        className="h-4 w-4 accent-[var(--foreground)]"
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
                        className="bg-[var(--surface)] border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border)]"
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
                const suggestions = f.suggestions ? f.suggestions(values) : [];
                const listId = suggestions.length
                  ? `dl-${category.id}-${f.key}`
                  : undefined;
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
                      list={listId}
                      value={String(values[f.key] ?? "")}
                      onChange={(e) => setValue(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      spellCheck={false}
                      autoCapitalize="characters"
                      className="bg-[var(--surface)] border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border)]"
                    />
                    {listId && (
                      <datalist id={listId}>
                        {suggestions.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    )}
                  </div>
                );
              };
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    {primaryFields.map(renderField)}
                  </div>
                  {advancedFields.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-dashed border-[var(--divider)]">
                      <button
                        onClick={() => setShowAdvanced((v) => !v)}
                        className="text-[11px] tracking-widest hover:opacity-60 transition-opacity flex items-center gap-2"
                      >
                        <span>{showAdvanced ? "▾" : "▸"}</span>
                        {showAdvanced ? "HIDE" : "SHOW"} ADVANCED
                        <span className="text-[var(--muted)] normal-case tracking-normal">
                          ({advancedFields.length} auto-filled · click to override)
                        </span>
                      </button>
                      {showAdvanced && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-4">
                          {advancedFields.map(renderField)}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* PPN + REV */}
        <div className="bg-[var(--surface)] border-[3px] border-[var(--border)] shadow-[6px_6px_0_0_var(--shadow)]">
          <div className="px-6 py-6">
            <div className="serif text-xl mb-4">
              Part number <span className="italic">(PPN)</span>
              <span className="serif text-sm text-[var(--muted)] ml-2">
                — optional
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 flex flex-col">
                <label className="text-xs tracking-widest mb-1.5">SERIES</label>
                <select
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  className="bg-[var(--surface)] border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border)]"
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
                  className="bg-[var(--surface)] border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border)]"
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
                  className="bg-[var(--surface)] border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border)]"
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
                  className="bg-[var(--surface)] border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border)]"
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
        <div className="bg-[var(--invert-bg)] text-[var(--invert-fg)] border-[3px] border-[var(--border)] shadow-[6px_6px_0_0_var(--shadow)]">
          <div className="px-6 py-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs tracking-widest opacity-70">NAME</div>
                <button
                  onClick={() => copy(name, "name")}
                  disabled={!name}
                  className="text-[10px] px-3 py-1 border border-dashed border-[var(--invert-fg)] hover:bg-[var(--invert-fg)] hover:text-[var(--invert-bg)] disabled:opacity-40 transition-colors"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-[var(--invert-fg)]/30">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs tracking-widest opacity-70">PPN</div>
                  <button
                    onClick={() => copy(ppn, "ppn")}
                    disabled={!ppn}
                    className="text-[10px] px-3 py-1 border border-dashed border-[var(--invert-fg)] hover:bg-[var(--invert-fg)] hover:text-[var(--invert-bg)] disabled:opacity-40 transition-colors"
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
                    className="text-[10px] px-3 py-1 border border-dashed border-[var(--invert-fg)] hover:bg-[var(--invert-fg)] hover:text-[var(--invert-bg)] disabled:opacity-40 transition-colors"
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
          <div className="serif text-xl mb-3">Examples</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {category.examples.map((ex) => (
              <div
                key={ex}
                className="text-xs px-3 py-2 bg-[var(--surface)] border border-dashed border-[var(--border)] break-words"
              >
                {ex}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-8 md:px-16 py-6 text-[11px] text-[var(--muted)] border-t border-[var(--divider)]">
        golden rule: NOUN FIRST, MODIFIERS SECOND &middot; ALL CAPS &middot;
        comma + space separators &middot; leading zero on decimals &middot;
        &ldquo;X&rdquo; means &ldquo;by&rdquo;
      </footer>
    </main>
  );
}
