# PI Part Namer

π part namer — internal tool for generating standard-compliant PI part names
following the
[CAD Standard Practices](https://www.notion.so/CAD-Standard-Practices-2fd0d8d430d480a4a198e8ea9c28f430)
naming convention.

- Pick a category (fastener / bearing / raw stock / electromech / custom / …)
  and fill structured fields to produce a correctly-formatted name (ALL CAPS,
  `, ` separators, noun-first, metric/imperial dims, TF, etc.).
- Build the 7-digit PPN with series + dash + revision, and get a filename in
  `[PPN]_[REV] [NAME]` form.
- Paste a vendor URL or upload a photo and the app will infer the category
  and auto-fill the fields via the Vercel AI Gateway.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

### Optional: enable AI parsing

Create `.env.local` with a Vercel AI Gateway key:

```
AI_GATEWAY_API_KEY=your_key_here
```

Get a key at <https://vercel.com/dashboard/ai-gateway>.
When deployed to Vercel the key is wired automatically via OIDC.

## Stack

- Next.js 16 (App Router, Turbopack)
- Tailwind CSS v4
- AI SDK v6 + Vercel AI Gateway (`anthropic/claude-sonnet-4.6`)
- TypeScript
