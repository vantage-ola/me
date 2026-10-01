My personal website and portfolio — built with Vite, React, and `@mdwrk/markdown-renderer-react`.

# What this is

A fast, markdown-first personal site. Content lives in `.md` files. The renderer handles parsing, theming, and output. No CMS, no database, no heavy framework config.

It also serves as the first real consumer of a portfolio package idea I am thinking of, in the [markdown_workspace](https://github.com/groupsum/markdown_workspace) repository (`@mdwrk/portfolio-kit` ). As patterns solidify here, they might get extracted there.

---

## What makes this different from just using Next.js + MDX

- No framework config overhead, pure Vite + the renderer
- The renderer already handles profiles, extensions, frontmatter, and theming
- Built on packages you control, no dependency on external CMS or framework opinions
- The same renderer that powers the full MdWrk editor powers the site, real dogfooding
- Path to a publishable package for others once patterns are proven

---

## Adding content

All content lives in the `content/` folder as markdown files with YAML frontmatter. No code changes needed to add a project or post — just drop a file.

**Add a project** — create `content/projects/your-slug.md`:

```yaml
---
title: Project Name
role: What you did
period: 2024 – present
status: active | shipped | archived
highlight: true
tags: [typescript, react]
links:
  - label: GitHub
    url: https://github.com/...
---

Description in markdown.
```

Set `highlight: true` to show it on the home page.

**Add a post** — create `content/posts/your-slug.md`:

```yaml
---
title: Post title
date: 2025-05-17
tags: [tag1, tag2]
excerpt: One sentence shown in the list.
---

Post body in markdown.
```

**Edit pages** — `content/about.md`, `content/uses.md`, `content/now.md` are plain markdown with no frontmatter required.


## Medium sync

`api/sync-medium.ts` is a Vercel Cron function that pulls new posts from the Medium
feed, converts them to markdown, and commits them to `content/posts/`. The commit
triggers a normal Vercel deploy, so published Medium posts appear on the site
without touching the code.

Content is committed rather than fetched at runtime because **Medium's RSS feed only
exposes the 10 most recent posts**. The feed cannot be the source of truth; git is.

`content/.medium-sync.json` records which Medium post ids have been imported. It is
the dedupe key, not the slug, because several posts here were ported by hand with
rewritten titles and slugs. The sync is **append-only**: anything already in the
manifest is never rewritten, so hand edits to titles, tags and excerpts are safe.
Editing a post on Medium after import will not change it here.

### Setup

Add these environment variables in the Vercel project:

| Variable            | Value                                                     |
| ------------------- | --------------------------------------------------------- |
| `CRON_SECRET`       | Any long random string. Vercel sends it as a bearer token. |
| `GITHUB_TOKEN`      | Fine-grained PAT, **Contents: read and write** on this repo only. |
| `GITHUB_REPOSITORY` | Optional. Defaults to the connected repo via `VERCEL_GIT_*`. |
| `GITHUB_BRANCH`     | Optional, defaults to `main`.                             |
| `MEDIUM_FEED_URL`   | Optional, defaults to the `iloveracing` feed.             |

The schedule lives in `vercel.json`. Hobby plans are limited to one run per day
with up to an hour of drift.

### Checking it

`?dryRun=1` reports exactly what would be imported and returns the generated
markdown without writing anything:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://<your-domain>/api/sync-medium?dryRun=1"
```

Imported posts get two extra frontmatter fields, `medium_id` and `medium_url`, for
provenance. Auto-generated `tags` come from Medium's categories and the `excerpt` is
cut from the first paragraph, so both are worth editing afterwards.

If `content/.medium-sync.json` goes missing while posts exist, the sync returns 409
and refuses to run rather than risk duplicating the blog. `?bootstrap=1` overrides.


## What's used

- [Vite](https://vite.dev) + React 19
- [`@mdwrk/markdown-renderer-react`](https://www.npmjs.com/package/@mdwrk/markdown-renderer-react) — markdown → React
- [`@mdwrk/ui-tokens`](https://www.npmjs.com/package/@mdwrk/ui-tokens) — CSS custom properties
- [`react-router-dom`](https://reactrouter.com) v7 — client-side routing
- [`yaml`](https://www.npmjs.com/package/yaml) — frontmatter parsing

## Sessions and support payments

`/sessions` offers three packages: one hour for ₦10,000, 90 minutes for
₦13,500, and two hours for ₦17,000. The longer packages show their savings
against the ₦10,000 hourly rate. Prices, durations, and package identifiers
live in `shared/session-pricing.mjs`, shared by the form, payment functions,
and flyer. The first-five prices are ₦5,000, ₦6,750, and ₦8,500.

A fourth option accepts requests for 3–20 hours. Agree the scope, total price,
and whether to split the time across calls by email. Create a Paystack invoice
or Payment Page for that agreed quote; fixed package checkout does not accept
custom amounts. The first-five discount also applies to an agreed custom quote.

Existing payment links sent before the package change still honor their
original ₦10,000 per hour price and signed discount.

For the three fixed packages, A Vercel
function emails each request to `olaoluwasanya1@gmail.com`. The email includes a
standard payment link and a signed 50% discount link for that person's chosen
duration and email. For the first five requests you approve, send the discount
link; send the standard link to everyone else. The discounted link expires after
30 days. The signed link is checked on the server before Paystack checkout,
and the Paystack return check accepts the corresponding half-price amount.
Keep a manual count of approved discount recipients and remove the offer from
`/sessions` and the flyer once all five are allocated. A discounted link can be reused during
its validity period, so only send it to a person you approve and check repeated
payments in Paystack before treating them as additional bookings. The payment
confirmation page asks the applicant to reply with their reference. Check it
in your Paystack Dashboard before emailing your Calendly link.

`/support` lets visitors choose an amount from ₦100 and pay through Paystack.
Both payment flows initialize the amount on the server and verify the returned
transaction before showing a success message. There is no need to create
separate Paystack Payment Pages for each amount.
For support payments, `/api/paystack-webhook` checks Paystack's signed
`charge.success` event and sends a short thank you email to the payer through
Resend. Set the live webhook URL in Paystack's API Keys & Webhooks settings to
`https://olaoluwa.work/api/paystack-webhook`. The webhook is required for the
email: the browser redirect alone does not send it. Payments made before the
webhook is configured will not trigger a retroactive thank you email.

Set these environment variables in Vercel for Production, Preview, and any
other environment where the forms should work:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | API key from Resend. Keep it server-side. |
| `RESEND_FROM` | Sender on a domain verified in Resend, such as `Olaoluwa <sessions@olaoluwa.work>`. |
| `PAYSTACK_SECRET_KEY` | Paystack secret key. Start with a test key, then switch to live after testing. Keep it server-side. |
| `SITE_URL` | Public portfolio origin, `https://olaoluwa.work`, with no trailing path. |
| `VITE_TURNSTILE_SITE_KEY` | Public sitekey for a Cloudflare Turnstile widget allowed on `olaoluwa.work`. |
| `TURNSTILE_SECRET_KEY` | Matching Turnstile secret key. Keep it server-side. |

Resend must verify the sender's domain before production emails will deliver.
The Gmail address above is the receiving inbox, not the sender. Do not put
secret keys in a `VITE_` variable. Run a test session request and a Paystack
test transaction before using live keys.

### Protecting the request form

The request function rejects missing or invalid Turnstile tokens on the server,
checks the verified hostname and action, and only sends email after validation.
Turnstile tokens expire and can only be used once. The form also has a hidden
honeypot field, input limits, and a duplicate-email idempotency key. Production
rejects Cloudflare's public test secret.

Create a Turnstile widget in Cloudflare for `olaoluwa.work`, then set its
sitekey and secret in Vercel. For local tests, the page uses Cloudflare's
published test sitekey. Use the matching test secret only in a non-production
environment. Do not use either test key on the live site.
If the live form says "Requests are temporarily unavailable," the production
build is missing `VITE_TURNSTILE_SITE_KEY`. Add the widget's sitekey to the
Vercel Production environment and redeploy; Vite embeds this value at build
time. The matching `TURNSTILE_SECRET_KEY` must also be present for submissions
to pass server verification.
See [Cloudflare's setup guide](https://developers.cloudflare.com/turnstile/get-started/)
for widget creation and domain settings.

For a hard request cap, add a Vercel Firewall rate-limit rule for the path
`/api/session-request` and method `POST`: fixed window, 3 requests per 10
minutes per IP, with the default 429 response. Publish the rule to production.
This is a dashboard setting and is not created by the code in this repository.
Vercel counts rate limits per region, so this is a practical spam cap rather
than an absolute global limit.
See [Vercel's rate limiting guide](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
for the dashboard steps.


## Session flyer

Open `/sessions/promo` for a responsive flyer in the site's dark and cyan theme.
Choose **Portrait** (1080 × 1350) or **Story** (1080 × 1920), then download the
PNG. Both sizes show the first-five offer, crossed-out regular prices, and the
session request URL. After the five discounted approvals are allocated, update
`src/components/SessionPoster.tsx` and `src/pages/Sessions.tsx` to retire the offer.

`npm run build` generates PNG and SVG files in `public/generated` and copies
them into `dist/generated`. These files are regenerated rather than committed.
The flyer layout lives in `src/components/SessionPoster.tsx`; prices come from
the shared package file. Run the build once before downloading images in local
development. Figtree is bundled under its OFL license; static font files make
image exports work without installed system fonts or an external font request.

## SEO and link previews

The build renders every known page, blog post, and project into its own HTML
file. Article content, links, and metadata are available before JavaScript runs.
React hydrates the rendered page for navigation and forms. Payment pages render
in the browser because their contents depend on private query parameters.

Each route gets a title, description, canonical URL, Open Graph and Twitter
metadata, and a generated 1200 × 630 preview image. Posts include publication
and modification dates and `BlogPosting` structured data; projects include
`CreativeWork` data. Breadcrumbs and author information are included where
applicable. Metadata also updates during client-side navigation.

Post frontmatter supports `excerpt` for the description, `updated` for the
modification date, and an optional absolute `canonical_url` if another URL is
the preferred original. Imported Medium posts retain their source attribution;
their portfolio URL is canonical by default. Search engines may choose Medium
as the original when the same article appears on both sites.

The build writes `/sitemap.xml`, `/robots.txt`, and a custom 404 page. Payment
and flyer utility pages are marked `noindex` and excluded from the sitemap.
Vercel uses `cleanUrls` to serve route-specific HTML; keep the old catch-all
rewrite removed so crawlers receive the correct page and unknown URLs get 404.
New posts imported by the Medium sync appear in HTML, the sitemap, and preview
images on the following deployment.

After deployment, verify `olaoluwa.work` in Google Search Console, submit
`https://olaoluwa.work/sitemap.xml`, and inspect the home, sessions, and a blog
URL. Account verification and sitemap submission are dashboard steps, not
performed by this build. Preview services may cache the previous metadata.

### Checks

Run `npm run build`, `npm run lint`, and `npm run check:build`. The build check
validates page metadata, structured data, internal links, sitemap contents,
and image sizes. With Node 22.6 or newer, run `npm test` for request,
price, signed-discount, legacy-link, and payment verification checks. These
checks intercept all outgoing requests and use fake credentials.
