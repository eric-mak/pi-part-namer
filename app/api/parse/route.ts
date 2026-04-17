import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { CATEGORIES } from "@/lib/naming";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "anthropic/claude-sonnet-4.6";

const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [string, ...string[]];

const resultSchema = z.object({
  categoryId: z.enum(CATEGORY_IDS),
  values: z.record(z.string(), z.union([z.string(), z.boolean()])),
  reasoning: z.string().optional(),
});

function fieldSpec() {
  return CATEGORIES.map((c) => {
    const fields = c.fields
      .map((f) => {
        const options =
          f.type === "select" && f.options?.length
            ? ` options=[${f.options.filter(Boolean).join(" | ")}]`
            : "";
        const opt = f.optional ? " (optional)" : "";
        return `    - ${f.key} (${f.type})${opt}: ${f.label}${options}`;
      })
      .join("\n");
    return `- categoryId: "${c.id}" — ${c.group} / ${c.label}\n  format: ${c.description}\n  fields:\n${fields}`;
  }).join("\n\n");
}

const SYSTEM = `You classify mechanical / electromechanical parts into one of a fixed set of categories and extract structured values from a user-provided vendor page, product URL, or image of a part.

Return a JSON object with:
- categoryId: one of the allowed ids
- values: a flat object keyed by that category's field "key" names. Values are strings (use the exact option text for selects) or booleans (for checkboxes). OMIT keys you are unsure about.
- reasoning: 1 short sentence.

Rules:
- Use ALL CAPS for free-text strings that end up in the part name.
- Prefer the most specific category (SCREW / BOLT > NUT > WASHER > BEARING > BUSHING > RAW STOCK > ELECTROMECH > MISC > CUSTOM).
- For SCREW / BOLT: set "units" to "METRIC" (M-prefix threads) or "IMPERIAL" (fractional threads like 1/4-20). For imperial, leave pitch blank.
- Dimensions: no spaces around X for screws (M3X0.5X12). Spaces around X for raw stock / springs / bushings (1.0IN OD X 0.120IN T).
- Never invent vendor data. If unknown, leave the field out.

Categories:

${fieldSpec()}`;

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; PiPartNamer/1.0; +https://pi-part-namer.local)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const html = await res.text();
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";
  const metaDesc =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    )?.[1] ?? "";
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  const body = stripped.slice(0, 8000);
  return `URL: ${url}\nTITLE: ${title}\nDESCRIPTION: ${metaDesc}\n\nPAGE TEXT:\n${body}`;
}

export async function POST(req: Request) {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return NextResponse.json(
      {
        error:
          "AI_GATEWAY_API_KEY is not set. Get a key at https://vercel.com/dashboard/ai-gateway and add it to .env.local.",
      },
      { status: 500 },
    );
  }

  let body: { url?: string; image?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = body.url?.trim();
  const image = body.image?.trim();
  if (!url && !image) {
    return NextResponse.json(
      { error: "Provide either 'url' or 'image'" },
      { status: 400 },
    );
  }

  try {
    let userContent: Array<
      | { type: "text"; text: string }
      | { type: "image"; image: string | URL }
    >;

    if (image) {
      userContent = [
        {
          type: "text",
          text: "Identify this part and extract naming fields per PI CAD spec.",
        },
        { type: "image", image },
      ];
    } else {
      const pageText = await fetchPageText(url!);
      userContent = [
        {
          type: "text",
          text: `Identify this part from the vendor page and extract naming fields per PI CAD spec.\n\n${pageText}`,
        },
      ];
    }

    const { output } = await generateText({
      model: MODEL,
      system: SYSTEM,
      messages: [{ role: "user", content: userContent }],
      output: Output.object({ schema: resultSchema }),
    });

    return NextResponse.json(output);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
