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
