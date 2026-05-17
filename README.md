My personal website and portfolio — built with Vite, React, and `@mdwrk/markdown-renderer-react`.

# What this is

A fast, markdown-first personal site. Content lives in `.md` files. The renderer handles parsing, theming, and output. No CMS, no database, no heavy framework config.

It also serves as the first real consumer of a portfolio package idea I am building in the markdown_workspace repository (`@mdwrk/portfolio-kit` — in progress). As patterns solidify here, they might get extracted there.

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


## What's used

- [Vite](https://vite.dev) + React 19
- [`@mdwrk/markdown-renderer-react`](https://www.npmjs.com/package/@mdwrk/markdown-renderer-react) — markdown → React
- [`@mdwrk/ui-tokens`](https://www.npmjs.com/package/@mdwrk/ui-tokens) — CSS custom properties
- [`react-router-dom`](https://reactrouter.com) v7 — client-side routing
- [`yaml`](https://www.npmjs.com/package/yaml) — frontmatter parsing
