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

`/sessions` takes requests for one or two hours at ₦10,000 per hour. A Vercel
function emails each request to `olaoluwasanya1@gmail.com`. The email includes a
standard payment link and a signed 50% discount link for that person's chosen
duration and email. For the first five requests you approve, send the discount
link; send the standard link to everyone else. The discounted link expires after
30 days. The signed link is checked on the server before Paystack checkout,
and the Paystack return check accepts the corresponding half-price amount.
Keep a manual count of approved discount recipients and remove the offer from
`/sessions` once all five are allocated. A discounted link can be reused during
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
